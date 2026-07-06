import { openAmapNavigation, buildGoogleMapsUrl, buildAppleMapsUrl } from '../utils/mapLinks';

type MapActionsProps = {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  mode?: 'walk' | 'drive' | 'bus';
  compact?: boolean;
};

export default function MapActions({ name, address, lat, lng, mode = 'drive', compact = false }: MapActionsProps) {
  const place = { name, address, lat, lng };
  const gmapUrl = buildGoogleMapsUrl(place);
  const amapUrl = buildAppleMapsUrl(place);

  const handleCopyAddr = () => {
    const text = address || name;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => window.prompt('複製地址（手動複製）', text));
    } else {
      window.prompt('複製地址（手動複製）', text);
    }
  };

  if (compact) {
    return (
      <span className="inline-flex gap-0.5 align-middle">
        <button onClick={() => openAmapNavigation(place, mode)}
          className="text-ocean hover:text-ocean-light text-[10px] px-0.5 cursor-pointer bg-transparent border-0" title="高德地圖">🗺️</button>
        <a href={gmapUrl} target="_blank" rel="noopener noreferrer"
          className="text-warm-gray hover:text-warm-gray/70 text-[10px] px-0.5" title="Google 地圖">📍</a>
      </span>
    );
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      <button onClick={() => openAmapNavigation(place, mode)}
        className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-ocean/10 text-ocean font-medium hover:bg-ocean/20 transition-colors cursor-pointer border-0">
        🗺️ 高德導航
      </button>
      <a href={gmapUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20 transition-colors">
        📍 Google
      </a>
      <a href={amapUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20 transition-colors">
        🍎 Apple
      </a>
      <button onClick={handleCopyAddr}
        className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20 transition-colors cursor-pointer border-0">
        📋 複製地址
      </button>
    </div>
  );
}