import { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { budgetCategories } from '../data/budget';
import { compressImage } from '../utils/imageCompress';

interface ExpenseFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseFormModal({ onClose, onSuccess }: ExpenseFormModalProps) {
  const { addExpense } = useExpenses();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'TWD' | 'RMB'>('RMB');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setPhoto(base64);
    } catch {
      setError('圖片處理失敗');
    }
  };

  const handleSubmit = async () => {
    if (!amount || !category) { setError('請填寫金額與分類'); return; }
    setSubmitting(true);
    setError('');
    try {
      await addExpense({
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date,
        category,
        amount: parseFloat(amount),
        currency,
        note: note || undefined,
        photoBase64: photo || undefined,
        createdAt: new Date().toISOString(),
      });
      setAmount(''); setCategory(''); setNote(''); setPhoto('');
      onSuccess();
      onClose();
    } catch {
      setError('儲存失敗，請確認手機空間充足');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-soft-white w-full max-w-lg rounded-t-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">記帳</h3>
          <button onClick={onClose} className="text-warm-gray text-lg">✕</button>
        </div>

        {/* Photo */}
        <div>
          <label className="text-xs text-warm-gray block mb-1">收據照片（選填）</label>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile}
            className="text-xs bg-cream rounded-lg px-3 py-2.5 border border-sand w-full" />
          {photo && (
            <img src={photo} alt="preview" className="mt-2 rounded-lg max-h-32 object-cover" />
          )}
        </div>

        {/* Amount + Currency */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-warm-gray block mb-1">金額 *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrency('RMB')}
              className={`text-xs px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${currency === 'RMB' ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>
              ¥ RMB
            </button>
            <button onClick={() => setCurrency('TWD')}
              className={`text-xs px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${currency === 'TWD' ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>
              NT$
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-warm-gray block mb-1">分類 *</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]">
            <option value="">選擇分類</option>
            {budgetCategories.map(c => (
              <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-warm-gray block mb-1">日期</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]" />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs text-warm-gray block mb-1">備註（選填）</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="例：計程車去碼頭" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]" />
        </div>

        {error && <p className="text-xs text-coral">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full text-sm py-3 bg-ocean text-white rounded-xl font-semibold hover:bg-ocean/90 disabled:opacity-60 min-h-[44px]">
          {submitting ? '記錄中...' : '✅ 記錄支出'}
        </button>
      </div>
    </div>
  );
}