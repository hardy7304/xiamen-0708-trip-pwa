import type { TimelineItem as TimelineItemType } from '../data/trip';

interface TimelineProps {
  items: TimelineItemType[];
}

function TinyMapButton({ links }: { links: { amap?: string; google?: string } }) {
  return (
    <span className="inline-flex gap-0.5 ml-1 align-middle">
      {links.amap && (
        <a href={links.amap} target="_blank" rel="noopener noreferrer"
          className="text-ocean hover:text-ocean-light text-[10px] px-0.5" title="高德地圖"
          onClick={(e) => e.stopPropagation()}>🗺️</a>
      )}
      {links.google && (
        <a href={links.google} target="_blank" rel="noopener noreferrer"
          className="text-gold hover:text-gold-light text-[10px] px-0.5" title="Google Maps"
          onClick={(e) => e.stopPropagation()}>📍</a>
      )}
    </span>
  );
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
          <p className={`text-xs tracking-wider mb-0.5 flex items-center gap-1 ${
            item.highlight ? 'text-ocean font-semibold' : 'text-gold'
          }`}>
            {item.time}
            {item.mapLinks && <TinyMapButton links={item.mapLinks} />}
          </p>
          <p className={`text-sm ${item.highlight ? 'text-navy font-medium' : 'text-warm-gray'}`}>
            {item.label}
            {!item.time && item.mapLinks && <TinyMapButton links={item.mapLinks} />}
          </p>
          {item.detail && (
            <p className="text-xs text-warm-gray/70 mt-0.5">{item.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}