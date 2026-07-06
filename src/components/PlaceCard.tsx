import type { Place } from '../data/trip';
import MapActions from './MapActions';

interface PlaceCardProps {
  place: Place;
}

const categoryIcons: Record<string, string> = {
  '景點': '🏛️',
  '文創': '🎨',
  '購物': '🛍️',
  '海灘': '🏖️',
};

export default function PlaceCard({ place }: PlaceCardProps) {
  return (
    <div className="bg-soft-white rounded-card shadow-card p-4 border border-sand/50">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{categoryIcons[place.category] || '📍'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-navy">{place.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gold-light/30 text-gold">
              {place.category}
            </span>
          </div>
          <p className="text-xs text-warm-gray mb-2">{place.description}</p>
          <p className="text-xs text-ocean flex items-start gap-1 mb-2">
            <span>💡</span>
            {place.tips}
          </p>
          {/* Map actions */}
          <MapActions name={place.name} />
        </div>
      </div>
    </div>
  );
}