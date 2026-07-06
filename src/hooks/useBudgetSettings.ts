import { useState, useEffect, useCallback } from 'react';
import { budgetCategories } from '../data/budget';
import { defaultBudgetSettings, type BudgetSettings, type BudgetCategorySetting } from '../data/budgetSettings';

const STORAGE_KEY = 'trip_budget_settings_v1';

function migrate(raw: any): BudgetSettings {
  const defaults = defaultBudgetSettings(budgetCategories);
  if (typeof raw?.updatedAt !== 'number') {
    raw = { ...(raw || {}), updatedAt: 0 };
  }
  if (typeof raw?.initialCnyCash !== 'number') {
    raw.initialCnyCash = raw?.total?.RMB ?? defaults.initialCnyCash;
  }
  if (typeof raw?.exchangeRate !== 'number' || raw.exchangeRate <= 0) {
    raw.exchangeRate = defaults.exchangeRate;
  }
  if (!raw?.total || !raw?.categories) {
    return { ...defaults, initialCnyCash: raw?.initialCnyCash ?? defaults.initialCnyCash, exchangeRate: raw?.exchangeRate ?? defaults.exchangeRate, updatedAt: raw?.updatedAt ?? 0 };
  }
  return raw as BudgetSettings;
}

function loadSettings(): BudgetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* ignore */ }
  return defaultBudgetSettings(budgetCategories);
}

function saveSettings(s: BudgetSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function useBudgetSettings() {
  const [settings, setSettings] = useState<BudgetSettings>(loadSettings);

  // Pull settings from KV on mount, respects updatedAt
  const pullSettingsFromKV = useCallback(async () => {
    try {
      const resp = await fetch('/api/budget-settings', { cache: 'no-store' });
      if (!resp.ok) { console.warn('[budget-settings] pull HTTP error', resp.status); return; }
      const data = await resp.json();
      if (data.settings === null) { console.log('[budget-settings] no remote settings'); return; }
      const remote = migrate(data.settings);
      setSettings(prev => {
        if (remote.updatedAt > (prev.updatedAt || 0)) {
          console.log('[budget-settings] remote is newer, updating local');
          saveSettings(remote);
          return remote;
        }
        console.log('[budget-settings] local is up to date');
        return prev;
      });
    } catch (e) { console.warn('[budget-settings] pull failed', e); }
  }, []);

  useEffect(() => { pullSettingsFromKV(); }, [pullSettingsFromKV]);

  // Push settings to KV
  const pushSettingsToKV = useCallback(async (s: BudgetSettings) => {
    try {
      const resp = await fetch('/api/budget-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      });
      if (!resp.ok) {
        console.warn('[budget-settings] push HTTP error', resp.status);
        return false;
      }
      return true;
    } catch (e) { console.warn('[budget-settings] push failed', e); return false; }
  }, []);

  const updateTotal = useCallback((currency: 'TWD' | 'RMB', value: number) => {
    setSettings(prev => {
      const next: BudgetSettings = { ...prev, total: { ...prev.total, [currency]: Math.max(0, value || 0) }, updatedAt: Date.now() };
      saveSettings(next);
      pushSettingsToKV(next).then(ok => { if (!ok) console.warn('[budget-settings] push to KV failed'); });
      return next;
    });
  }, [pushSettingsToKV]);

  const updateCategory = useCallback((id: string, patch: Partial<Pick<BudgetCategorySetting, 'label' | 'currency' | 'budget' | 'enabled'>>) => {
    setSettings(prev => {
      const next: BudgetSettings = {
        ...prev,
        categories: prev.categories.map(c => c.id === id ? { ...c, ...patch } : c),
        updatedAt: Date.now(),
      };
      saveSettings(next);
      pushSettingsToKV(next).then(ok => { if (!ok) console.warn('[budget-settings] push to KV failed'); });
      return next;
    });
  }, [pushSettingsToKV]);

  const updateInitialCnyCash = useCallback((value: number) => {
    setSettings(prev => {
      const next: BudgetSettings = { ...prev, initialCnyCash: Math.max(0, value || 0), updatedAt: Date.now() };
      saveSettings(next);
      pushSettingsToKV(next).then(ok => { if (!ok) console.warn('[budget-settings] push to KV failed'); });
      return next;
    });
  }, [pushSettingsToKV]);

  const updateExchangeRate = useCallback((rate: number) => {
    setSettings(prev => {
      const next: BudgetSettings = { ...prev, exchangeRate: Math.max(0.01, rate || 0), updatedAt: Date.now() };
      saveSettings(next);
      pushSettingsToKV(next).then(ok => { if (!ok) console.warn('[budget-settings] push to KV failed'); });
      return next;
    });
  }, [pushSettingsToKV]);

  const resetToDefaults = useCallback(() => {
    const defaults = defaultBudgetSettings(budgetCategories);
    saveSettings(defaults);
    setSettings(defaults);
    pushSettingsToKV(defaults).then(ok => { if (!ok) console.warn('[budget-settings] push to KV failed'); });
  }, [pushSettingsToKV]);

  return { settings, updateTotal, updateCategory, updateInitialCnyCash, resetToDefaults, pullSettingsFromKV, pushSettingsToKV, updateExchangeRate };
}