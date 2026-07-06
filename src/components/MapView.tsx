import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { builtInSpots, ALL_MAP_DAYS, CAT_ZH, CAT_COLORS, geoGoogle, type MapSpot } from '../data/mapSpots';
import { buildAmapWebUrl } from '../utils/mapLinks';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1wM-brW_yG22bcphlBbvHyad98Br7YNVdPgkiXsLkV-c/export?format=csv';
const MANUAL_KEY = 'xiamen-map-spots-v1';

function loadManual(): MapSpot[] {
  try { const r = localStorage.getItem(MANUAL_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveManual(spots: MapSpot[]) {
  try { localStorage.setItem(MANUAL_KEY, JSON.stringify(spots)); } catch { /* ignore */ }
}

const CAT_OPTIONS: string[] = ['transport', 'hotel', 'attraction', 'food', 'shopping', 'massage', 'other'];

// Convert sheet spot to MapSpot format
function sheetToMap(spot: any): MapSpot {
  const days: string[] = [];
  const dl = (spot.day_label || '');
  if (/金門住宿|金門抵達/.test(dl)) days.push('7/8');
  if (/小三通|抵達廈門/.test(dl)) days.push('7/9');
  if (/輕鬆逛街|銀行辦事/.test(dl)) days.push('7/10');
  if (/廈門經典/.test(dl)) days.push('7/11');
  if (/海邊放鬆/.test(dl)) days.push('7/12');
  if (/採購按摩/.test(dl)) days.push('7/13');
  if (/回程|回金門/.test(dl)) days.push('7/14');
  if (/回家|台南|返程/.test(dl)) days.push('7/15');
  return {
    id: spot.id || `sheet-${Math.random().toString(36).slice(2, 8)}`,
    name: spot.name || '',
    category: spot.category || 'attraction',
    lat: spot.lat,
    lng: spot.lng,
    address: spot.address || '',
    amapUrl: spot.amap_keyword ? buildAmapWebUrl({ name: spot.amap_keyword }) : undefined,
    googleMapsUrl: spot.google_keyword ? geoGoogle(spot.google_keyword) : undefined,
    note: spot.tips || '',
    days,
    source: 'sheet',
  };
}

function parseCSVLocal(csv: string): any[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('name');
  const latIdx = headers.indexOf('lat');
  const lngIdx = headers.indexOf('lng');
  if (nameIdx === -1 || latIdx === -1 || lngIdx === -1) return [];
  const getIdx = (h: string) => headers.indexOf(h);
  return lines.slice(1).map((line: string) => {
    const cols = parseCSVLineLocal(line);
    return {
      id: `csv-${Math.random().toString(36).slice(2, 8)}`,
      name: (cols[nameIdx] || '').trim(),
      lat: parseFloat(cols[latIdx] || '0'),
      lng: parseFloat(cols[lngIdx] || '0'),
      category: (cols[getIdx('category')] || '').trim(),
      day_label: (cols[getIdx('day_label')] || '').trim(),
      hours: (cols[getIdx('hours')] || '').trim(),
      price: (cols[getIdx('price')] || '').trim(),
      tips: (cols[getIdx('tips')] || '').trim(),
      warning: (cols[getIdx('warning')] || '').trim(),
      address: (cols[getIdx('address')] || '').trim(),
    };
  }).filter((r: any) => r.name && !isNaN(r.lat) && !isNaN(r.lng));
}
function parseCSVLineLocal(line: string): string[] {
  const result: string[] = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
  }
  result.push(current);
  return result;
}

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  const [sheetSpots, setSheetSpots] = useState<MapSpot[]>([]);
  const [manualSpots, setManualSpots] = useState<MapSpot[]>(() => loadManual());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<MapSpot | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('attraction');
  const [formDays, setFormDays] = useState<string[]>([]);
  const [formAddress, setFormAddress] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  // Merge all spots
  const allSpots = useMemo(() => {
    const merged = [...builtInSpots, ...sheetSpots, ...manualSpots];
    const seen = new Set<string>();
    return merged.filter(s => {
      const key = `${s.name}-${s.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sheetSpots, manualSpots]);

  const filteredSpots = useMemo(() => {
    return allSpots.filter(s => {
      if (selectedDay && !s.days.includes(selectedDay)) return false;
      if (selectedCategory && s.category !== selectedCategory) return false;
      return true;
    });
  }, [allSpots, selectedDay, selectedCategory]);

  // Load sheets
  const loadSheetSpots = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const resp = await fetch('/api/spots');
      if (resp.ok) {
        const data = await resp.json();
        if (data.spots?.length) {
          setSheetSpots(data.spots.map(sheetToMap));
          setLoading(false);
          return;
        }
      }
      const csvResp = await fetch(CSV_URL);
      if (!csvResp.ok) throw new Error(`HTTP ${csvResp.status}`);
      const parsed = parseCSVLocal(await csvResp.text());
      setSheetSpots(parsed.map(sheetToMap));
    } catch (e) { setError('無法載入 Sheet 景點（仍可使用內建點位）'); }
    setLoading(false);
  }, []);
  useEffect(() => { loadSheetSpots(); }, [loadSheetSpots]);

  const handleSync = async () => {
    setSyncing(true); setSyncMsg('同步中...');
    try {
      const resp = await fetch('/api/sync-sheets', { method: 'POST' });
      const data = await resp.json();
      setSyncMsg(data.success ? `已同步 ${data.count} 筆` : '同步失敗：' + (data.error || '未知錯誤'));
      if (data.success) loadSheetSpots();
    } catch (e: any) { setSyncMsg('同步失敗：' + e.message); }
    setSyncing(false); setTimeout(() => setSyncMsg(''), 5000);
  };

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [24.4789, 118.0894], zoom: 12, zoomControl: true, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Markers
  useEffect(() => {
    const map = mapRef.current; if (!map || loading) return;
    markersRef.current.forEach(m => map.removeLayer(m)); markersRef.current = [];
    if (filteredSpots.length === 0) return;
    const bounds = L.latLngBounds([] as L.LatLng[]);

    filteredSpots.forEach(spot => {
      const color = CAT_COLORS[spot.category] || '#6b7280';
      const isManual = spot.source === 'manual';
      const lat = spot.lat || 24.5;
      const lng = spot.lng || 118.1;
      const marker = L.circleMarker([lat, lng], {
        radius: isManual ? 10 : 9, fillColor: isManual ? '#fbbf24' : color,
        color: isManual ? '#d97706' : '#ffffff', weight: isManual ? 3 : 2, opacity: 1, fillOpacity: 0.85,
      });
      if (isManual) {
        L.marker([lat, lng], { icon: L.divIcon({ className: '', html: '<div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);font-size:16px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));pointer-events:none;">⭐</div>', iconSize: [0, 0], iconAnchor: [0, 0] }), interactive: false }).addTo(map);
      }

      const cn = CAT_ZH[spot.category] || spot.category;
      const amapLink = spot.amapUrl || buildAmapWebUrl({ name: spot.name });
      const gmapLink = spot.googleMapsUrl || (spot.address ? geoGoogle(spot.address) : geoGoogle(spot.name));

      let popup = `<div style="font-family:'Noto Sans TC',sans-serif;max-width:240px;font-size:12px;">`;
      popup += `<b style="font-size:14px;">${escHtml(spot.name)}</b> <span style="font-size:10px;color:${color};">${escHtml(cn)}</span>`;
      if (spot.days.length > 0) popup += `<br><span style="font-size:10px;color:#666;">📅 ${spot.days.join(', ')}</span>`;
      if (spot.address) popup += `<br><span style="font-size:10px;color:#666;">📍 ${escHtml(spot.address)}</span>`;
      if (spot.note) popup += `<br><span style="font-size:10px;color:#2c6e91;">💡 ${escHtml(spot.note)}</span>`;
      popup += `<br><div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">`;
      popup += `<a href="${amapLink}" target="_blank" rel="noopener" style="display:inline-block;padding:4px 10px;background:#2c6e91;color:#fff;border-radius:999px;font-size:10px;text-decoration:none;">🗺️ 高德</a>`;
      popup += `<a href="${gmapLink}" target="_blank" rel="noopener" style="display:inline-block;padding:4px 10px;background:#c9a96e;color:#fff;border-radius:999px;font-size:10px;text-decoration:none;">📍 Google</a>`;
      popup += `</div></div>`;

      marker.bindPopup(popup, { maxWidth: 280 });
      marker.addTo(map); markersRef.current.push(marker); bounds.extend([lat, lng]);
    });

    if (filteredSpots.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
    map.invalidateSize();
  }, [filteredSpots, loading]);

  useEffect(() => { const h = () => mapRef.current?.invalidateSize(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  // --- Spot form ---
  const openAddForm = () => {
    setEditingSpot(null); setFormName(''); setFormCategory('attraction'); setFormDays([]);
    setFormAddress(''); setFormNote(''); setFormLat(''); setFormLng(''); setFormMsg('');
    setShowForm(true);
  };
  const openEditForm = (spot: MapSpot) => {
    setEditingSpot(spot); setFormName(spot.name); setFormCategory(spot.category); setFormDays([...spot.days]);
    setFormAddress(spot.address || ''); setFormNote(spot.note || ''); setFormLat(spot.lat ? String(spot.lat) : '');
    setFormLng(spot.lng ? String(spot.lng) : ''); setFormMsg('');
    setShowForm(true);
  };
  const toggleDay = (d: string) => {
    setFormDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };
  const handleFormSubmit = () => {
    if (!formName || formDays.length === 0) { setFormMsg('請填寫名稱與日期'); return; }
    setFormSubmitting(true);
    const spot: MapSpot = {
      id: editingSpot?.id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: formName,
      category: formCategory,
      days: formDays,
      address: formAddress || undefined,
      note: formNote || undefined,
      lat: formLat ? parseFloat(formLat) : undefined,
      lng: formLng ? parseFloat(formLng) : undefined,
      amapUrl: formAddress ? buildAmapWebUrl({ name: formAddress }) : undefined,
      googleMapsUrl: formAddress ? geoGoogle(formAddress) : undefined,
      source: 'manual',
      createdAt: editingSpot?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = editingSpot
      ? manualSpots.map(s => s.id === spot.id ? spot : s)
      : [...manualSpots, spot];
    setManualSpots(next);
    saveManual(next);
    setShowForm(false);
    setFormSubmitting(false);
  };
  const deleteSpot = (id: string) => {
    const next = manualSpots.filter(s => s.id !== id);
    setManualSpots(next);
    saveManual(next);
  };

  const daySummary = useMemo(() => {
    if (!selectedDay) return '';
    return `${selectedDay}・${filteredSpots.length} 個點位`;
  }, [selectedDay, filteredSpots]);

  return (
    <div className="relative space-y-3">
      {loading && <div className="bg-soft-white rounded-card shadow-card p-6 text-center"><p className="text-sm text-warm-gray">🗺️ 正在載入景點資料...</p></div>}
      {error && <div className="bg-coral/10 border border-coral/30 rounded-card p-4"><p className="text-sm text-coral">{error}</p></div>}

      <div className="bg-ocean/5 border border-ocean/20 rounded-lg p-2.5 text-[11px] text-ocean leading-relaxed">
        💡 廈門 / 中國大陸建議使用<b>高德地圖</b>導航；Google My Maps 僅作行程總覽。金門則建議使用 Google Maps。
      </div>

      {!loading && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleSync} disabled={syncing} className="text-xs px-3 py-1.5 bg-ocean text-white rounded-lg font-medium hover:bg-ocean/90 disabled:opacity-60">{syncing ? '⏳ 同步中...' : '🔄 同步 Sheets'}</button>
            <button onClick={openAddForm} className="text-xs px-3 py-1.5 bg-gold text-navy rounded-lg font-medium hover:bg-gold-light">＋ 新增地點</button>
            <span className="text-xs text-warm-gray self-center ml-auto">{allSpots.length} 個點位</span>
          </div>
          {syncMsg && <div className="bg-ocean/5 border border-ocean/20 rounded-lg p-2 text-xs text-ocean">{syncMsg}</div>}

          {/* Day filter */}
          <div className="flex gap-1.5 items-center overflow-x-auto pb-1 -mx-1 px-1">
            <span className="text-[10px] text-warm-gray shrink-0">日期：</span>
            <button onClick={() => setSelectedDay('')} className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${!selectedDay ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>全部</button>
            {ALL_MAP_DAYS.map(d => <button key={d} onClick={() => setSelectedDay(d === selectedDay ? '' : d)} className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${selectedDay === d ? 'bg-ocean text-white shadow-sm' : 'bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20'}`}>{d}</button>)}
          </div>
          {selectedDay && <div className="text-xs text-ocean font-medium">📍 {daySummary}</div>}

          {/* Category filter */}
          <div className="flex gap-1.5 items-center overflow-x-auto pb-1 -mx-1 px-1">
            <span className="text-[10px] text-warm-gray shrink-0">分類：</span>
            <button onClick={() => setSelectedCategory('')} className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>全部</button>
            {CAT_OPTIONS.map(c => <button key={c} onClick={() => setSelectedCategory(c === selectedCategory ? '' : c)} className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors`} style={selectedCategory === c ? { backgroundColor: CAT_COLORS[c] || '#6b7280', color: '#fff' } : { backgroundColor: (CAT_COLORS[c] || '#6b7280') + '18', color: CAT_COLORS[c] || '#6b7280' }}>{CAT_ZH[c]?.slice(2)}</button>)}
          </div>

          {/* Category legend */}
          <details className="bg-soft-white rounded-lg border border-sand/30">
            <summary className="p-2 text-[10px] text-warm-gray cursor-pointer list-none">🎨 圖例</summary>
            <div className="px-3 pb-2 grid grid-cols-3 gap-1">
              {CAT_OPTIONS.map(c => <div key={c} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[c] || '#6b7280' }} /><span className="text-[10px] text-warm-gray">{CAT_ZH[c]}</span></div>)}
              <div className="flex items-center gap-1.5"><span className="text-xs">⭐</span><span className="text-[10px] text-warm-gray">手動新增</span></div>
            </div>
          </details>

          {/* === PANORAMIC MAP OVERVIEW === */}
          {(() => {
            const names = filteredSpots.slice(0, 5).map(s => s.name);
            const lastName = names.pop();
            const preview = names.length > 0 ? `${names.join('、')}、${lastName}` : (lastName || '尚無地點');

            // Build Google Maps URL
            let gmapsUrl = '';
            if (filteredSpots.length === 1) {
              const s = filteredSpots[0];
              gmapsUrl = s.googleMapsUrl || geoGoogle(s.address || s.name);
            } else if (filteredSpots.length > 1) {
              const first = filteredSpots[0];
              const last = filteredSpots[filteredSpots.length - 1];
              const middle = filteredSpots.slice(1, -1);
              const origin = encodeURIComponent(first.address || first.name);
              const dest = encodeURIComponent(last.address || last.name);
              if (middle.length > 0) {
                const wp = encodeURIComponent(middle.map(s => s.address || s.name).join('|'));
                gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${wp}`;
              } else {
                gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
              }
            }

            const amapUrl = filteredSpots.length > 0
              ? buildAmapWebUrl({ name: filteredSpots[0].name })
              : buildAmapWebUrl({ name: '廈門五通碼頭' });

            const copyList = () => {
              const text = filteredSpots.map(s => s.name).join('\n');
              navigator.clipboard.writeText(text).catch(() => {});
            };

            return (
              <div className="bg-ocean/5 border border-ocean/20 rounded-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <h3 className="text-sm font-semibold text-navy">全景地圖</h3>
                    <p className="text-xs text-warm-gray">目前 {filteredSpots.length} 個地點</p>
                  </div>
                </div>
                {filteredSpots.length > 0 && (
                  <p className="text-[11px] text-warm-gray leading-relaxed">{preview}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {gmapsUrl && (
                    <a href={gmapsUrl} target="_blank" rel="noopener"
                      className="text-xs px-3 py-2 bg-gold text-navy rounded-lg font-medium hover:bg-gold-light transition-colors min-h-[40px] flex items-center gap-1">
                      📍 在 Google Maps 查看
                    </a>
                  )}
                  <a href={amapUrl} target="_blank" rel="noopener"
                    className="text-xs px-3 py-2 bg-ocean text-white rounded-lg font-medium hover:bg-ocean/90 transition-colors min-h-[40px] flex items-center gap-1">
                    🗺️ 在高德地圖查看
                  </a>
                  <button onClick={copyList}
                    className="text-xs px-3 py-2 bg-soft-white border border-sand rounded-lg font-medium text-navy min-h-[40px]">
                    📋 複製地點清單
                  </button>
                </div>
                {filteredSpots.length > 8 && (
                  <p className="text-[10px] text-warm-gray/60">點位較多，建議分段開啟地圖。</p>
                )}
              </div>
            );
          })()}

          {/* === LEAFLET MAP === */}
          <div ref={mapContainerRef} className="w-full rounded-card overflow-hidden shadow-card border border-sand/50" style={{ height: 'clamp(350px, 55vh, 65vh)' }} />

          {/* === SPOT LIST === */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-navy px-1">📍 地點清單</h3>
            {filteredSpots.map(spot => (
              <div key={spot.id} className="bg-soft-white rounded-card shadow-card p-3 border border-sand/50 flex items-start gap-2">
                <span className="text-lg shrink-0 mt-0.5">{CAT_ZH[spot.category]?.split(' ')[0] || '📍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-navy truncate">{spot.name}</p>
                    <span className="text-[10px] text-warm-gray/60 shrink-0">{spot.days.join(', ')}</span>
                  </div>
                  {spot.address && <p className="text-xs text-warm-gray mt-0.5">{spot.address}</p>}
                  {spot.note && <p className="text-xs text-ocean mt-0.5">{spot.note}</p>}
                  <div className="flex gap-1 mt-1.5">
                    <a href={spot.amapUrl || buildAmapWebUrl({ name: spot.name })} target="_blank" rel="noopener"
                      className="text-[10px] px-2 py-1 rounded-full bg-ocean/10 text-ocean hover:bg-ocean/20">🗺️ 高德</a>
                    <a href={spot.googleMapsUrl || (spot.address ? geoGoogle(spot.address) : geoGoogle(spot.name))} target="_blank" rel="noopener"
                      className="text-[10px] px-2 py-1 rounded-full bg-gold-light/40 text-gold hover:bg-gold-light/60">📍 Google</a>
                  </div>
                </div>
                {spot.source === 'manual' && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openEditForm(spot)} className="text-[10px] px-2 py-1 rounded-full bg-ocean/10 text-ocean hover:bg-ocean/20 min-h-[28px]">✏️</button>
                    <button onClick={() => deleteSpot(spot.id)} className="text-[10px] px-2 py-1 rounded-full bg-warm-gray/10 text-warm-gray hover:bg-coral/10 hover:text-coral min-h-[28px]">🗑️</button>
                  </div>
                )}
              </div>
            ))}
            {filteredSpots.length === 0 && (
              <div className="bg-soft-white rounded-card shadow-card p-6 border border-sand/50 text-center">
                <p className="text-sm text-warm-gray">這天目前沒有地圖點位</p>
                <button onClick={openAddForm} className="text-xs text-ocean font-medium mt-2 underline">＋ 新增地點</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-soft-white w-full max-w-lg rounded-t-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">{editingSpot ? '編輯地點' : '新增地點'}</h3>
              <button onClick={() => setShowForm(false)} className="text-warm-gray text-lg">✕</button>
            </div>
            <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="地點名稱 *" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]" />
            <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]">
              {CAT_OPTIONS.map(c => <option key={c} value={c}>{CAT_ZH[c]}</option>)}
            </select>
            <div>
              <label className="text-xs text-warm-gray block mb-1">日期（可多選）*</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_MAP_DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className={`text-[11px] px-3 py-1.5 rounded-full font-medium min-h-[36px] ${formDays.includes(d) ? 'bg-ocean text-white' : 'bg-warm-gray/10 text-warm-gray'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input value={formLat} onChange={e => setFormLat(e.target.value)} placeholder="緯度（選填）" className="flex-1 text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
              <input value={formLng} onChange={e => setFormLng(e.target.value)} placeholder="經度（選填）" className="flex-1 text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand" />
            </div>
            <input value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="地址/關鍵字（自動產生地圖連結）" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]" />
            <input value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="備註（選填）" className="w-full text-sm bg-cream rounded-lg px-3 py-2.5 border border-sand min-h-[44px]" />
            {formMsg && <p className="text-xs text-coral">{formMsg}</p>}
            <button onClick={handleFormSubmit} disabled={formSubmitting}
              className="w-full text-sm py-3 bg-ocean text-white rounded-xl font-semibold hover:bg-ocean/90 disabled:opacity-60 min-h-[44px]">
              {formSubmitting ? '處理中...' : editingSpot ? '✅ 更新地點' : '✅ 新增地點'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function escHtml(s: string): string { return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"'); }