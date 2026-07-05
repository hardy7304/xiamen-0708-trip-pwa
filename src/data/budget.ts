export interface BudgetCategory {
  key: string;
  label: string;
  icon: string;
  twdMin: number;
  twdMax: number;
  cnyMin: number;
  cnyMax: number;
}

export const budgetCategories: BudgetCategory[] = [
  { key: 'transport', label: '交通（機票+船票）', icon: '✈️', twdMin: 10000, twdMax: 14800, cnyMin: 0, cnyMax: 0 },
  { key: 'accommodation', label: '住宿', icon: '🏨', twdMin: 16160, twdMax: 25000, cnyMin: 0, cnyMax: 0 },
  { key: 'simcard', label: '手機卡', icon: '📱', twdMin: 0, twdMax: 0, cnyMin: 50, cnyMax: 150 },
  { key: 'food', label: '餐飲', icon: '🍜', twdMin: 0, twdMax: 0, cnyMin: 1600, cnyMax: 2400 },
  { key: 'local_transport', label: '市內交通', icon: '🚕', twdMin: 0, twdMax: 0, cnyMin: 300, cnyMax: 500 },
  { key: 'bank_fee', label: '銀行/雜費', icon: '🏦', twdMin: 0, twdMax: 0, cnyMin: 100, cnyMax: 300 },
  { key: 'shopping', label: '購物/伴手禮', icon: '🛍️', twdMin: 3000, twdMax: 8000, cnyMin: 500, cnyMax: 1500 },
  { key: 'emergency', label: '緊急備用金', icon: '🆘', twdMin: 3000, twdMax: 5000, cnyMin: 1000, cnyMax: 2000 },
];

export const DEFAULT_EXCHANGE_RATE = 4.4;

export const PAYERS = [
  { key: 'me', label: '嘉豪' },
  { key: 'yiting', label: '翊婷' },
] as const;

export const EXPENSE_FOR_OPTIONS = [
  { key: 'self', label: '嘉豪' },
  { key: 'shared', label: '一起' },
  { key: 'yiting', label: '翊婷' },
] as const;

export const PAYMENT_METHODS = [
  { key: 'cash_cny', label: '💵 人民幣現金', currency: 'CNY' as const },
  { key: 'wechat', label: '💬 微信支付', currency: 'CNY' as const },
  { key: 'alipay', label: '🔵 支付寶', currency: 'CNY' as const },
  { key: 'credit_card', label: '💳 信用卡', currency: 'CNY' as const },
  { key: 'cash_twd', label: '🇹🇼 台幣現金', currency: 'TWD' as const },
  { key: 'other', label: '📌 其他', currency: 'CNY' as const },
] as const;