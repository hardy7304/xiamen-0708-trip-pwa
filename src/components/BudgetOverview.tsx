import { useState } from 'react';
import { useBudget } from '../hooks/useBudget';
import { DEFAULT_EXCHANGE_RATE } from '../data/budget';
import ExpenseFormModal from './ExpenseFormModal';
import ExpenseList from './ExpenseList';

function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const isOver = percent > 100;
  return (
    <div className={`w-full h-2 bg-sand rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full progress-bar ${isOver ? 'bg-coral' : 'bg-ocean'}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function fmtAmount(n: number): string {
  return n >= 1000 ? `NT$ ${n.toLocaleString()}` : `NT$ ${n}`;
}

export default function BudgetOverview() {
  const { budgets, totals, budgetMax, exchangeRate, setExchangeRate } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // WeChat detection
  const isWechat = typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);

  const totalPercent = budgetMax.equiv > 0 ? (totals.totalTwdEquivalent / budgetMax.equiv) * 100 : 0;
  const twdPercent = budgetMax.twd > 0 ? (totals.totalTwd / budgetMax.twd) * 100 : 0;
  const rmbPercent = budgetMax.rmb > 0 ? (totals.totalRmb / budgetMax.rmb) * 100 : 0;

  return (
    <div className="relative space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-navy text-cream px-4 py-2 rounded-full text-sm shadow-lg">{toast}</div>
      )}

      {/* WeChat warning */}
      {isWechat && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
          ⚠️ 請點擊右上角「⋯」選擇「在瀏覽器中打開」以確保資料正常儲存
        </div>
      )}

      {/* PWA tip */}
      <details className="bg-ocean/5 border border-ocean/10 rounded-lg p-2.5">
        <summary className="text-xs text-ocean cursor-pointer list-none">💡 建議將此頁面加入手機主畫面，離線資料才不會被系統清除</summary>
        <div className="mt-2 text-xs text-warm-gray space-y-1">
          <p>📱 <b>iOS Safari</b>：分享按鈕 → 加入主畫面</p>
          <p>📱 <b>Android Chrome</b>：選單 → 加到主畫面</p>
        </div>
      </details>

      {/* Summary Cards */}
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
            <span className="text-navy font-medium">RMB {totals.totalRmb.toLocaleString()} / RMB {budgetMax.rmb.toLocaleString()}</span>
          </div>
          <ProgressBar percent={rmbPercent} />
        </div>

        <div className="border-t border-sand/30 pt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-warm-gray">換算台幣（$1 RMB = </span>
            <input
              type="number"
              value={exchangeRate}
              onChange={e => setExchangeRate(parseFloat(e.target.value) || DEFAULT_EXCHANGE_RATE)}
              className="w-14 text-xs text-center bg-cream rounded px-1 py-0.5 border border-sand text-navy font-medium"
              step="0.1"
            />
            <span className="text-warm-gray">TWD）</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-warm-gray">換算台幣總計</span>
            <span className="text-navy font-semibold">{fmtAmount(totals.totalTwdEquivalent)} / {fmtAmount(budgetMax.equiv)}</span>
          </div>
          <ProgressBar percent={totalPercent} />
          {totalPercent > 100 && (
            <p className="text-xs text-coral mt-1">⚠️ 已超過總預算上限</p>
          )}
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-navy px-1">📊 分類預算</h3>
        {budgets.map(cat => (
          <div key={cat.key} className="bg-soft-white rounded-card shadow-card p-4 border border-sand/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-navy">
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </span>
              <span className={`text-xs font-medium ${cat.percent > 100 ? 'text-coral' : 'text-ocean'}`}>
                {cat.percent.toFixed(0)}%
              </span>
            </div>
            <div className="text-xs text-warm-gray mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span>預算</span>
                <span>
                  {cat.twdMax > 0 && `N$ ${cat.twdMin.toLocaleString()}–${cat.twdMax.toLocaleString()}`}
                  {cat.twdMax > 0 && cat.rmbMax > 0 && ' + '}
                  {cat.rmbMax > 0 && `RMB ${cat.rmbMin}–${cat.rmbMax}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>已花費</span>
                <span>
                  {cat.spentTwd > 0 && `NT$ ${cat.spentTwd.toLocaleString()}`}
                  {cat.spentTwd > 0 && cat.spentRmb > 0 && ' + '}
                  {cat.spentRmb > 0 && `RMB ${cat.spentRmb.toLocaleString()}`}
                  {cat.spentTwd === 0 && cat.spentRmb === 0 && '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>剩餘</span>
                <span className={cat.remaining < 0 ? 'text-coral font-medium' : 'text-ocean'}>{fmtAmount(cat.remaining)}</span>
              </div>
            </div>
            <ProgressBar percent={cat.percent} />
          </div>
        ))}
      </div>

      {/* Expense List */}
      <ExpenseList onToast={showToast} />

      {/* FAB + Modal */}
      <button onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-ocean text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-ocean/90 transition-colors active:scale-95">
        ＋
      </button>
      {showForm && <ExpenseFormModal onClose={() => setShowForm(false)} onSuccess={() => showToast('✅ 已記錄')} />}
    </div>
  );
}