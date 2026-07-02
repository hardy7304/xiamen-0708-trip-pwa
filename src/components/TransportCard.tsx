import type { TransportLeg } from '../data/trip';

interface TransportCardProps {
  leg: TransportLeg;
}

export default function TransportCard({ leg }: TransportCardProps) {
  const isFlight = leg.type === 'flight';
  const icon = isFlight ? '✈️' : '🚢';

  return (
    <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-warm-gray uppercase tracking-wider">
              {isFlight ? leg.company : leg.company}
            </p>
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
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-px bg-gold-light" />
          <span className="text-xs text-gold my-1">{isFlight ? '飛行' : '航行'}</span>
          <div className="w-12 h-px bg-gold-light" />
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-navy">{leg.arrivalTime}</p>
          <p className="text-xs text-warm-gray mt-1">{leg.arrival}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-warm-gray mb-3">
        <span>{leg.date}</span>
        {leg.price && <span className="font-medium text-ocean">{leg.price}</span>}
      </div>

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