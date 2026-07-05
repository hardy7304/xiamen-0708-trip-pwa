import { useState, useEffect } from 'react';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { DEFAULT_EXCHANGE_RATE } from '../data/budget';
import { ensurePin } from '../utils/pin';
import ExpenseFormModal from './ExpenseFormModal';
import ExpenseList from './ExpenseList';
import type { ExpenseRecord } from '../utils/expenseDB';

function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const isOver = percent > 100;
  return (
    <div className={`w-full h-2 bg-sand rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full progress-bar ${isOver ? 'bg-coral' : 'bg-ocean'}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function fmtAmount(n: number): string {
  if (Math.abs(n) < 1) return `NT$ 0`;
  return `NT$ ${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default function BudgetOverview() {
  const { budgets, totals, budgetMax, exchangeRate, setExchangeRate, settlement } = useBudget();
  const { expenses, addExpense, editExpense, removeExpense } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => { ensurePin(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const isWechat = typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);

  const totalPercent = budgetMax.equiv > 0 ? (totals.totalTwdEquivalent / budgetMax.equiv) * 100 : 0;
  const twdPercent = budgetMax.twd > 0 ? (totals.totalTwd / budgetMax.twd) * 100 : 0;
  const cnyPercent = budgetMax.cny > 0 ? (totals.totalCny / budgetMax.cny) * 100 : 0;

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingExpense(null);
    showToast('✅ 已記錄');
  };

  return (
    <div className="relative space-y-4">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-navy text-cream px-4 py-2 rounded-full text-sm shadow-lg">{toast}</div>
      )}

      {isWechat && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
          ⚠️ 請點擊右上角「⋯」選擇「在瀏覽器中打開」以確保資料正常儲存
        </div>
      )}

      <details className="bg-ocean/5 border border-ocean/10 rounded-lg p-2.5">
        <summary className="text-xs text-ocean cursor-pointer list-none">💡 建議將此頁面加入手機主畫面，離線資料才不會被系統清除</summary>
        <div className="mt-2 text-xs text-warm-gray space-y-1">
          <p>📱 <b>iOS Safari</b>：分享按鈕 → 加入主畫面</p>
          <p>📱 <b>Android Chrome</b>：選單 → 加到主畫面</p>
        </div>
      </details>

      <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50 space-y-4">
        <h3 className="text-sm font-semibold text-navy">💰 總預算概覽</h3>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-warm-gray">台幣</span>
            <span className="text-navy font-medium">{fmtAmount(totals.totalTwd)} / {fmtAmount(budgetMax.twd)}</span>
          </div>
          <ProgressBar percent={twdPercent} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-warm-gray">人民幣</span>
            <span className="text-navy font-medium">¥ {totals.totalCny.toLocaleString()} / ¥ {budgetMax.cny.toLocaleString()}</span>
          </div>
          <ProgressBar percent={cnyPercent} />
        </div>
        <div className="border-t border-sand/30 pt-3">
          <div className="flex items-center gap-1 text-xs mb-1">
            <span className="text-warm-gray">換算台幣（¥1 = </span>
            <input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || DEFAULT_EXCHANGE_RATE)}
              className="w-12 text-xs text-center bg-cream rounded px-1 py-0.5 border border-sand text-navy font-medium" step="0.1" />
            <span className="text-warm-gray">TWD）</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-warm-gray">換算台幣總計</span>
            <span className="text-navy font-semibold">{fmtAmount(totals.totalTwdEquivalent)} / {fmtAmount(budgetMax.equiv)}</span>
          </div>
          <ProgressBar percent={totalPercent} />
          {totalPercent > 100 && <p className="text-xs text-coral mt-1">⚠️ 已超過總預算上限</p>}
        </div>
      </div>

      <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50 space-y-3">
        <h3 className="text-sm font-semibold text-navy">💸 分帳結算</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-cream rounded-xl p-3">
            <p className="text-warm-gray mb-1">💰 人民幣現金剩餘</p>
            <p className="text-lg font-bold text-coral">¥ {settlement.cashCnyRemaining.toLocaleString()}</p>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <p className="text-warm-gray mb-1">💱 匯率</p>
            <p className="text-lg font-bold text-navy">{exchangeRate}</p>
          </div>
        </div>
        <div className="border-t border-sand/30 pt-3 space-y-2 text-xs">
          <div className="flex justify-between"><span>嘉豪 實付 CNY</span><span className="font-medium">¥ {settlement.mePaidCny.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>嘉豪 個人 CNY</span><span className="font-medium">¥ {settlement.meSelfCny.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>嘉豪 分攤 shared CNY</span><span className="font-medium">¥ {settlement.meOweSharedCny.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>翊婷 實付 CNY</span><span>¥ {settlement.yitingPaidCny.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>翊婷 個人 CNY</span><span>¥ {settlement.yitingSelfCny.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>翊婷 分攤 shared CNY</span><span>¥ {settlement.yitingOweSharedCny.toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-sand/30 pt-2 font-semibold">
            <span>CNY 結算</span>
            <span className={settlement.settlementCny > 0 ? 'text-ocean' : settlement.settlementCny < 0 ? 'text-coral' : 'text-warm-gray'}>
              {settlement.settlementCny > 0 ? `翊婷 → 嘉豪 ¥ ${settlement.settlementCny.toLocaleString()}` : settlement.settlementCny < 0 ? `嘉豪 → 翊婷 ¥ ${Math.abs(settlement.settlementCny).toLocaleString()}` : '已結清'}
            </span>
          </div>
          <div className="flex justify-between mt-2"><span>嘉豪 實付 TWD</span><span className="font-medium">NT$ {settlement.mePaidTwd.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>翊婷 實付 TWD</span><span>NT$ {settlement.yitingPaidTwd.toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-sand/30 pt-2 font-semibold">
            <span>TWD 結算</span>
            <span className={settlement.settlementTwd > 0 ? 'text-ocean' : settlement.settlementTwd < 0 ? 'text-coral' : 'text-warm-gray'}>
              {settlement.settlementTwd > 0 ? `翊婷 → 嘉豪 NT$ ${settlement.settlementTwd.toLocaleString()}` : settlement.settlementTwd < 0 ? `嘉豪 → 翊婷 NT$ ${Math.abs(settlement.settlementTwd).toLocaleString()}` : '已結清'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-navy px-1">📊 分類預算</h3>
        {budgets.map(cat => (
          <div key={cat.key} className="bg-soft-white rounded-card shadow-card p-4 border border-sand/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-navy"><span className="mr-1.5">{cat.icon}</span>{cat.label}</span>
              <span className={`text-xs font-medium ${cat.percent > 100 ? 'text-coral' : 'text-ocean'}`}>{cat.percent.toFixed(0)}%</span>
            </div>
            <div className="text-xs text-warm-gray mb-2 space-y-0.5">
              <div className="flex justify-between"><span>預算</span><span>{cat.twdMax > 0 && `NT$ ${cat.twdMin.toLocaleString()}–${cat.twdMax.toLocaleString()}`}{cat.twdMax > 0 && cat.cnyMax > 0 && ' + '}{cat.cnyMax > 0 && `¥ ${cat.cnyMin}–${cat.cnyMax}`}</span></div>
              <div className="flex justify-between"><span>已花費</span><span>{cat.spentTwd > 0 && `NT$ ${cat.spentTwd.toLocaleString()}`}{cat.spentTwd > 0 && cat.spentCny > 0 && ' + '}{cat.spentCny > 0 && `¥ ${cat.spentCny.toLocaleString()}`}{cat.spentTwd === 0 && cat.spentCny === 0 && '—'}</span></div>
              <div className="flex justify-between"><span>剩餘</span><span className={cat.remaining < 0 ? 'text-coral font-medium' : 'text-ocean'}>{fmtAmount(cat.remaining)}</span></div>
            </div>
            <ProgressBar percent={cat.percent} />
          </div>
        ))}
      </div>

      <ExpenseList expenses={expenses} onRemove={removeExpense} onEdit={(e) => { setEditingExpense(e); setShowForm(true); }} onToast={showToast} />

      <button onClick={() => { setEditingExpense(null); setShowForm(true); }}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-ocean text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-ocean/90 transition-colors active:scale-95">＋</button>
      {showForm && (
        <ExpenseFormModal
          onClose={() => { setShowForm(false); setEditingExpense(null); }}
          onSuccess={handleFormSuccess}
          initialExpense={editingExpense ?? undefined}
          addExpense={addExpense}
          editExpense={editExpense}
        />
      )}
    </div>
  );
}