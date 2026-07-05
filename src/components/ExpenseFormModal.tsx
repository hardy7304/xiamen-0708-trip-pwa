import { useState } from 'react';
import { budgetCategories, PAYERS, EXPENSE_FOR_OPTIONS, PAYMENT_METHODS } from '../data/budget';
import { compressImage } from '../utils/imageCompress';
import { getPin } from '../utils/pin';
import type { ExpenseRecord } from '../utils/expenseDB';

interface ExpenseFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialExpense?: ExpenseRecord;
  addExpense: (record: ExpenseRecord) => Promise<boolean>;
  editExpense: (record: ExpenseRecord) => Promise<boolean>;
}

export default function ExpenseFormModal({ onClose, onSuccess, initialExpense, addExpense, editExpense }: ExpenseFormModalProps) {
  const isEdit = !!initialExpense;
  const [amount, setAmount] = useState(initialExpense ? String(initialExpense.amount) : '');
  const [currency, setCurrency] = useState<'TWD' | 'CNY'>(initialExpense?.currency === 'TWD' ? 'TWD' : 'CNY');
  const [category, setCategory] = useState(initialExpense?.category || '');
  const [paidBy, setPaidBy] = useState<'me' | 'yiting'>(initialExpense?.paidBy || 'me');
  const [expenseFor, setExpenseFor] = useState<'self' | 'shared' | 'yiting'>(initialExpense?.expenseFor || 'self');
  const [paymentMethod, setPaymentMethod] = useState<'cash_cny' | 'wechat' | 'alipay' | 'credit_card' | 'cash_twd' | 'other'>(initialExpense?.paymentMethod || 'cash_cny');
  const [date, setDate] = useState(initialExpense?.date || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(initialExpense?.note || '');
  const [photo, setPhoto] = useState<string>(initialExpense?.photoBase64 || '');
  const [photoKey, setPhotoKey] = useState<string>(initialExpense?.photoKey || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const base64 = await compressImage(file);
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
      const resp = await fetch('/api/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-trip-pin': getPin() || '' },
        body: JSON.stringify({ filename, data: base64 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setPhotoKey(data.key);
        setPhoto(base64);
      } else {
        setPhoto(base64);
        setError('R2 unavailable, stored locally');
      }
    } catch { setError('圖片處理失敗'); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!amount || !category) { setError('請填寫金額與分類'); return; }
    setSubmitting(true);
    setError('');
    try {
      const record: ExpenseRecord = {
        id: initialExpense?.id || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date, category, amount: parseFloat(amount), currency,
        paidBy, expenseFor, paymentMethod,
        note: note || undefined,
        photoBase64: photoKey ? undefined : (photo || undefined),
        photoKey: photoKey || undefined,
        createdAt: initialExpense?.createdAt || new Date().toISOString(),
      };
      const ok = isEdit ? await editExpense(record) : await addExpense(record);
      if (!ok) setError('本機已儲存，但雲端同步失敗');
      onSuccess();
    } catch { setError('儲存失敗，請確認手機空間充足'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-soft-white w-full max-w-lg rounded-t-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">{isEdit ? '編輯支出' : '記帳'}</h3>
          <button onClick={onClose} className="text-warm-gray text-lg">✕</button>
        </div>

        <div>
          <label className="text-xs text-warm-gray block mb-1">收據照片（選填）{uploading && ' 📤'}</label>
          <div className="flex gap-2">
            <label className="flex-1 text-xs bg-cream rounded-lg px-3 py-2.5 border border-sand cursor-pointer text-center min-h-[44px] flex items-center justify-center gap-1">
              📷 拍照
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" disabled={uploading} />
            </label>
            <label className="flex-1 text-xs bg-cream rounded-lg px-3 py-2.5 border border-sand cursor-pointer text-center min-h-[44px] flex items-center justify-center gap-1">
              📁 選照片
              <input type="file" accept="image/*,.jpg,.jpeg,.png,.pdf" onChange={handleFile} className="hidden" disabled={uploading} />
            </label>
          </div>
          {photo && <img src={photo} alt="preview" className="mt-2 rounded-lg max-h-32 object-cover" />}
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className="text-xs text-warm-gray block mb-1">金額 *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrency('CNY')} className={`text-xs px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${currency === 'CNY' ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>¥ CNY</button>
            <button onClick={() => setCurrency('TWD')} className={`text-xs px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${currency === 'TWD' ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>NT$</button>
          </div>
        </div>

        <div>
          <label className="text-xs text-warm-gray block mb-1">分類 *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]">
            <option value="">選擇分類</option>
            {budgetCategories.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-warm-gray block mb-1">付款人</label>
          <div className="flex gap-1">
            {PAYERS.map(p => <button key={p.key} onClick={() => setPaidBy(p.key)} className={`text-xs px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${paidBy === p.key ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>👤 {p.label}</button>)}
          </div>
        </div>

        <div>
          <label className="text-xs text-warm-gray block mb-1">費用歸屬</label>
          <div className="flex gap-1">
            {EXPENSE_FOR_OPTIONS.map(o => <button key={o.key} onClick={() => setExpenseFor(o.key)} className={`text-xs px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${expenseFor === o.key ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>{o.label}</button>)}
          </div>
        </div>

        <div>
          <label className="text-xs text-warm-gray block mb-1">支付方式</label>
          <div className="flex flex-wrap gap-1">
            {PAYMENT_METHODS.map(m => <button key={m.key} onClick={() => setPaymentMethod(m.key)} className={`text-xs px-3 py-1.5 rounded-lg font-medium min-h-[36px] ${paymentMethod === m.key ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>{m.label}</button>)}
          </div>
        </div>

        <div>
          <label className="text-xs text-warm-gray block mb-1">日期</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]" />
        </div>

        <div>
          <label className="text-xs text-warm-gray block mb-1">備註（選填）</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="例：計程車去碼頭" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]" />
        </div>

        {error && <p className="text-xs text-coral">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting} className="w-full text-sm py-3 bg-ocean text-white rounded-xl font-semibold hover:bg-ocean/90 disabled:opacity-60 min-h-[44px]">
          {submitting ? '處理中...' : isEdit ? '✅ 更新支出' : '✅ 記錄支出'}
        </button>
      </div>
    </div>
  );
}