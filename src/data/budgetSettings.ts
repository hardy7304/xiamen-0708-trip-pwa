import type { BudgetCategory } from './budget';

export type BudgetCurrency = 'TWD' | 'RMB';

export interface BudgetCategorySetting {
  id: string;
  label: string;
  icon: string;
  currency: BudgetCurrency;
  budget: number;
  enabled: boolean;
}

export interface BudgetSettings {
  total: {
    TWD: number;
    RMB: number;
  };
  categories: BudgetCategorySetting[];
}

/** Build default settings from the hardcoded budgetCategories map */
export function defaultBudgetSettings(categories: BudgetCategory[]): BudgetSettings {
  return {
    total: {
      TWD: categories.reduce((s, c) => s + c.twdMax, 0),
      RMB: categories.reduce((s, c) => s + c.cnyMax, 0),
    },
    categories: categories.map(c => ({
      id: c.key,
      label: c.label,
      icon: c.icon,
      currency: (c.cnyMax > 0 ? 'RMB' : 'TWD') as BudgetCurrency,
      budget: c.cnyMax > 0 ? c.cnyMax : c.twdMax,
      enabled: true,
    })),
  };
}