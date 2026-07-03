export interface BudgetCategory {
  key: string;
  label: string;
  icon: string;
  twdMin: number;
  twdMax: number;
  rmbMin: number;
  rmbMax: number;
}

export const budgetCategories: BudgetCategory[] = [
  { key: 'transport', label: '交通（機票+船票）', icon: '✈️', twdMin: 10000, twdMax: 14800, rmbMin: 0, rmbMax: 0 },
  { key: 'accommodation', label: '住宿', icon: '🏨', twdMin: 16160, twdMax: 25000, rmbMin: 0, rmbMax: 0 },
  { key: 'simcard', label: '手機卡', icon: '📱', twdMin: 0, twdMax: 0, rmbMin: 50, rmbMax: 150 },
  { key: 'food', label: '餐飲', icon: '🍜', twdMin: 0, twdMax: 0, rmbMin: 1600, rmbMax: 2400 },
  { key: 'local_transport', label: '市內交通', icon: '🚕', twdMin: 0, twdMax: 0, rmbMin: 300, rmbMax: 500 },
  { key: 'bank_fee', label: '銀行/雜費', icon: '🏦', twdMin: 0, twdMax: 0, rmbMin: 100, rmbMax: 300 },
  { key: 'shopping', label: '購物/伴手禮', icon: '🛍️', twdMin: 3000, twdMax: 8000, rmbMin: 500, rmbMax: 1500 },
  { key: 'emergency', label: '緊急備用金', icon: '🆘', twdMin: 3000, twdMax: 5000, rmbMin: 1000, rmbMax: 2000 },
];

export const DEFAULT_EXCHANGE_RATE = 4.4;