import { useState, useCallback, useMemo } from 'react';
import { budgetCategories, DEFAULT_EXCHANGE_RATE } from '../data/budget';
import { useExpenses } from './useExpenses';
import { normalizeExpense } from '../utils/expenseDB';

export interface SettlementSummary {
  balances: Record<string, { cny: number; twd: number }>; // person → {cny, twd} net balance (positive = should receive)
  paid: Record<string, { cny: number; twd: number }>;
  owed: Record<string, { cny: number; twd: number }>;
  personal: Record<string, { cny: number; twd: number }>;
  shared: Record<string, { cny: number; twd: number }>;
  recommendations: { from: string; to: string; currency: 'CNY' | 'TWD'; amount: number }[];
  cashCnyRemaining: number;
}

function round(n: number): number { return Math.round(n * 100) / 100; }

export function useBudget() {
  const { expenses: rawExpenses, getTotalByCategory } = useExpenses();
  const expenses = useMemo(() => rawExpenses.map(normalizeExpense), [rawExpenses]);

  const [exchangeRate, setExchangeRateState] = useState(() => {
    try {
      const stored = localStorage.getItem('xiamen-exchange-rate');
      return stored ? parseFloat(stored) : DEFAULT_EXCHANGE_RATE;
    } catch { return DEFAULT_EXCHANGE_RATE; }
  });

  const setExchangeRate = useCallback((rate: number) => {
    setExchangeRateState(rate);
    try { localStorage.setItem('xiamen-exchange-rate', String(rate)); } catch { /* ignore */ }
  }, []);

  const totals = useMemo(() => {
    let totalTwd = 0;
    let totalCny = 0;
    expenses.forEach(e => {
      if (e.currency === 'TWD') totalTwd += e.amount;
      else totalCny += e.amount;
    });
    const totalTwdEquivalent = totalTwd + totalCny * exchangeRate;
    return { totalTwd, totalCny, totalTwdEquivalent };
  }, [expenses, exchangeRate]);

  const budgetMaxTwd = useMemo(() => budgetCategories.reduce((s, c) => s + c.twdMax, 0), []);
  const budgetMaxCny = useMemo(() => budgetCategories.reduce((s, c) => s + c.cnyMax, 0), []);
  const budgetMaxEquiv = budgetMaxTwd + budgetMaxCny * exchangeRate;

  const categoryDetails = useMemo(() => {
    return budgetCategories.map(cat => {
      const spent = getTotalByCategory(cat.key);
      const maxEquiv = cat.twdMax + cat.cnyMax * exchangeRate;
      const spentEquiv = spent.twd + spent.cny * exchangeRate;
      const percent = maxEquiv > 0 ? (spentEquiv / maxEquiv) * 100 : 0;
      return {
        ...cat,
        spentTwd: spent.twd,
        spentCny: spent.cny,
        spentEquiv,
        maxEquiv,
        percent,
        remaining: maxEquiv - spentEquiv,
      };
    });
  }, [getTotalByCategory, exchangeRate]);

  // Settlement: per-person balance using splitDetails
  const settlement = useMemo((): SettlementSummary => {
    const persons = ['me', 'yiting'] as const;
    const paid: Record<string, { cny: number; twd: number }> = {};
    const owed: Record<string, { cny: number; twd: number }> = {};
    const personal: Record<string, { cny: number; twd: number }> = {};
    const shared: Record<string, { cny: number; twd: number }> = {};
    let cashCnyRemaining = 0;

    persons.forEach(p => {
      paid[p] = { cny: 0, twd: 0 };
      owed[p] = { cny: 0, twd: 0 };
      personal[p] = { cny: 0, twd: 0 };
      shared[p] = { cny: 0, twd: 0 };
    });

    expenses.forEach(e => {
      if (e.settled) return; // skip settled expenses
      const isCny = e.currency === 'CNY';
      const cur = isCny ? 'cny' as const : 'twd' as const;
      const amt = e.amount;

      // paid
      if (paid[e.paidBy]) paid[e.paidBy][cur] = round(paid[e.paidBy][cur] + amt);

      // owed via splitDetails
      const sd = e.splitDetails || {};
      if (e.expenseFor === 'self' || e.expenseFor === 'yiting' || e.splitType === 'personal') {
        // Determine who this personal expense belongs to
        let target: string = 'me';
        if (e.expenseFor === 'yiting') {
          target = 'yiting';
        } else if (e.splitType === 'personal' && e.splitDetails) {
          const participants = Object.keys(e.splitDetails);
          if (participants.length === 1) {
            target = participants[0];
          }
        }
        if (owed[target]) owed[target][cur] = round(owed[target][cur] + amt);
        if (personal[target]) personal[target][cur] = round(personal[target][cur] + amt);
      } else {
        // shared / equal / amount / ratio
        Object.entries(sd).forEach(([person, share]) => {
          if (owed[person]) owed[person][cur] = round(owed[person][cur] + share);
          if (shared[person]) shared[person][cur] = round(shared[person][cur] + share);
        });
      }

      // Cash CNY remaining
      if (e.paidBy === 'me' && e.paymentMethod === 'cash_cny' && isCny) {
        cashCnyRemaining = round(cashCnyRemaining + amt);
      }
    });

    // Balances: paid - owed (positive = should receive)
    const balances: Record<string, { cny: number; twd: number }> = {};
    persons.forEach(p => {
      balances[p] = {
        cny: round((paid[p]?.cny || 0) - (owed[p]?.cny || 0)),
        twd: round((paid[p]?.twd || 0) - (owed[p]?.twd || 0)),
      };
    });

    // Recommendations: for each currency, find net positive → net negative transfers
    const recommendations: { from: string; to: string; currency: 'CNY' | 'TWD'; amount: number }[] = [];
    (['cny', 'twd'] as const).forEach(cur => {
      const c = cur === 'cny' ? 'CNY' as const : 'TWD' as const;
      // Find who should receive (positive balance) and who should pay (negative balance)
      const creditors = persons.filter(p => balances[p]?.[cur] > 0.01).sort((a, b) => (balances[b]?.[cur] || 0) - (balances[a]?.[cur] || 0));
      const debtors = persons.filter(p => balances[p]?.[cur] < -0.01).sort((a, b) => (balances[a]?.[cur] || 0) - (balances[b]?.[cur] || 0));

      let di = 0, ci = 0;
      while (di < debtors.length && ci < creditors.length) {
        const debtor = debtors[di];
        const creditor = creditors[ci];
        const debtAmt = Math.abs(balances[debtor]?.[cur] || 0);
        const creditAmt = balances[creditor]?.[cur] || 0;
        const transfer = round(Math.min(debtAmt, creditAmt));

        if (transfer > 0.01) {
          recommendations.push({ from: debtor, to: creditor, currency: c, amount: transfer });
          // Simulate settlement
          if (balances[debtor]) balances[debtor][cur] = round((balances[debtor][cur] || 0) + transfer);
          if (balances[creditor]) balances[creditor][cur] = round((balances[creditor][cur] || 0) - transfer);
        }

        if (Math.abs(balances[debtor]?.[cur] || 0) < 0.01) di++;
        if (Math.abs(balances[creditor]?.[cur] || 0) < 0.01) ci++;
      }
    });

    return { balances, paid, owed, personal, shared, recommendations, cashCnyRemaining };
  }, [expenses]);

  return {
    budgets: categoryDetails,
    totals,
    budgetMax: { twd: budgetMaxTwd, cny: budgetMaxCny, equiv: budgetMaxEquiv },
    exchangeRate,
    setExchangeRate,
    settlement,
  };
}