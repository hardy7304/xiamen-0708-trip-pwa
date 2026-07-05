import { useState, useEffect } from 'react';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { useSettlements } from '../hooks/useSettlements';
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

function settleLabel(amt: number): { color: string; text: string } {
  if (Math.abs(amt) < 0.01) return { color: 'text-warm-gray', text: '已結清' };
  if (amt > 0) return { color: 'text-green-600', text: `應收 ¥ ${amt.toLocaleString()}` };
  return { color: 'text-coral', text: `應付 ¥ ${Math.abs(amt).toLocaleString()}` };
}

export default function BudgetOverview() {
  const { budgets, totals, budgetMax, exchangeRate, setExchangeRate, settlement } = useBudget();
  const { expenses, addExpense, editExpense, removeExpense } = useExpenses();
  const { settlements, addSettlement, removeSettlement } = useSettlements();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [toast, setToast] = useState('');
  const [pinReady, setPinReady] = useState(false);
  const [pinEmpty, setPinEmpty] = useState(false);

  useEffect(() => {
    const pin = ensurePin();
    setPinReady(true);
    setPinEmpty(!pin);
  }, []);

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

  const handleMarkSettledCny = async () => {
    if (settlement.settlementCny <= 0) return;
    await addSettlement({
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: '翊婷',
      to: '嘉豪',
      currency: 'CNY',
      amount: settlement.settlementCny,
      method: '現金',
      createdAt: new Date().toISOString(),
      status: 'settled',
    });
    showToast('✅ 已標記 CNY 結清');
  };

  const handleMarkSettledTwd = async () => {
    if (settlement.settlementTwd <= 0) return;
    await addSettlement({
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: '翊婷',
      to: '嘉豪',
      currency: 'TWD',
      amount: settlement.settlementTwd,
      method: '現金',
      createdAt: new Date().toISOString(),
      status: 'settled',
    });
    showToast('✅ 已標記 TWD 結清');
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

      {/* Settlement Section */}
      <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50 space-y-4">
        <h3 className="text-sm font-semibold text-navy">💸 結算建議</h3>

        {/* CNY Card */}
        <div className="bg-cream rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-navy">🇨🇳 人民幣 (CNY)</h4>
            <span className={`text-sm font-bold ${settleLabel(settlement.settlementCny).color}`}>
              {settlement.settlementCny > 0 ? `翊婷 應付 嘉豪` : settlement.settlementCny < 0 ? `嘉豪 應付 翊婷` : '已結清'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">嘉豪 實付</p>
              <p className="text-navy font-semibold">¥ {settlement.mePaidCny.toLocaleString()}</p>
            </div>
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">翊婷 實付</p>
              <p className="text-navy font-semibold">¥ {settlement.yitingPaidCny.toLocaleString()}</p>
            </div>
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">共同分攤</p>
              <p className="text-navy font-semibold">¥ {settlement.meOweSharedCny.toLocaleString()} / 人</p>
            </div>
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">嘉豪 個人</p>
              <p className="text-navy font-semibold">¥ {settlement.meSelfCny.toLocaleString()}</p>
            </div>
          </div>
          {settlement.settlementCny >= 0.01 && (
            <button onClick={handleMarkSettledCny}
              className="w-full text-xs py-2.5 bg-ocean text-white rounded-xl font-semibold hover:bg-ocean/90 transition-colors">
              ✅ 標記為已結清 (¥ {settlement.settlementCny.toLocaleString()})
            </button>
          )}
        </div>

        {/* TWD Card */}
        <div className="bg-cream rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-navy">🇹🇼 台幣 (TWD)</h4>
            <span className={`text-sm font-bold ${settleLabel(settlement.settlementTwd).color}`}>
              {settlement.settlementTwd > 0 ? `翊婷 應付 嘉豪` : settlement.settlementTwd < 0 ? `嘉豪 應付 翊婷` : '已結清'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">嘉豪 實付</p>
              <p className="text-navy font-semibold">NT$ {settlement.mePaidTwd.toLocaleString()}</p>
            </div>
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">翊婷 實付</p>
              <p className="text-navy font-semibold">NT$ {settlement.yitingPaidTwd.toLocaleString()}</p>
            </div>
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">共同分攤</p>
              <p className="text-navy font-semibold">NT$ {settlement.meOweSharedTwd.toLocaleString()} / 人</p>
            </div>
            <div className="bg-soft-white rounded-lg p-2">
              <p className="text-warm-gray/60">嘉豪 個人</p>
              <p className="text-navy font-semibold">NT$ {settlement.meSelfTwd.toLocaleString()}</p>
            </div>
          </div>
          {settlement.settlementTwd >= 1 && (
            <button onClick={handleMarkSettledTwd}
              className="w-full text-xs py-2.5 bg-ocean text-white rounded-xl font-semibold hover:bg-ocean/90 transition-colors">
              ✅ 標記為已結清 (NT$ {settlement.settlementTwd.toLocaleString()})
            </button>
          )}
        </div>
      </div>

      {/* Settlement History */}
      {settlements.length > 0 && (
        <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50 space-y-3">
          <h3 className="text-sm font-semibold text-navy">📜 結算紀錄</h3>
          <div className="space-y-2">
            {settlements.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-cream rounded-lg p-3">
                <div className="text-xs">
                  <p className="font-medium text-navy">{s.from} → {s.to}</p>
                  <p className="text-warm-gray/60">
                    {new Date(s.createdAt).toLocaleDateString('zh-TW')} · {s.method || '現金'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${s.currency === 'CNY' ? 'text-coral' : 'text-ocean'}`}>
                    {s.currency === 'CNY' ? '¥' : 'NT$'} {s.amount.toLocaleString()}
                  </span>
                  <button onClick={() => removeSettlement(s.id)}
                    className="text-[10px] px-2 py-1 rounded-full bg-coral/10 text-coral hover:bg-coral/20 min-h-[28px]">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Cards */}
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

      {pinReady ? (
        <ExpenseList expenses={expenses} onRemove={removeExpense} onEdit={(e) => { setEditingExpense(e); setShowForm(true); }} onToast={showToast} />
      ) : (
        <div className="bg-soft-white rounded-card shadow-card p-6 border border-sand/50 text-center">
          <p className="text-sm text-warm-gray">🔒 正在準備...</p>
        </div>
      )}
      {pinEmpty && (
        <div className="bg-amber-50 border border-amber-200 rounded-card p-4 text-center">
          <p className="text-xs text-amber-800">未輸入 PIN，收據圖片將無法從雲端載入</p>
        </div>
      )}

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