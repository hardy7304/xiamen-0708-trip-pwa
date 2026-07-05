import { useState, useEffect, useCallback } from 'react';
import { getAllExpenses, addExpense, putExpense, deleteExpense, addExpenses, type ExpenseRecord } from '../utils/expenseDB';
import { getPin } from '../utils/pin';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLocal = useCallback(async () => {
    const data = await getAllExpenses();
    setExpenses(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useEffect(() => { loadLocal().finally(() => setLoading(false)); }, [loadLocal]);

  const pullFromKV = useCallback(async () => {
    try {
      const resp = await fetch('/api/expenses');
      const data = await resp.json();
      if (data.expenses) {
        await addExpenses(data.expenses);
        await loadLocal();
      }
    } catch { /* ignore */ }
  }, [loadLocal]);

  useEffect(() => { pullFromKV(); }, [pullFromKV]);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') pullFromKV(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pullFromKV]);

  const pushToKV = useCallback(async (records: ExpenseRecord[], mode: 'merge' | 'replace' = 'merge'): Promise<boolean> => {
    try {
      if (mode === 'replace' && records.length === 0) {
        // 空陣列是合法結果（刪除全部）
      }
      const resp = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-trip-pin': getPin() || '' },
        body: JSON.stringify({ expenses: records, mode }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      return data.success === true;
    } catch { return false; }
  }, []);

  const add = useCallback(async (record: ExpenseRecord): Promise<boolean> => {
    await addExpense(record);
    await loadLocal();
    return await pushToKV([record], 'merge');
  }, [loadLocal, pushToKV]);

  const edit = useCallback(async (record: ExpenseRecord): Promise<boolean> => {
    await putExpense(record);
    await loadLocal();
    return await pushToKV([record], 'merge');
  }, [loadLocal, pushToKV]);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    // 重新讀取 IndexedDB 以取得最新 state
    const all = await getAllExpenses();
    const updated = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setExpenses(updated);
    // 同步刪除後的完整清單到 KV（replace mode）
    await pushToKV(updated, 'replace');
  }, [pushToKV]);

  const getTotalByCategory = useCallback((category: string) => {
    const filtered = expenses.filter(e => e.category === category);
    return {
      twd: filtered.filter(e => e.currency === 'TWD').reduce((s, e) => s + e.amount, 0),
      cny: filtered.filter(e => e.currency === 'CNY').reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses]);

  return { expenses, addExpense: add, editExpense: edit, removeExpense: remove, getTotalByCategory, loading };
}