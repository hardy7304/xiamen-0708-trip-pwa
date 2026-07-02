import type { TimelineItem } from '../data/trip';

interface TimelineProps {
  items: TimelineItem[];
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative pl-6 border-l-2 border-gold-light">
      {items.map((item, i) => (
        <div key={i} className={`relative pb-5 last:pb-0 ${item.highlight ? 'font-semibold' : ''}`}>
          <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${
            item.highlight
              ? 'bg-ocean border-ocean shadow-lg shadow-ocean/30'
              : 'bg-cream border-gold'
          }`} />
          <p className={`text-xs tracking-wider mb-0.5 ${
            item.highlight ? 'text-ocean font-semibold' : 'text-gold'
          }`}>
            {item.time}
          </p>
          <p className={`text-sm ${item.highlight ? 'text-navy font-medium' : 'text-warm-gray'}`}>
            {item.label}
          </p>
          {item.detail && (
            <p className="text-xs text-warm-gray/70 mt-0.5">{item.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}