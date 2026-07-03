import { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { budgetCategories } from '../data/budget';
import type { ExpenseRecord } from '../utils/expenseDB';

interface ExpenseListProps {
  onToast: (msg: string) => void;
}

const CAT_ICON: Record<string, string> = {};
budgetCategories.forEach(c => { CAT_ICON[c.key] = c.icon; });

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00+08:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
}

export default function ExpenseList({ onToast }: ExpenseListProps) {
  const { expenses, removeExpense } = useExpenses();
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const grouped = expenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {} as Record<string, ExpenseRecord[]>);

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (expenses.length === 0) {
    return (
      <div className="bg-soft-white rounded-card shadow-card p-6 border border-sand/50 text-center">
        <p className="text-sm text-warm-gray">尚無消費紀錄</p>
        <p className="text-xs text-warm-gray/60 mt-1">點右下角「＋」開始記帳</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-navy px-1">📝 消費紀錄</h3>

      {/* Image Viewer */}
      {expandedImage && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="receipt" className="max-w-full max-h-full rounded-lg object-contain" />
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={() => setExpandedImage(null)}>✕</button>
        </div>
      )}

      {dates.map(date => (
        <div key={date} className="space-y-2">
          <p className="text-xs font-medium text-gold px-2">{dateLabel(date)}</p>
          {grouped[date].map(e => (
            <div key={e.id} className="bg-soft-white rounded-card shadow-card p-3 border border-sand/50 flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5">{CAT_ICON[e.category] || '💰'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy">
                    {budgetCategories.find(c => c.key === e.category)?.label || e.category}
                  </p>
                  <span className="text-sm font-semibold text-navy ml-2 shrink-0">
                    {e.currency === 'TWD' ? 'NT$' : '¥'} {e.amount.toLocaleString()}
                  </span>
                </div>
                {e.note && <p className="text-xs text-warm-gray mt-0.5">{e.note}</p>}
                {e.photoBase64 && (
                  <img src={e.photoBase64} alt="receipt" className="mt-1.5 rounded-lg max-h-20 cursor-pointer object-cover"
                    onClick={() => setExpandedImage(e.photoBase64!)} />
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {confirmDelete === e.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => { removeExpense(e.id); onToast('已刪除'); setConfirmDelete(null); }}
                      className="text-[10px] px-2 py-1 bg-coral text-white rounded-full">確認</button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="text-[10px] px-2 py-1 bg-warm-gray/10 text-warm-gray rounded-full">取消</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(e.id)}
                    className="text-[10px] px-2 py-1 rounded-full bg-warm-gray/10 text-warm-gray hover:bg-coral/10 hover:text-coral min-h-[28px]">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}