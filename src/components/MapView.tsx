import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';

interface SpotRow {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  day_label: string;
  hours: string;
  price: string;
  tips: string;
  warning: string;
  source?: string;
}

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

const CATEGORY_ZH: Record<string, string> = {
  Landmark: '地標',
  Food: '美食',
  Mall: '購物中心',
  Cultural: '文創景點',
  Hotel: '住宿',
  Wellness: '養生',
  Park: '公園綠地',
  Religious: '宗教景點',
  Transport: '交通',
};

const ALL_DAYS = ['7/8', '7/9', '7/10', '7/11', '7/12', '7/13', '7/14'];
const ALL_CATEGORIES = ['Landmark', 'Food', 'Mall', 'Cultural', 'Hotel', 'Wellness', 'Park', 'Religious', 'Transport'];

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1wM-brW_yG22bcphlBbvHyad98Br7YNVdPgkiXsLkV-c/export?format=csv';

function parseCSVLocal(csv: string): SpotRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('name');
  const latIdx = headers.indexOf('lat');
  const lngIdx = headers.indexOf('lng');
  if (nameIdx === -1 || latIdx === -1 || lngIdx === -1) return [];
  const catIdx = headers.indexOf('category');
  const dayIdx = headers.indexOf('day_label');
  const hoursIdx = headers.indexOf('hours');
  const priceIdx = headers.indexOf('price');
  const tipsIdx = headers.indexOf('tips');
  const warningIdx = headers.indexOf('warning');
  return lines.slice(1).map((line, i) => {
    const cols = parseCSVLineLocal(line);
    return {
      id: `csv-${i}`,
      name: (cols[nameIdx] || '').trim(),
      lat: parseFloat(cols[latIdx] || '0'),
      lng: parseFloat(cols[lngIdx] || '0'),
      category: (cols[catIdx] || '').trim(),
      day_label: (cols[dayIdx] || '').trim(),
      hours: (cols[hoursIdx] || '').trim(),
      price: (cols[priceIdx] || '').trim(),
      tips: (cols[tipsIdx] || '').trim(),
      warning: (cols[warningIdx] || '').trim(),
      source: 'sheets',
    };
  }).filter(r => r.name && !isNaN(r.lat) && !isNaN(r.lng));
}

