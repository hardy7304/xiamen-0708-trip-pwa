import { useState, useCallback } from 'react';
import { budgetCategories } from '../data/budget';
import { defaultBudgetSettings, type BudgetSettings, type BudgetCategorySetting } from '../data/budgetSettings';

const STORAGE_KEY = 'trip_budget_settings_v1';

function loadSettings(): BudgetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BudgetSettings;
  } catch { /* ignore */ }
  return defaultBudgetSettings(budgetCategories);
}

function saveSettings(s: BudgetSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function useBudgetSettings() {
  const [settings, setSettings] = useState<BudgetSettings>(loadSettings);

  const updateTotal = useCallback((currency: 'TWD' | 'RMB', value: number) => {
    setSettings(prev => {
      const next = { ...prev, total: { ...prev.total, [currency]: Math.max(0, value || 0) } };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Pick<BudgetCategorySetting, 'label' | 'currency' | 'budget' | 'enabled'>>) => {
    setSettings(prev => {
      const next = {
        ...prev,
        categories: prev.categories.map(c => c.id === id ? { ...c, ...patch } : c),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = defaultBudgetSettings(budgetCategories);
    setSettings(defaults);
    saveSettings(defaults);
  }, []);

  return { settings, updateTotal, updateCategory, resetToDefaults };
}