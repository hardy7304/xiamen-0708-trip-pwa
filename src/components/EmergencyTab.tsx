import { useState } from 'react';
import { emergencyContacts, emergencySteps, phraseCards } from '../data/emergency';
import { geoGoogle } from '../data/trip';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select via textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
  };
  return (
    <button onClick={handleCopy}
      className="text-[10px] px-2.5 py-1 rounded-full bg-ocean/10 text-ocean font-medium hover:bg-ocean/20 transition-colors shrink-0 min-h-[28px]">
      {copied ? '✅ 已複製' : '📋 複製'}
    </button>
  );
}

export default function EmergencyTab() {
  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      <div className="bg-coral/10 border border-coral/30 rounded-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🆘</span>
          <div>
            <h3 className="text-sm font-semibold text-coral">緊急應變中心</h3>
            <p className="text-xs text-coral/70 mt-0.5">遇到突發狀況時，先保持冷靜，確認人身安全，再依照下方流程處理。</p>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-coral/10 text-coral font-medium">1. 先確認人身安全</span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-coral/10 text-coral font-medium">2. 先保住證件與手機</span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-coral/10 text-coral font-medium">3. 先留下紀錄與截圖</span>
        </div>
      </div>

      {/* Section 1: Contacts */}
      <div>
        <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-1.5">📞 快速撥號 / 聯絡資訊</h3>
        <div className="space-y-2">
          {emergencyContacts.map((c, i) => (
            <div key={i} className="bg-soft-white rounded-card shadow-card p-3 border border-sand/50 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy">{c.name}</p>
                {c.phone && c.phone !== '待確認' && c.phone !== '待填' && (
                  <a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}
                    className="text-xs text-ocean font-semibold underline">
                    {c.phone}
                  </a>
                )}
                {c.phone && (c.phone === '待確認' || c.phone === '待填') && (
                  <span className="text-xs text-warm-gray/50 italic">{c.phone}</span>
                )}
                {c.note && <p className="text-[10px] text-warm-gray/60 mt-0.5">{c.note}</p>}
                {c.address && (
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-[10px] text-warm-gray/60">{c.address}</span>
                    <a href={geoGoogle(c.address)} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-ocean underline">📍 地圖</a>
                  </div>
                )}
              </div>
              {c.phone && c.phone !== '待確認' && c.phone !== '待填' && (
                <a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}
                  className="text-xs px-3 py-2 bg-ocean text-white rounded-xl font-medium shrink-0 hover:bg-ocean/90 transition-colors min-h-[36px] flex items-center">
                  📞 撥打
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: SOPs */}
      <div>
        <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-1.5">📋 常見狀況 SOP</h3>
        <div className="space-y-2">
          {emergencySteps.map((step) => (
            <details key={step.id} className="bg-soft-white rounded-card shadow-card border border-sand/50 group">
              <summary className="p-3 cursor-pointer list-none flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy">{step.title}</p>
                  <p className="text-xs text-warm-gray">{step.description}</p>
                </div>
                <svg className="w-4 h-4 text-warm-gray group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-3 pb-3 space-y-1.5">
                {step.steps.map((s, si) => (
                  <p key={si} className="text-xs text-warm-gray flex items-start gap-2">
                    <span className="text-ocean shrink-0 mt-0.5">{si + 1}.</span>
                    {s.replace(/^\d+\.\s*/, '')}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Section 3: Phrase Cards */}
      <div>
        <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-1.5">💬 常用話術卡</h3>
        <div className="space-y-3">
          {phraseCards.map((cat, ci) => (
            <div key={ci}>
              <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">{cat.category}</h4>
              <div className="space-y-1.5">
                {cat.phrases.map((p, pi) => (
                  <div key={pi} className="bg-soft-white rounded-card shadow-card p-3 border border-sand/50 flex items-start gap-2">
                    <p className="flex-1 text-xs text-warm-gray leading-relaxed">{p}</p>
                    <CopyButton text={p} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Hotel Payment Reminder */}
      <div>
        <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-1.5">🏨 住宿付款提醒</h3>
        <div className="bg-soft-white rounded-card shadow-card p-4 border border-sand/50 space-y-2 text-xs text-warm-gray">
          <p>• 佰翔/廈門住宿若是「到店付」，通常代表現場結算，訂房信用卡可能只是擔保。</p>
          <p>• Check-in 時主動確認可用付款方式：信用卡、現金人民幣、支付寶、微信。</p>
          <p>• 如果想改用其他方式付款，請先跟櫃台說明，避免最後直接刷擔保卡。</p>
          <p>• 付款後請保留收據、截圖或發票。</p>
          <div className="bg-cream rounded-lg p-2.5 border border-sand mt-2 flex items-start gap-2">
            <p className="text-xs text-warm-gray flex-1">「你好，我這筆訂單是到店付，請問可以用支付寶、微信、信用卡或現金付款嗎？」</p>
            <CopyButton text="你好，我這筆訂單是到店付，請問可以用支付寶、微信、信用卡或現金付款嗎？" />
          </div>
        </div>
      </div>
    </div>
  );
}