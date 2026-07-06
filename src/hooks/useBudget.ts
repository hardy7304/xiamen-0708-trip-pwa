import { useMemo } from 'react';
import { budgetCategories, DEFAULT_EXCHANGE_RATE } from '../data/budget';
import { useExpenses } from './useExpenses';
import { normalizeExpense } from '../utils/expenseDB';
import type { BudgetSettings } from '../data/budgetSettings';

export interface SettlementSummary {
  balances: Record<string, { cny: number; twd: number }>; // person → {cny, twd} net balance (positive = should receive)
  paid: Record<string, { cny: number; twd: number }>;
  owed: Record<string, { cny: number; twd: number }>;
  personal: Record<string, { cny: number; twd: number }>;
  shared: Record<string, { cny: number; twd: number }>;
  recommendations: { from: string; to: string; currency: 'CNY' | 'TWD'; amount: number }[];
  initialCnyCash: number;
  cnyCashSpent: number;
  cashCnyRemaining: number;
}

export interface CategoryDetail {
  key: string;
  label: string;
  icon: string;
  currency: 'TWD' | 'RMB';
  budget: number;       // in native currency
  spentTwd: number;
  spentCny: number;
  spentEquiv: number;
  maxEquiv: number;     // budget in TWD equivalent
  percent: number;
  remaining: number;    // in TWD equivalent
}

function round(n: number): number { return Math.round(n * 100) / 100; }

export function useBudget(settings?: BudgetSettings) {
  const { expenses: rawExpenses, getTotalByCategory } = useExpenses();
  const expenses = useMemo(() => rawExpenses.map(normalizeExpense), [rawExpenses]);

  const exchangeRate = settings ? settings.exchangeRate : DEFAULT_EXCHANGE_RATE;

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

  const budgetMaxTwd = settings ? settings.total.TWD : budgetCategories.reduce((s, c) => s + c.twdMax, 0);
  const budgetMaxCny = settings ? settings.total.RMB : budgetCategories.reduce((s, c) => s + c.cnyMax, 0);
  const budgetMaxEquiv = budgetMaxTwd + budgetMaxCny * exchangeRate;

  const categoryDetails = useMemo((): CategoryDetail[] => {
    if (settings) {
      return settings.categories
        .filter(c => c.enabled)
        .map(c => {
          const spent = getTotalByCategory(c.id);
          const spentEquiv = spent.twd + spent.cny * exchangeRate;
          const maxEquiv = c.currency === 'RMB' ? c.budget * exchangeRate : c.budget;
          const percent = maxEquiv > 0 ? (spentEquiv / maxEquiv) * 100 : 0;
          return {
            key: c.id,
            label: c.label,
            icon: c.icon,
            currency: c.currency,
            budget: c.budget,
            spentTwd: spent.twd,
            spentCny: spent.cny,
            spentEquiv,
            maxEquiv,
            percent,
            remaining: maxEquiv - spentEquiv,
          };
        });
    }
    return budgetCategories.map(cat => {
      const spent = getTotalByCategory(cat.key);
      const isRmb = cat.cnyMax > 0;
      const budget = isRmb ? cat.cnyMax : cat.twdMax;
      const currency = isRmb ? 'RMB' as const : 'TWD' as const;
      const maxEquiv = isRmb ? budget * exchangeRate : budget;
      const spentEquiv = spent.twd + spent.cny * exchangeRate;
      const percent = maxEquiv > 0 ? (spentEquiv / maxEquiv) * 100 : 0;
      return {
        key: cat.key,
        label: cat.label,
        icon: cat.icon,
        currency,
        budget,
        spentTwd: spent.twd,
        spentCny: spent.cny,
        spentEquiv,
        maxEquiv,
        percent,
        remaining: maxEquiv - spentEquiv,
      };
    });
  }, [getTotalByCategory, exchangeRate, settings]);

  // CNY cash spent: independent of settled status — cash is spent regardless
  const cnyCashSpent = useMemo(() => {
    return expenses.reduce((sum, e) => {
      if (e.currency === 'CNY' && e.paymentMethod === 'cash_cny') {
        return round(sum + e.amount);
      }
      if (e.paymentMethod === 'cash_cny' && e.currency !== 'CNY') {
        console.warn('[useBudget] cash_cny payment with non-CNY currency', { id: e.id, currency: e.currency, amount: e.amount });
      }
      return sum;
    }, 0);
  }, [expenses]);

  const initialCnyCash = useMemo(() => {
    if (settings) return settings.initialCnyCash ?? settings.total.RMB;
    return budgetCategories.reduce((s, c) => s + c.cnyMax, 0);
  }, [settings]);

  const cashCnyRemaining = round(initialCnyCash - cnyCashSpent);

  // Settlement: per-person balance using splitDetails
  const settlement = useMemo((): SettlementSummary => {
    const persons = ['me', 'yiting'] as const;
    const paid: Record<string, { cny: number; twd: number }> = {};
    const owed: Record<string, { cny: number; twd: number }> = {};
    const personal: Record<string, { cny: number; twd: number }> = {};
    const shared: Record<string, { cny: number; twd: number }> = {};

    persons.forEach(p => {
      paid[p] = { cny: 0, twd: 0 };
      owed[p] = { cny: 0, twd: 0 };
      personal[p] = { cny: 0, twd: 0 };
      shared[p] = { cny: 0, twd: 0 };
    });

    expenses.forEach(e => {
      if (e.settled) return;
      const isCny = e.currency === 'CNY';
      const cur = isCny ? 'cny' as const : 'twd' as const;
      const amt = e.amount;

      if (paid[e.paidBy]) paid[e.paidBy][cur] = round(paid[e.paidBy][cur] + amt);

      const sd = e.splitDetails || {};
      if (e.expenseFor === 'self' || e.expenseFor === 'yiting' || e.splitType === 'personal') {
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
        Object.entries(sd).forEach(([person, share]) => {
          if (owed[person]) owed[person][cur] = round(owed[person][cur] + share);
          if (shared[person]) shared[person][cur] = round(shared[person][cur] + share);
        });
      }
    });

    const balances: Record<string, { cny: number; twd: number }> = {};
    persons.forEach(p => {
      balances[p] = {
        cny: round((paid[p]?.cny || 0) - (owed[p]?.cny || 0)),
        twd: round((paid[p]?.twd || 0) - (owed[p]?.twd || 0)),
      };
    });

    const recommendations: { from: string; to: string; currency: 'CNY' | 'TWD'; amount: number }[] = [];
    (['cny', 'twd'] as const).forEach(cur => {
      const c = cur === 'cny' ? 'CNY' as const : 'TWD' as const;
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
          if (balances[debtor]) balances[debtor][cur] = round((balances[debtor][cur] || 0) + transfer);
          if (balances[creditor]) balances[creditor][cur] = round((balances[creditor][cur] || 0) - transfer);
        }

        if (Math.abs(balances[debtor]?.[cur] || 0) < 0.01) di++;
        if (Math.abs(balances[creditor]?.[cur] || 0) < 0.01) ci++;
      }
    });

    return { balances, paid, owed, personal, shared, recommendations, initialCnyCash, cnyCashSpent, cashCnyRemaining };
  }, [expenses, settings]);

  return {
    budgets: categoryDetails,
    totals,
    budgetMax: { twd: budgetMaxTwd, cny: budgetMaxCny, equiv: budgetMaxEquiv },
    exchangeRate,
    settlement,
  };
}