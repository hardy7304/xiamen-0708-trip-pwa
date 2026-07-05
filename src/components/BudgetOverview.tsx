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

const PERSON_NAMES: Record<string, string> = { me: '嘉豪', yiting: '翊婷' };

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

  // Toggle settled on individual expense
  const handleToggleSettle = async (e: ExpenseRecord) => {
    const updated = { ...e, settled: !e.settled };
    await editExpense(updated);
    showToast(e.settled ? '已取消結清' : '✅ 已標記結清');
  };

  // Mark settlement recommendation as done — also mark related expenses as settled
  const handleMarkSettled = async (rec: { from: string; to: string; currency: 'CNY' | 'TWD'; amount: number }) => {
    // Mark all unsettled shared expenses in this currency as settled
    for (const e of expenses) {
      if (e.settled) continue;
      if (e.currency !== rec.currency) continue;
      if (e.expenseFor !== 'shared' && e.splitType !== 'equal' && e.splitType !== 'amount' && e.splitType !== 'ratio') continue;
      await editExpense({ ...e, settled: true });
    }
    await addSettlement({
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: PERSON_NAMES[rec.from] || rec.from,
      to: PERSON_NAMES[rec.to] || rec.to,
      currency: rec.currency,
      amount: rec.amount,
      method: '現金',
      createdAt: new Date().toISOString(),
      status: 'settled',
    });
    showToast('✅ 已標記結清');
  };

  // Helpers for the new balance structure
  const getPaid = (person: string, currency: 'cny' | 'twd') => {
    return settlement.paid[person]?.[currency] || 0;
  };
  const getOwed = (person: string, currency: 'cny' | 'twd') => {
    return settlement.owed[person]?.[currency] || 0;
  };
  const getPersonal = (person: string, currency: 'cny' | 'twd') => {
    return settlement.personal[person]?.[currency] || 0;
  };
  const getShared = (person: string, currency: 'cny' | 'twd') => {
    return settlement.shared[person]?.[currency] || 0;
  };

  const persons = ['me', 'yiting'];

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
        <h3 className="text-sm font-semibold text-navy">📊 分帳總覽</h3>

        {/* CNY Card */}
        <div className="bg-cream rounded-card p-4">
          <h4 className="text-xs font-semibold text-navy mb-3">🇨🇳 人民幣 (CNY)</h4>

          {/* 消費統計 */}
          <div className="mb-3">
            <h5 className="text-[11px] font-semibold text-warm-gray mb-1.5 uppercase tracking-wide">消費統計</h5>
            <div className="space-y-1 text-xs">
              <div className="bg-soft-white rounded-lg p-2 flex items-center justify-between">
                <span className="text-warm-gray/60">共同</span>
                <span className="text-navy font-medium">¥{persons.reduce((s, p) => s + getShared(p, 'cny'), 0).toLocaleString()}</span>
              </div>
              {persons.map(p => {
                const pAmt = getPersonal(p, 'cny');
                return (
                  <div key={`personal-cny-${p}`} className="bg-soft-white rounded-lg p-2 flex items-center justify-between">
                    <span className="text-warm-gray/60">{PERSON_NAMES[p]} 個人</span>
                    <span className="text-navy font-medium">¥{pAmt.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 結算建議 */}
          <div>
            <h5 className="text-[11px] font-semibold text-warm-gray mb-1.5 uppercase tracking-wide">結算建議</h5>
            <div className="space-y-1 text-xs mb-2">
              {persons.map(p => {
                const net = getPaid(p, 'cny') - getOwed(p, 'cny');
                return (
                  <div key={p} className="bg-soft-white rounded-lg p-2 flex items-center justify-between">
                    <span className="font-medium text-navy">{PERSON_NAMES[p]}</span>
                    <div className="flex gap-3 text-right">
                      <span className="text-warm-gray/60">已付 ¥{getPaid(p, 'cny').toLocaleString()}</span>
                      <span className="text-warm-gray/60">應負擔 ¥{getOwed(p, 'cny').toLocaleString()}</span>
                      <span className={`font-semibold ${net > 0.01 ? 'text-ocean' : net < -0.01 ? 'text-coral' : 'text-warm-gray'}`}>
                        {net > 0.01 ? `+¥${net.toLocaleString()}` : net < -0.01 ? `-¥${Math.abs(net).toLocaleString()}` : '¥0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-warm-gray/70 mb-2">個人消費會列入旅遊總支出，但不會要求對方分攤；只有共同消費或代付個人消費才會產生結算建議。</p>
            {settlement.recommendations.filter(r => r.currency === 'CNY').map((rec, i) => (
              <div key={i} className="flex items-center justify-between bg-soft-white rounded-lg p-2.5 mb-2">
                <span className="text-xs font-medium text-coral">
                  {PERSON_NAMES[rec.from]} → {PERSON_NAMES[rec.to]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-coral">¥ {rec.amount.toLocaleString()}</span>
                  <button onClick={() => handleMarkSettled(rec)}
                    className="text-[10px] px-2.5 py-1.5 bg-ocean text-white rounded-full font-medium hover:bg-ocean/90">
                    ✅ 標記結清
                  </button>
                </div>
              </div>
            ))}
            {settlement.recommendations.filter(r => r.currency === 'CNY').length === 0 && (
              <p className="text-xs text-warm-gray/60 text-center py-2">CNY 目前無需互相結算</p>
            )}
          </div>
        </div>

        {/* TWD Card */}
        <div className="bg-cream rounded-card p-4">
          <h4 className="text-xs font-semibold text-navy mb-3">🇹🇼 台幣 (TWD)</h4>

          {/* 消費統計 */}
          <div className="mb-3">
            <h5 className="text-[11px] font-semibold text-warm-gray mb-1.5 uppercase tracking-wide">消費統計</h5>
            <div className="space-y-1 text-xs">
              <div className="bg-soft-white rounded-lg p-2 flex items-center justify-between">
                <span className="text-warm-gray/60">共同</span>
                <span className="text-navy font-medium">NT${persons.reduce((s, p) => s + getShared(p, 'twd'), 0).toLocaleString()}</span>
              </div>
              {persons.map(p => {
                const pAmt = getPersonal(p, 'twd');
                return (
                  <div key={`personal-twd-${p}`} className="bg-soft-white rounded-lg p-2 flex items-center justify-between">
                    <span className="text-warm-gray/60">{PERSON_NAMES[p]} 個人</span>
                    <span className="text-navy font-medium">NT$ {pAmt.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 結算建議 */}
          <div>
            <h5 className="text-[11px] font-semibold text-warm-gray mb-1.5 uppercase tracking-wide">結算建議</h5>
            <div className="space-y-1 text-xs mb-2">
              {persons.map(p => {
                const net = getPaid(p, 'twd') - getOwed(p, 'twd');
                return (
                  <div key={p} className="bg-soft-white rounded-lg p-2 flex items-center justify-between">
                    <span className="font-medium text-navy">{PERSON_NAMES[p]}</span>
                    <div className="flex gap-3 text-right">
                      <span className="text-warm-gray/60">已付 NT${getPaid(p, 'twd').toLocaleString()}</span>
                      <span className="text-warm-gray/60">應負擔 NT${getOwed(p, 'twd').toLocaleString()}</span>
                      <span className={`font-semibold ${net > 1 ? 'text-ocean' : net < -1 ? 'text-coral' : 'text-warm-gray'}`}>
                        {net > 1 ? `+NT$${net.toLocaleString()}` : net < -1 ? `-NT$${Math.abs(net).toLocaleString()}` : 'NT$0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-warm-gray/70 mb-2">個人消費會列入旅遊總支出，但不會要求對方分攤；只有共同消費或代付個人消費才會產生結算建議。</p>
            {settlement.recommendations.filter(r => r.currency === 'TWD').map((rec, i) => (
              <div key={i} className="flex items-center justify-between bg-soft-white rounded-lg p-2.5 mb-2">
                <span className="text-xs font-medium text-coral">
                  {PERSON_NAMES[rec.from]} → {PERSON_NAMES[rec.to]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-coral">NT$ {rec.amount.toLocaleString()}</span>
                  <button onClick={() => handleMarkSettled(rec)}
                    className="text-[10px] px-2.5 py-1.5 bg-ocean text-white rounded-full font-medium hover:bg-ocean/90">
                    ✅ 標記結清
                  </button>
                </div>
              </div>
            ))}
            {settlement.recommendations.filter(r => r.currency === 'TWD').length === 0 && (
              <p className="text-xs text-warm-gray/60 text-center py-2">TWD 目前無需互相結算</p>
            )}
          </div>
        </div>

        {/* Cash CNY remaining */}
        <div className="bg-soft-white rounded-lg p-3 text-center">
          <p className="text-xs text-warm-gray">💰 人民幣現金剩餘</p>
          <p className="text-lg font-bold text-coral">¥ {settlement.cashCnyRemaining.toLocaleString()}</p>
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
        <ExpenseList
          expenses={expenses}
          onRemove={removeExpense}
          onEdit={(e) => { setEditingExpense(e); setShowForm(true); }}
          onToast={showToast}
          onToggleSettle={handleToggleSettle}
        />
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