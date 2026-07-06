export type MapPlace = {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
};

/** Build Amap Web URL for navigation (prefers lng,lat if available, otherwise search) */
export function buildAmapWebUrl(place: MapPlace, mode: 'walk' | 'drive' | 'bus' = 'drive'): string {
  if (place.lng !== undefined && place.lat !== undefined) {
    const base = 'https://uri.amap.com/navigation';
    const params = new URLSearchParams();
    params.set('to', `${place.lng},${place.lat},${place.name}`);
    params.set('mode', mode);
    params.set('policy', '1');
    params.set('src', 'xiamen-trip-pwa');
    params.set('coordinate', 'gaode');
    params.set('callnative', '1');
    return `${base}?${params.toString()}`;
  }
  // fallback to search
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(place.name || place.address || '')}&src=xiamen-trip-pwa&callnative=1`;
}

/** Build Amap app scheme URL for iOS */
export function buildAmapAppUrl(place: MapPlace, platform: 'ios' | 'android', mode: 'walk' | 'drive' | 'bus' = 'drive'): string | null {
  if (place.lng === undefined || place.lat === undefined) return null;
  const t = mode === 'walk' ? 2 : mode === 'bus' ? 1 : 0;
  const base = platform === 'ios' ? 'iosamap://path' : 'androidamap://route/plan/';
  const params = new URLSearchParams();
  params.set('sourceApplication', 'xiamen-trip-pwa');
  params.set('dlat', String(place.lat));
  params.set('dlon', String(place.lng));
  params.set('dname', place.name);
  params.set('dev', '0');
  params.set('t', String(t));
  return `${base}?${params.toString()}`;
}

/** Build Google Maps URL (lat,lng order) */
export function buildGoogleMapsUrl(place: MapPlace): string {
  if (place.lat !== undefined && place.lng !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name || place.address || '')}`;
}

/** Build Apple Maps URL (lat,lng order) */
export function buildAppleMapsUrl(place: MapPlace): string {
  if (place.lat !== undefined && place.lng !== undefined) {
    return `https://maps.apple.com/?ll=${place.lat},${place.lng}&q=${encodeURIComponent(place.name)}`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(place.name || place.address || '')}`;
}

/** Determine if running on iOS */
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** Determine if running on Android */
function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/** Copy text to clipboard */
function copyToClipboard(text: string): boolean {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

/**
 * Open Amap navigation with app-first, web-fallback strategy.
 * On mobile: try app scheme first, fallback to web after 700ms.
 * On desktop: open web URL in new tab.
 * If no coordinates, opens Amap search.
 */
export function openAmapNavigation(place: MapPlace, mode: 'walk' | 'drive' | 'bus' = 'drive'): void {
  const webUrl = buildAmapWebUrl(place, mode);

  if (isIOS() || isAndroid()) {
    const platform = isIOS() ? 'ios' as const : 'android' as const;
    const appUrl = buildAmapAppUrl(place, platform, mode);
    if (appUrl) {
      // Try app scheme first
      const startTime = Date.now();
      window.location.href = appUrl;
      // Fallback to web after 700ms if app doesn't open
      setTimeout(() => {
        if (Date.now() - startTime < 1500) {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        }
      }, 700);
      return;
    }
  }

  // Desktop or no app scheme — open web
  window.open(webUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Show a bottom sheet style map chooser.
 * Returns the place text if nothing else available.
 */
export function showMapOptions(place: MapPlace): {
  openAmap: () => void;
  openGoogle: () => void;
  openApple: () => void;
  copyAddr: () => boolean;
  hasAmapApp: boolean;
} {
  const addr = place.address || place.name;
  return {
    openAmap: () => openAmapNavigation(place),
    openGoogle: () => window.open(buildGoogleMapsUrl(place), '_blank', 'noopener,noreferrer'),
    openApple: () => window.open(buildAppleMapsUrl(place), '_blank', 'noopener,noreferrer'),
    copyAddr: () => copyToClipboard(addr),
    hasAmapApp: isIOS() || isAndroid(),
  };
}