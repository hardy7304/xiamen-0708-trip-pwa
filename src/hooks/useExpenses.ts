import { useState, useEffect, useCallback } from 'react';
import { getAllExpenses, addExpense, putExpense, deleteExpense, addExpenses, type ExpenseRecord } from '../utils/expenseDB';
import { getPin } from '../utils/pin';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllExpenses().then(data => {
      setExpenses(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }).catch(e => {
      console.error('useExpenses load error:', e);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/expenses')
      .then(r => r.json())
      .then((data: { expenses?: ExpenseRecord[] }) => {
        if (data.expenses && data.expenses.length > 0) {
          addExpenses(data.expenses).then(() => {
            return getAllExpenses();
          }).then(all => {
            setExpenses(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const pushToKV = useCallback((records: ExpenseRecord[]) => {
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-trip-pin': getPin() || '' },
      body: JSON.stringify({ expenses: records }),
    }).catch(() => {});
  }, []);

  const add = useCallback(async (record: ExpenseRecord) => {
    try {
      await addExpense(record);
      setExpenses(prev => [record, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      pushToKV([record]);
    } catch (e) { console.error('add expense error:', e); throw e; }
  }, [pushToKV]);

  const edit = useCallback(async (record: ExpenseRecord) => {
    try {
      await putExpense(record);
      setExpenses(prev => prev.map(e => e.id === record.id ? record : e).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      pushToKV([record]);
    } catch (e) { console.error('edit expense error:', e); throw e; }
  }, [pushToKV]);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (e) { console.error('remove expense error:', e); throw e; }
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