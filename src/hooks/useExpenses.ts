import { useState, useEffect, useCallback } from 'react';
import { getAllExpenses, addExpense, deleteExpense, updateExpense, type ExpenseRecord } from '../utils/expenseDB';

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

  const add = useCallback(async (record: ExpenseRecord) => {
    try {
      await addExpense(record);
      setExpenses(prev => [record, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e) {
      console.error('add expense error:', e);
      throw e;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error('remove expense error:', e);
      throw e;
    }
  }, []);

  const edit = useCallback(async (id: string, data: Partial<ExpenseRecord>) => {
    try {
      await updateExpense(id, data);
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    } catch (e) {
      console.error('edit expense error:', e);
      throw e;
    }
  }, []);

  const getTotalByCategory = useCallback((category: string) => {
    const filtered = expenses.filter(e => e.category === category);
    return {
      twd: filtered.filter(e => e.currency === 'TWD').reduce((s, e) => s + e.amount, 0),
      rmb: filtered.filter(e => e.currency === 'RMB').reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses]);

  return { expenses, addExpense: add, removeExpense: remove, editExpense: edit, getTotalByCategory, loading };
}