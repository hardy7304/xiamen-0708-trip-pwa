import { useState, useCallback, useMemo } from 'react';
import { budgetCategories, DEFAULT_EXCHANGE_RATE } from '../data/budget';
import { useExpenses } from './useExpenses';

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
    let totalRmb = 0;
    expenses.forEach(e => {
      if (e.currency === 'TWD') totalTwd += e.amount;
      else totalRmb += e.amount;
    });
    const totalTwdEquivalent = totalTwd + totalRmb * exchangeRate;
    return { totalTwd, totalRmb, totalTwdEquivalent };
  }, [expenses, exchangeRate]);

  const budgetMaxTwd = useMemo(() => budgetCategories.reduce((s, c) => s + c.twdMax, 0), []);
  const budgetMaxRmb = useMemo(() => budgetCategories.reduce((s, c) => s + c.rmbMax, 0), []);
  const budgetMaxEquiv = budgetMaxTwd + budgetMaxRmb * exchangeRate;

  const categoryDetails = useMemo(() => {
    return budgetCategories.map(cat => {
      const spent = getTotalByCategory(cat.key);
      const maxEquiv = cat.twdMax + cat.rmbMax * exchangeRate;
      const spentEquiv = spent.twd + spent.rmb * exchangeRate;
      const percent = maxEquiv > 0 ? (spentEquiv / maxEquiv) * 100 : 0;
      return {
        ...cat,
        spentTwd: spent.twd,
        spentRmb: spent.rmb,
        spentEquiv,
        maxEquiv,
        percent,
        remaining: maxEquiv - spentEquiv,
      };
    });
  }, [getTotalByCategory, exchangeRate]);

  return { budgets: categoryDetails, totals, budgetMax: { twd: budgetMaxTwd, rmb: budgetMaxRmb, equiv: budgetMaxEquiv }, exchangeRate, setExchangeRate };
}