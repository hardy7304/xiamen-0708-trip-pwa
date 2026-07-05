import { useState, useEffect, useCallback } from 'react';
import { getAllExpenses, addExpense, putExpense, deleteExpense, replaceAllExpenses, type ExpenseRecord } from '../utils/expenseDB';
import { getPin } from '../utils/pin';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLocal = useCallback(async () => {
    const data = await getAllExpenses();
    setExpenses(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useEffect(() => { loadLocal().finally(() => setLoading(false)); }, [loadLocal]);

  // Pull from KV: REPLACE all local data with what KV has
  const pullFromKV = useCallback(async () => {
    try {
      const resp = await fetch('/api/expenses');
      const data = await resp.json();
      if (data.expenses !== undefined) {
        console.log('[pullFromKV] replacing local with KV snapshot, count:', data.count);
        await replaceAllExpenses(data.expenses || []);
        await loadLocal();
      }
    } catch (e) { console.warn('[pullFromKV] failed', e); }
  }, [loadLocal]);

  useEffect(() => { pullFromKV(); }, [pullFromKV]);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') pullFromKV(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pullFromKV]);

  const pushToKV = useCallback(async (records: ExpenseRecord[], mode: 'merge' | 'replace' = 'merge'): Promise<boolean> => {
    console.log('[pushToKV]', { mode, count: records.length, ids: records.map(e => e.id) });
    try {
      const resp = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-trip-pin': getPin() || '' },
        body: JSON.stringify({ expenses: records, mode }),
      });
      if (!resp.ok) { console.warn('[pushToKV] HTTP error', resp.status); return false; }
      const data = await resp.json();
      if (!data.success) { console.warn('[pushToKV] API returned success:false', data); return false; }
      console.log('[pushToKV] success', data);
      return true;
    } catch (e) { console.warn('[pushToKV] fetch error', e); return false; }
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
    console.log('[DELETE] removing', id);
    await deleteExpense(id);
    const all = await getAllExpenses();
    const updated = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setExpenses(updated);
    console.log('[DELETE] updated count:', updated.length);
    const result = await pushToKV(updated, 'replace');
    if (!result) {
      alert('本機已刪除，但雲端刪除同步失敗，重新整理後可能會恢復');
    } else {
      console.log('[DELETE] cloud replace success');
    }
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