import { useState } from 'react';
import type { MassagePlan as MassagePlanType } from '../data/trip';
import MapActions from './MapActions';

interface MassagePlanProps {
  plan: MassagePlanType;
}

export default function MassagePlan({ plan }: MassagePlanProps) {
  const [showChecklist, setShowChecklist] = useState(false);

  return (
    <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💆</span>
        <div>
          <h3 className="text-sm font-semibold text-navy">{plan.name}</h3>
          <p className="text-xs text-warm-gray">{plan.location}</p>
        </div>
      </div>

      {/* Map actions */}
      <div className="mb-4">
        <MapActions name={plan.name} address={plan.location} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-cream rounded-xl p-3 text-center">
          <p className="text-xs text-warm-gray mb-0.5">預算</p>
          <p className="text-sm font-semibold text-navy">{plan.budget}</p>
        </div>
        <div className="bg-cream rounded-xl p-3 text-center">
          <p className="text-xs text-warm-gray mb-0.5">時間</p>
          <p className="text-sm font-semibold text-navy">{plan.duration}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-warm-gray mb-2 font-medium">方案選擇</p>
        <div className="flex flex-wrap gap-2">
          {plan.options.map((opt) => (
            <span key={opt} className="text-xs px-3 py-1.5 bg-ocean/10 text-ocean rounded-full">
              {opt}
            </span>
          ))}
        </div>
      </div>

      {/* Before booking checklist */}
      {plan.beforeBooking && plan.beforeBooking.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="w-full flex items-center justify-between text-xs font-medium text-coral bg-coral/5 rounded-xl p-3 hover:bg-coral/10 transition-colors"
          >
            <span>📋 預約前必問清單</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${showChecklist ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showChecklist && (
            <div className="bg-coral/5 border border-coral/10 rounded-xl p-3 mt-2 space-y-1.5">
              {plan.beforeBooking.map((item, i) => (
                <p key={i} className="text-xs text-warm-gray flex items-start gap-2">
                  <span className="text-coral shrink-0">☐</span>
                  {item}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-sand/50 pt-3">
        {plan.tips.map((tip, i) => (
          <p key={i} className="text-xs text-warm-gray flex items-start gap-1.5 mb-1 last:mb-0">
            <span className="text-gold shrink-0">💡</span>
            {tip}
          </p>
        ))}
      </div>
    </div>
  );
}