function parseCSVLineLocal(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
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
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Add spot form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDay, setFormDay] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTips, setFormTips] = useState('');
  const [formWarning, setFormWarning] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  // Fetch spots from API, fallback to CSV
  const loadSpots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/spots');
      if (resp.ok) {
        const data = await resp.json();
        if (data.spots && data.spots.length > 0) {
          setSpots(data.spots);
          setLoading(false);
          return;
        }
      }
      // Fallback: fetch CSV directly
      const csvResp = await fetch(CSV_URL);
      if (!csvResp.ok) throw new Error(`HTTP ${csvResp.status}`);
      const csvText = await csvResp.text();
      setSpots(parseCSVLocal(csvText));
    } catch (e) {
      console.error('Fetch error:', e);
      setError('無法載入景點資料');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSpots(); }, [loadSpots]);

  // Sync sheets
  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('同步中...');
    try {
      const resp = await fetch('/api/sync-sheets', { method: 'POST' });
      const data = await resp.json();
      if (data.success) {
        setSyncMsg(`已同步 ${data.count} 筆（Sheets: ${data.sheets_count} + 手動: ${data.manual_count}）`);
        loadSpots();
      } else {
        setSyncMsg('同步失敗：' + (data.error || '未知錯誤'));
      }
    } catch (e: any) {
      setSyncMsg('同步失敗：' + e.message);
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(''), 5000);
  };

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

    // Invalidate size when tab becomes visible (for mobile)
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (filteredSpots.length === 0) return;
    const bounds = L.latLngBounds([] as L.LatLng[]);

    filteredSpots.forEach(spot => {
      const color = CATEGORY_COLORS[spot.category] || '#6b7280';
      const isManual = spot.source === 'manual';
      const radius = isManual ? 10 : 9;

      const marker = L.circleMarker([spot.lat, spot.lng], {
        radius,
        fillColor: isManual ? '#fbbf24' : color,
        color: isManual ? '#d97706' : '#ffffff',
        weight: isManual ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.85,
      });

      // Star icon for manual spots via divIcon overlay
      if (isManual) {
        const starIcon = L.divIcon({
          className: '',
          html: '<div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);font-size:16px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));pointer-events:none;">⭐</div>',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([spot.lat, spot.lng], { icon: starIcon, interactive: false }).addTo(map);
      }

      const cn = CATEGORY_ZH[spot.category] || spot.category;
      let popupContent = `<div style="font-family:'Noto Sans TC',sans-serif;max-width:220px;">`;
      popupContent += `<b style="font-size:14px;">${escHtml(spot.name)}</b>`;
      if (spot.category) popupContent += ` <span style="font-size:10px;color:${color};">${escHtml(cn)}</span>`;
      if (spot.day_label) popupContent += `<br><span style="font-size:10px;color:#666;">📅 ${escHtml(spot.day_label)}</span>`;
      if (spot.hours) popupContent += `<br><span style="font-size:10px;color:#666;">🕐 ${escHtml(spot.hours)}</span>`;
      if (spot.price) popupContent += `<br><span style="font-size:10px;color:#666;">💰 ${escHtml(spot.price)}</span>`;
      if (spot.tips) popupContent += `<br><span style="font-size:10px;color:#2c6e91;">💡 ${escHtml(spot.tips)}</span>`;
      if (spot.warning) popupContent += `<br><span style="font-size:10px;color:#e8833a;">⚠️ ${escHtml(spot.warning)}</span>`;
      // Nav buttons
      popupContent += `<br><div style="display:flex;gap:4px;margin-top:6px;">`;
      popupContent += `<a href="https://uri.amap.com/search?keyword=${encodeURIComponent(spot.name)}" target="_blank" rel="noopener" style="display:inline-block;padding:4px 10px;background:#2c6e91;color:#fff;border-radius:999px;font-size:10px;text-decoration:none;">🗺️ 高德</a>`;
      popupContent += `<a href="https://maps.google.com/?q=${spot.lat},${spot.lng}" target="_blank" rel="noopener" style="display:inline-block;padding:4px 10px;background:#c9a96e;color:#fff;border-radius:999px;font-size:10px;text-decoration:none;">📍 Google</a>`;
      if (isManual) popupContent += `<span style="font-size:10px;color:#d97706;">⭐ 手動</span>`;
      popupContent += `</div></div>`;

      marker.bindPopup(popupContent, { maxWidth: 260 });
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.extend([spot.lat, spot.lng]);
    });

    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    map.invalidateSize();
  }, [filteredSpots, loading]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => mapRef.current?.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Geolocate
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setFormMsg('瀏覽器不支援定位'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setFormLat(String(pos.coords.latitude)); setFormLng(String(pos.coords.longitude)); setFormMsg('已取得位置 ✅'); setTimeout(() => setFormMsg(''), 2000); },
      () => { setFormMsg('無法取得位置 ❌'); setTimeout(() => setFormMsg(''), 2000); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddSpot = async () => {
    if (!formName || !formLat || !formLng) { setFormMsg('請填寫景點名稱與位置'); return; }
    setFormSubmitting(true);
    try {
      const resp = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          lat: parseFloat(formLat),
          lng: parseFloat(formLng),
          category: formCategory,
          day_label: formDay,
          tips: formTips,
          warning: formWarning,
        }),
      });
      const data = await resp.json();
      if (data.success && data.spot) {
        setSpots(prev => [...prev, data.spot]);
        setFormName(''); setFormCategory(''); setFormDay(''); setFormAddress('');
        setFormTips(''); setFormWarning(''); setFormLat(''); setFormLng('');
        setShowForm(false);
        setFormMsg('');
      } else {
        setFormMsg('新增失敗');
      }
    } catch (e: any) {
      setFormMsg('新增失敗：' + e.message);
    }
    setFormSubmitting(false);
  };

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

  // Generate day summary for selected day
  const daySummary = useMemo(() => {
    if (!selectedDay) return '';
    const daySpots = spots.filter(s => s.day_label === selectedDay);
    if (daySpots.length === 0) return `${selectedDay}・0 個景點`;
    // Find the itinerary title from parent data? Just show count
    return `${selectedDay}・${daySpots.length} 個景點`;
  }, [selectedDay, spots]);

  return (
    <div className="relative space-y-3">
      {/* Loading / Error */}
      {loading && (
        <div className="bg-soft-white rounded-card shadow-card p-6 text-center">
          <p className="text-sm text-warm-gray">🗺️ 正在載入景點資料...</p>
        </div>
      )}
      {error && (
        <div className="bg-coral/10 border border-coral/30 rounded-card p-4">
          <p className="text-sm text-coral">{error}</p>
          <button onClick={loadSpots} className="text-xs text-ocean underline mt-1">重試</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Sync & Export row */}
          <div className="flex gap-2">
            <button onClick={handleSync} disabled={syncing}
              className="text-xs px-3 py-1.5 bg-ocean text-white rounded-lg font-medium hover:bg-ocean/90 transition-colors disabled:opacity-60">
              {syncing ? '⏳ 同步中...' : '🔄 同步 Sheets'}
            </button>
            <button onClick={handleExport}
              className="text-xs px-3 py-1.5 bg-gold text-navy rounded-lg font-medium hover:bg-gold-light transition-colors">
              📥 匯出 CSV
            </button>
            <span className="text-xs text-warm-gray self-center ml-auto">{spots.length} 個景點</span>
          </div>
          {syncMsg && (
            <div className="bg-ocean/5 border border-ocean/20 rounded-lg p-2 text-xs text-ocean">{syncMsg}</div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-warm-gray shrink-0">日期：</span>
            <button
              onClick={() => setSelectedDay('')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${!selectedDay ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}
            >全部</button>
            {ALL_DAYS.map(d => (
              <button key={d}
                onClick={() => setSelectedDay(d === selectedDay ? '' : d)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${selectedDay === d ? 'bg-ocean text-white shadow-sm' : 'bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20'}`}
              >{d}</button>
            ))}
          </div>
          {selectedDay && (
            <div className="text-xs text-ocean font-medium">📍 {daySummary}</div>
          )}

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-warm-gray shrink-0">類別：</span>
            <button
              onClick={() => setSelectedCategory('')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${!selectedCategory ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}
            >全部</button>
            {ALL_CATEGORIES.map(c => {
              const zh = CATEGORY_ZH[c] || c;
              return (
                <button key={c}
                  onClick={() => setSelectedCategory(c === selectedCategory ? '' : c)}
                  style={selectedCategory === c
                    ? { backgroundColor: CATEGORY_COLORS[c] || '#6b7280', color: '#fff' }
                    : { backgroundColor: (CATEGORY_COLORS[c] || '#6b7280') + '18', color: CATEGORY_COLORS[c] || '#6b7280' }}
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors"
                >{selectedCategory === c ? `✓ ${zh}` : zh}</button>
              );
            })}
          </div>

          {/* Legend */}
          <details className="bg-soft-white rounded-lg border border-sand/30">
            <summary className="p-2 text-[10px] text-warm-gray cursor-pointer list-none">🎨 圖例</summary>
            <div className="px-3 pb-2 grid grid-cols-3 gap-1">
              {ALL_CATEGORIES.map(c => (
                <div key={c} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[c] || '#6b7280' }} />
                  <span className="text-[10px] text-warm-gray">{CATEGORY_ZH[c] || c}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span className="text-xs">⭐</span>
                <span className="text-[10px] text-warm-gray">手動新增</span>
              </div>
            </div>
          </details>

          {/* Reset */}
          {(selectedDay || selectedCategory) && (
            <button onClick={() => { setSelectedDay(''); setSelectedCategory(''); }}
              className="text-xs text-ocean font-medium hover:underline">🔄 全部顯示（{filteredSpots.length} 景點）</button>
          )}
        </>
      )}

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-card overflow-hidden shadow-card border border-sand/50"
        style={{ height: 'clamp(350px, 55vh, 65vh)' }}
      />

      {/* FAB: Add spot */}
      {!loading && !error && (
        <>
          <button
            onClick={() => setShowForm(!showForm)}
            className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-ocean text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-ocean/90 transition-colors active:scale-95"
            title="新增景點"
          >＋</button>

          {showForm && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={() => setShowForm(false)}>
              <div className="bg-soft-white w-full max-w-lg rounded-t-2xl p-5 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy">新增景點</h3>
                  <button onClick={() => setShowForm(false)} className="text-warm-gray text-lg">✕</button>
                </div>

                <input value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="景點名稱 *" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />

                <div className="flex gap-2">
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className="flex-1 text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand">
                    <option value="">分類</option>
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ZH[c] || c}</option>)}
                  </select>
                  <select value={formDay} onChange={e => setFormDay(e.target.value)}
                    className="flex-1 text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand">
                    <option value="">日期</option>
                    {ALL_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 items-center">
                  <input value={formLat} onChange={e => setFormLat(e.target.value)}
                    placeholder="緯度 lat *" className="flex-1 text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
                  <input value={formLng} onChange={e => setFormLng(e.target.value)}
                    placeholder="經度 lng *" className="flex-1 text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
                  <button onClick={useCurrentLocation}
                    className="text-xs px-3 py-2.5 bg-gold-light/40 text-gold rounded-lg font-medium shrink-0 whitespace-nowrap">
                    📍 目前位置
                  </button>
                </div>
                {formMsg && <p className="text-xs text-ocean">{formMsg}</p>}

                <input value={formAddress} onChange={e => setFormAddress(e.target.value)}
                  placeholder="地址" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
                <input value={formTips} onChange={e => setFormTips(e.target.value)}
                  placeholder="小提醒" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
                <input value={formWarning} onChange={e => setFormWarning(e.target.value)}
                  placeholder="注意事項" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />

                <button onClick={handleAddSpot} disabled={formSubmitting}
                  className="w-full text-sm py-3 bg-ocean text-white rounded-xl font-semibold hover:bg-ocean/90 disabled:opacity-60">
                  {formSubmitting ? '新增中...' : '✅ 新增景點'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}