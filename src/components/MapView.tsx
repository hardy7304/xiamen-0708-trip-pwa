import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';

// CSV row interface
interface SpotRow {
  name: string;
  lat: number;
  lng: number;
  category: string;
  day_label: string;
  hours: string;
  price: string;
  tips: string;
  warning: string;
}

// Color map by category
const CATEGORY_COLORS: Record<string, string> = {
  Landmark: '#2c6e91',
  Food: '#e8833a',
  Mall: '#8b5cf6',
  Cultural: '#c9a96e',
  Hotel: '#22c55e',
  Wellness: '#ec4899',
  Park: '#84cc16',
  Religious: '#ef4444',
  Transport: '#6b7280',
};

// All known days from CSV (7/8-7/14)
const ALL_DAYS = ['7/8', '7/9', '7/10', '7/11', '7/12', '7/13', '7/14'];

// All known categories
const ALL_CATEGORIES = ['Landmark', 'Food', 'Mall', 'Cultural', 'Hotel', 'Wellness', 'Park', 'Religious', 'Transport'];

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1wM-brW_yG22bcphlBbvHyad98Br7YNVdPgkiXsLkV-c/export?format=csv';

function parseCSV(csv: string): SpotRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('name');
  const latIdx = headers.indexOf('lat');
  const lngIdx = headers.indexOf('lng');
  const catIdx = headers.indexOf('category');
  const dayIdx = headers.indexOf('day_label');
  const hoursIdx = headers.indexOf('hours');
  const priceIdx = headers.indexOf('price');
  const tipsIdx = headers.indexOf('tips');
  const warningIdx = headers.indexOf('warning');
  if (nameIdx === -1 || latIdx === -1 || lngIdx === -1) return [];

  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    return {
      name: (cols[nameIdx] || '').trim(),
      lat: parseFloat(cols[latIdx] || '0'),
      lng: parseFloat(cols[lngIdx] || '0'),
      category: (cols[catIdx] || '').trim(),
      day_label: (cols[dayIdx] || '').trim(),
      hours: (cols[hoursIdx] || '').trim(),
      price: (cols[priceIdx] || '').trim(),
      tips: (cols[tipsIdx] || '').trim(),
      warning: (cols[warningIdx] || '').trim(),
    };
  }).filter(r => r.name && !isNaN(r.lat) && !isNaN(r.lng));
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function generateCSV(spots: SpotRow[]): string {
  const header = 'name,lat,lng,category,day_label,tips,warning';
  const rows = spots.map(s =>
    `"${s.name}",${s.lat},${s.lng},"${s.category}","${s.day_label}","${(s.tips || '').replace(/"/g, '""')}","${(s.warning || '').replace(/"/g, '""')}"`
  );
  return [header, ...rows].join('\n');
}

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch CSV
  useEffect(() => {
    fetch(CSV_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(csv => {
        const parsed = parseCSV(csv);
        setSpots(parsed);
        setLoading(false);
      })
      .catch(e => {
        console.error('CSV fetch error:', e);
        setError('無法載入景點資料，請檢查網路連線');
        setLoading(false);
      });
  }, []);

  // Filtered spots
  const filteredSpots = useMemo(() => {
    return spots.filter(s => {
      if (selectedDay && s.day_label !== selectedDay) return false;
      if (selectedCategory && s.category !== selectedCategory) return false;
      return true;
    });
  }, [spots, selectedDay, selectedCategory]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [24.4789, 118.0894],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const bounds = L.latLngBounds([] as L.LatLng[]);

    filteredSpots.forEach(spot => {
      const color = CATEGORY_COLORS[spot.category] || '#6b7280';
      const marker = L.circleMarker([spot.lat, spot.lng], {
        radius: 9,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });

      let popupContent = `<div style="font-family: 'Noto Sans TC', sans-serif; max-width: 240px;">`;
      popupContent += `<b style="font-size:14px;">${escHtml(spot.name)}</b>`;
      if (spot.day_label) popupContent += `<br><span style="font-size:11px;color:#666;">📅 ${escHtml(spot.day_label)}</span>`;
      if (spot.hours) popupContent += `<br><span style="font-size:11px;color:#666;">🕐 ${escHtml(spot.hours)}</span>`;
      if (spot.price) popupContent += `<br><span style="font-size:11px;color:#666;">💰 ${escHtml(spot.price)}</span>`;
      if (spot.tips) popupContent += `<br><span style="font-size:11px;color:#2c6e91;">💡 ${escHtml(spot.tips)}</span>`;
      if (spot.warning) popupContent += `<br><span style="font-size:11px;color:#e8833a;">⚠️ ${escHtml(spot.warning)}</span>`;
      popupContent += `</div>`;

      marker.bindPopup(popupContent, { maxWidth: 260 });
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.extend([spot.lat, spot.lng]);
    });

    if (filteredSpots.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [filteredSpots]);

  // Export CSV
  const handleExport = useCallback(() => {
    const csv = filteredSpots.length > 0 ? generateCSV(filteredSpots) : generateCSV(spots);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xiamen-spots.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSpots, spots]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-3">
      {/* Loading / Error */}
      {loading && (
        <div className="bg-soft-white rounded-card shadow-card p-6 text-center">
          <p className="text-sm text-warm-gray">🗺️ 正在載入景點資料...</p>
        </div>
      )}
      {error && (
        <div className="bg-coral/10 border border-coral/30 rounded-card p-4">
          <p className="text-sm text-coral">{error}</p>
        </div>
      )}

      {/* Filters */}
      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-warm-gray shrink-0">日期：</span>
            <button
              onClick={() => setSelectedDay('')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!selectedDay ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20'}`}
            >
              全部
            </button>
            {ALL_DAYS.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d === selectedDay ? '' : d)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${selectedDay === d ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20'}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-warm-gray shrink-0">類別：</span>
            <button
              onClick={() => setSelectedCategory('')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!selectedCategory ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20'}`}
            >
              全部
            </button>
            {ALL_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c === selectedCategory ? '' : c)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors`}
                style={selectedCategory === c ? { backgroundColor: CATEGORY_COLORS[c] || '#6b7280', color: '#fff' } : { backgroundColor: (CATEGORY_COLORS[c] || '#6b7280') + '20', color: CATEGORY_COLORS[c] || '#6b7280' }}
              >
                {selectedCategory === c ? `✓ ${c}` : c}
              </button>
            ))}
          </div>

          {/* Reset */}
          {(selectedDay || selectedCategory) && (
            <button
              onClick={() => { setSelectedDay(''); setSelectedCategory(''); }}
              className="text-xs text-ocean font-medium hover:underline"
            >
              🔄 全部顯示（{filteredSpots.length} 個景點）
            </button>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            className="text-xs px-4 py-2 bg-ocean text-white rounded-xl font-medium hover:bg-ocean/90 transition-colors w-full"
          >
            📥 匯出 My Maps CSV（{filteredSpots.length || spots.length} 筆）
          </button>
        </>
      )}

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-card overflow-hidden shadow-card border border-sand/50"
        style={{ height: '60vh', minHeight: '350px' }}
      />
    </div>
  );
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}