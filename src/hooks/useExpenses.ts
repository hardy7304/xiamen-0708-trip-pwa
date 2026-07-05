import { useState, useEffect, useCallback } from 'react';
import { getAllExpenses, addExpense, putExpense, deleteExpense, addExpenses, type ExpenseRecord } from '../utils/expenseDB';
import { getPin } from '../utils/pin';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from IndexedDB
  const loadLocal = useCallback(async () => {
    const data = await getAllExpenses();
    setExpenses(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useEffect(() => { loadLocal().finally(() => setLoading(false)); }, [loadLocal]);

  // Pull from KV and merge into local
  const pullFromKV = useCallback(async () => {
    try {
      const resp = await fetch('/api/expenses');
      const data = await resp.json();
      if (data.expenses && data.expenses.length > 0) {
        await addExpenses(data.expenses);
        await loadLocal();
      }
    } catch { /* ignore */ }
  }, [loadLocal]);

  // Pull on mount
  useEffect(() => { pullFromKV(); }, [pullFromKV]);

  // Pull on visibility change (user switches tabs/windows)
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') pullFromKV(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pullFromKV]);

  // Push to KV
  const pushToKV = useCallback(async (records: ExpenseRecord[]): Promise<boolean> => {
    try {
      const resp = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-trip-pin': getPin() || '' },
        body: JSON.stringify({ expenses: records }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      return data.success === true;
    } catch { return false; }
  }, []);

  const add = useCallback(async (record: ExpenseRecord): Promise<boolean> => {
    await addExpense(record);
    await loadLocal();
    return await pushToKV([record]);
  }, [loadLocal, pushToKV]);

  const edit = useCallback(async (record: ExpenseRecord): Promise<boolean> => {
    await putExpense(record);
    await loadLocal();
    return await pushToKV([record]);
  }, [loadLocal, pushToKV]);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const getTotalByCategory = useCallback((category: string) => {
    const filtered = expenses.filter(e => e.category === category);
    return {
      twd: filtered.filter(e => e.currency === 'TWD').reduce((s, e) => s + e.amount, 0),
      cny: filtered.filter(e => e.currency === 'CNY').reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses]);

  return { expenses, addExpense: add, editExpense: edit, removeExpense: remove, getTotalByCategory, loading };
}