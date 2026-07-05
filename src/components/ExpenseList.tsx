import { useState, useMemo, useEffect } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { budgetCategories, PAYERS, EXPENSE_FOR_OPTIONS, PAYMENT_METHODS } from '../data/budget';
import { getPin } from '../utils/pin';
import type { ExpenseRecord } from '../utils/expenseDB';
import ExpenseFormModal from './ExpenseFormModal';

interface ExpenseListProps {
  onToast: (msg: string) => void;
}

const CAT_ICON: Record<string, string> = {};
budgetCategories.forEach(c => { CAT_ICON[c.key] = c.icon; });
const PAYER_LABEL: Record<string, string> = {};
PAYERS.forEach(p => { PAYER_LABEL[p.key] = p.label; });
const FOR_LABEL: Record<string, string> = {};
EXPENSE_FOR_OPTIONS.forEach(o => { FOR_LABEL[o.key] = o.label; });
const METHOD_LABEL: Record<string, string> = {};
PAYMENT_METHODS.forEach(m => { METHOD_LABEL[m.key] = m.label; });

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00+08:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
}

export default function ExpenseList({ onToast }: ExpenseListProps) {
  const { expenses, removeExpense } = useExpenses();
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [r2Blobs, setR2Blobs] = useState<Record<string, string>>({});

  // Fetch R2 images, with cleanup
  useEffect(() => {
    const urls: string[] = [];

    const fetchR2 = async (key: string) => {
      if (r2Blobs[key]) return;
      try {
        const resp = await fetch(`/api/receipt?key=${encodeURIComponent(key)}`, {
          headers: { 'x-trip-pin': getPin() || '' },
        });
        if (resp.ok) {
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          urls.push(url);
          setR2Blobs(prev => ({ ...prev, [key]: url }));
        }
      } catch { /* ignore */ }
    };

    expenses.forEach(e => {
      if (e.photoKey) fetchR2(e.photoKey);
    });

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [expenses]);

  const grouped = useMemo(() => {
    const g: Record<string, { expenses: ExpenseRecord[]; totalCny: number; totalTwd: number }> = {};
    expenses.forEach(e => {
      if (!g[e.date]) g[e.date] = { expenses: [], totalCny: 0, totalTwd: 0 };
      g[e.date].expenses.push(e);
      if (e.currency === 'TWD') g[e.date].totalTwd += e.amount;
      else g[e.date].totalCny += e.amount;
    });
    return g;
  }, [expenses]);

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

      {/* Edit Modal */}
      {editingExpense && (
        <ExpenseFormModal
          onClose={() => setEditingExpense(null)}
          onSuccess={() => { onToast('✅ 已更新'); setEditingExpense(null); }}
          initialExpense={editingExpense}
        />
      )}

      {dates.map(date => {
        const day = grouped[date];
        return (
          <div key={date} className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-semibold text-gold">{dateLabel(date)}</p>
              <p className="text-[11px] text-warm-gray">
                {day.totalTwd > 0 && <span className="text-ocean font-medium">NT$ {day.totalTwd.toLocaleString()}</span>}
                {day.totalTwd > 0 && day.totalCny > 0 && <span className="mx-1">+</span>}
                {day.totalCny > 0 && <span className="text-coral font-medium">¥ {day.totalCny.toLocaleString()}</span>}
              </p>
            </div>

            {day.expenses.map((e) => {
              const photoUrl = e.photoKey ? (r2Blobs[e.photoKey] || null) : (e.photoBase64 || null);
              return (
                <div key={e.id} className="bg-soft-white rounded-card shadow-card p-3 border border-sand/50 flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">{CAT_ICON[e.category] || '💰'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-navy truncate">
                        {budgetCategories.find(c => c.key === e.category)?.label || e.category}
                      </p>
                      <span className={`text-sm font-bold shrink-0 ${e.currency === 'CNY' ? 'text-coral' : 'text-ocean'}`}>
                        {e.currency === 'TWD' ? 'NT$' : '¥'} {e.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-light/40 text-gold font-medium">
                        👤 {PAYER_LABEL[e.paidBy] || e.paidBy} 付 · {FOR_LABEL[e.expenseFor] || e.expenseFor}
                      </span>
                      <span className="text-[10px] text-warm-gray/60">
                        {METHOD_LABEL[e.paymentMethod] || e.paymentMethod}
                      </span>
                      <span className="text-[10px] text-warm-gray/50">
                        {new Date(e.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {e.note && <p className="text-xs text-warm-gray mt-1">{e.note}</p>}
                    {photoUrl && (
                      <img src={photoUrl} alt="receipt" className="mt-1.5 rounded-lg max-h-20 cursor-pointer object-cover"
                        onClick={() => setExpandedImage(photoUrl)} />
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
                      <div className="flex gap-1">
                        <button onClick={() => setEditingExpense(e)}
                          className="text-[10px] px-2 py-1 rounded-full bg-ocean/10 text-ocean hover:bg-ocean/20 min-h-[28px]" title="編輯">✏️</button>
                        <button onClick={() => setConfirmDelete(e.id)}
                          className="text-[10px] px-2 py-1 rounded-full bg-warm-gray/10 text-warm-gray hover:bg-coral/10 hover:text-coral min-h-[28px]" title="刪除">🗑️</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}