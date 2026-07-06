import type { TransportLeg } from '../data/trip';
import MapActions from './MapActions';

interface TransportCardProps {
  leg: TransportLeg;
  now: number;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '已出發';
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  if (d > 0) return `${d} 天 ${h} 小時 ${m} 分 ${s} 秒`;
  if (h > 0) return `${h} 小時 ${m} 分 ${s} 秒`;
  return `${m} 分 ${s} 秒`;
}

export default function TransportCard({ leg, now }: TransportCardProps) {
  const isFlight = leg.type === 'flight';
  const icon = isFlight ? '✈️' : '🚢';
  const depTime = new Date(leg.dateTime).getTime();
  const countdown = depTime - now;
  const isPast = countdown <= 0;

  // Suggested departure time: 1.5 hours before for flights, 40 min for ferry
  const suggestOffset = isFlight ? 90 * 60 * 1000 : 40 * 60 * 1000;
  const suggestTime = depTime - suggestOffset;
  const suggestCountdown = suggestTime - now;

  return (
    <div className={`bg-soft-white rounded-card shadow-card p-5 border ${isPast ? 'border-sand/30 opacity-60' : 'border-sand/50'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-warm-gray uppercase tracking-wider">{leg.company}</p>
            <p className="text-sm font-semibold text-navy">{leg.flightNo}</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          leg.status === 'booked' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {leg.status === 'booked' ? '已訂' : '未取票'}
        </span>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-navy">{leg.departureTime}</p>
          <p className="text-xs text-warm-gray mt-1">{leg.departure}</p>
          <div className="mt-1">
            <MapActions name={leg.departure} compact />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-px bg-gold-light" />
          <span className="text-xs text-gold my-1">{isFlight ? '飛行' : '航行'}</span>
          <div className="w-12 h-px bg-gold-light" />
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-navy">{leg.arrivalTime}</p>
          <p className="text-xs text-warm-gray mt-1">{leg.arrival}</p>
          <div className="mt-1">
            <MapActions name={leg.arrival} compact />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-warm-gray mb-3">
        <span>{leg.date}</span>
        {leg.price && <span className="font-medium text-ocean">{leg.price}</span>}
      </div>

      {/* Countdown */}
      {!isPast && (
        <div className="bg-ocean/5 border border-ocean/20 rounded-xl p-3 mb-3 text-center">
          <p className="text-xs text-ocean">
            倒數出發：<span className="font-semibold tabular-nums">{formatCountdown(countdown)}</span>
          </p>
          {suggestCountdown > 0 && (
            <p className="text-[10px] text-warm-gray mt-1">
              建議 {isFlight ? '提前 1.5 小時，' : '提前 40 分鐘，'}約 {new Date(suggestTime).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' })} 出發 · 還有 {formatCountdown(suggestCountdown)}
            </p>
          )}
        </div>
      )}

      {leg.tips && leg.tips.length > 0 && (
        <div className="border-t border-sand/50 pt-3 mt-2">
          {leg.tips.map((tip, i) => (
            <p key={i} className="text-xs text-warm-gray flex items-start gap-1.5 mb-1 last:mb-0">
              <span className="text-gold shrink-0 mt-0.5">•</span>
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}