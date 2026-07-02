import type { Stay } from '../data/trip';

interface StayCardProps {
  stay: Stay;
}

export default function StayCard({ stay }: StayCardProps) {
  return (
    <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏨</span>
          <div>
            <p className="text-sm font-semibold text-navy">{stay.name}</p>
            <p className="text-xs text-warm-gray">{stay.location === 'kinmen' ? '金門' : '廈門'}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
          {stay.status}
        </span>
      </div>
      <p className="text-xs text-warm-gray mb-3">{stay.address}</p>
      <div className="flex items-center gap-4 text-xs text-warm-gray mb-3">
        <div>
          <span className="text-gold">入住 </span>
          {stay.checkIn}
        </div>
        <div>
          <span className="text-gold">退房 </span>
          {stay.checkOut}
        </div>
      </div>
      <p className="text-xs text-warm-gray mb-1">{stay.roomType}</p>
      {stay.notes.length > 0 && (
        <div className="border-t border-sand/50 pt-3 mt-2">
          {stay.notes.map((note, i) => (
            <p key={i} className="text-xs text-coral/80 flex items-start gap-1.5 mb-1 last:mb-0">
              <span className="shrink-0">⚠️</span>
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}