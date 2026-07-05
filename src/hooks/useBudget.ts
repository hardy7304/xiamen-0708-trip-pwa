import { useState, useCallback, useMemo } from 'react';
import { budgetCategories, DEFAULT_EXCHANGE_RATE } from '../data/budget';
import { useExpenses } from './useExpenses';

export interface SettlementSummary {
  mePaidCny: number;
  meSelfCny: number;
  meOweSharedCny: number;
  yitingPaidCny: number;
  yitingSelfCny: number;
  yitingOweSharedCny: number;
  settlementCny: number; // positive = yiting owes me, negative = I owe yiting
  mePaidTwd: number;
  meSelfTwd: number;
  meOweSharedTwd: number;
  yitingPaidTwd: number;
  yitingSelfTwd: number;
  yitingOweSharedTwd: number;
  settlementTwd: number;
  cashCnyRemaining: number; // 人民幣現金剩餘
}

export function useBudget() {
  const { expenses, getTotalByCategory } = useExpenses();
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

  // Settlement summary
  const settlement = useMemo((): SettlementSummary => {
    let mePaidCny = 0, mePaidTwd = 0;
    let yitingPaidCny = 0, yitingPaidTwd = 0;
    let meSelfCny = 0, meSelfTwd = 0;
    let sharedCny = 0, sharedTwd = 0;
    let yitingSelfCny = 0, yitingSelfTwd = 0;
    let cashCnyRemaining = 0;

    expenses.forEach(e => {
      const isCny = e.currency === 'CNY';
      const amt = e.amount;

      if (e.paidBy === 'me') {
        if (isCny) mePaidCny += amt;
        else mePaidTwd += amt;
      } else {
        if (isCny) yitingPaidCny += amt;
        else yitingPaidTwd += amt;
      }

      if (e.expenseFor === 'self') {
        if (isCny) meSelfCny += amt;
        else meSelfTwd += amt;
      } else if (e.expenseFor === 'yiting') {
        if (isCny) yitingSelfCny += amt;
        else yitingSelfTwd += amt;
      } else {
        if (isCny) sharedCny += amt;
        else sharedTwd += amt;
      }

      // Cash CNY remaining: only paidBy=me, paymentMethod=cash_cny, currency=CNY
      if (e.paidBy === 'me' && e.paymentMethod === 'cash_cny' && isCny) {
        cashCnyRemaining += amt;
      }
    });

    const meOweSharedCny = sharedCny / 2;
    const meOweSharedTwd = sharedTwd / 2;
    const yitingOweSharedCny = sharedCny / 2;
    const yitingOweSharedTwd = sharedTwd / 2;

    const yitingShouldPay = yitingSelfCny + yitingOweSharedCny;
    const settlementCny = yitingShouldPay - yitingPaidCny;

    const yitingShouldPayTwd = yitingSelfTwd + yitingOweSharedTwd;
    const settlementTwd = yitingShouldPayTwd - yitingPaidTwd;

    return {
      mePaidCny, meSelfCny, meOweSharedCny,
      yitingPaidCny, yitingSelfCny, yitingOweSharedCny, settlementCny,
      mePaidTwd, meSelfTwd, meOweSharedTwd,
      yitingPaidTwd, yitingSelfTwd, yitingOweSharedTwd, settlementTwd,
      cashCnyRemaining,
    };
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