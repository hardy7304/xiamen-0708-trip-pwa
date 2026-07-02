import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  transportLegs,
  stays,
  itinerary,
  checklists,
  places,
  massagePlan,
  simTasks,
  tripDates,
  getTripStatus,
  getDaysUntilTrip,
  geoAmap,
  geoGoogle,
  type CustomItineraryItem,
} from './data/trip';
import Section from './components/Section';
import TransportCard from './components/TransportCard';
import Timeline from './components/Timeline';
import StayCard from './components/StayCard';
import Checklist from './components/Checklist';
import TaskCard from './components/TaskCard';
import PlaceCard from './components/PlaceCard';
import MassagePlan from './components/MassagePlan';
import BottomNav from './components/BottomNav';
import MapView from './components/MapView';

const SECTION_IDS = ['overview', 'today', 'transport', 'sim', 'checklist', 'map'];

const CUSTOM_KEY = 'custom-itinerary';
const HIDDEN_KEY = 'hidden-itinerary';
const HOTEL_KEY = 'hotel-names';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch { /* ignore */ }
}

// Countdown formatter
function formatCountdown(ms: number): string {
  if (ms <= 0) return '已出發';
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  if (d > 0) return `${d} 天 ${h} 小時 ${m} 分 ${s} 秒`;
  if (h > 0) return `${h} 小時 ${m} 分 ${s} 秒`;
  return `${m} 分 ${s} 秒`;
}

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const appRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());

  // Clock tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const tripStatus = getTripStatus();
  const daysUntil = getDaysUntilTrip();

  // Custom itinerary
  const [customItems, setCustomItems] = useState<CustomItineraryItem[]>(() => loadJSON(CUSTOM_KEY, []));
  const [hiddenDays, setHiddenDays] = useState<string[]>(() => loadJSON(HIDDEN_KEY, []));
  const [hotelNames, setHotelNames] = useState<Record<string, string>>(() => loadJSON(HOTEL_KEY, {}));

  const persistCustom = useCallback((items: CustomItineraryItem[]) => { setCustomItems(items); saveJSON(CUSTOM_KEY, items); }, []);
  const persistHidden = useCallback((h: string[]) => { setHiddenDays(h); saveJSON(HIDDEN_KEY, h); }, []);

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id;
          if (SECTION_IDS.includes(id)) setActiveSection(id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    SECTION_IDS.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // Determine today's plan: during trip, find matching day; before trip, default to Day 1 (7/8); after trip, none
  const todayPlanKey = useMemo(() => {
    if (tripStatus === 'before') return itinerary[0].date;
    if (tripStatus === 'after') return null;
    const dayNum = parseInt(new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Taipei', day: 'numeric' }));
    const month = parseInt(new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Taipei', month: 'numeric' }));
    // Match itinerary date like '7/8 (三)'
    const matching = itinerary.find(d => {
      const parts = d.date.split('/');
      const dDay = parseInt(parts[0]);
      const dMonth = parts.length > 1 ? parseInt(parts[1].split(' ')[0]) : month;
      return dMonth === month && dDay === dayNum;
    });
    return matching ? matching.date : (tripStatus === 'during' ? itinerary[0].date : null);
  }, [tripStatus, now]);

  // Next transport countdown
  const nextTransport = useMemo(() => {
    const upcoming = transportLegs
      .map(leg => ({ leg, ts: new Date(leg.dateTime).getTime() }))
      .filter(({ ts }) => ts > now)
      .sort((a, b) => a.ts - b.ts);
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [now]);

  // Hotel name handler
  const updateHotelName = useCallback((stayIdx: number, name: string) => {
    setHotelNames(prev => {
      const next = { ...prev, [String(stayIdx)]: name };
      saveJSON(HOTEL_KEY, next);
      return next;
    });
  }, []);

  // Custom item CRUD
  const addCustomItem = useCallback((item: CustomItineraryItem) => {
    const newItem = { ...item, mapLinks: item.place ? { amap: geoAmap(item.place), google: geoGoogle(item.place) } : undefined };
    const next = [...customItems, newItem];
    persistCustom(next);
  }, [customItems, persistCustom]);

  const removeCustomItem = useCallback((id: string) => {
    persistCustom(customItems.filter(i => i.id !== id));
  }, [customItems, persistCustom]);

  const toggleHideDay = useCallback((date: string) => {
    if (hiddenDays.includes(date)) {
      persistHidden(hiddenDays.filter(d => d !== date));
    } else {
      persistHidden([...hiddenDays, date]);
    }
  }, [hiddenDays, persistHidden]);

  // Export/Import
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const exportData = useMemo(() => JSON.stringify({ customItems, hiddenDays, hotelNames }, null, 2), [customItems, hiddenDays, hotelNames]);

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.customItems) { setCustomItems(data.customItems); saveJSON(CUSTOM_KEY, data.customItems); }
      if (data.hiddenDays) { setHiddenDays(data.hiddenDays); saveJSON(HIDDEN_KEY, data.hiddenDays); }
      if (data.hotelNames) { setHotelNames(data.hotelNames); saveJSON(HOTEL_KEY, data.hotelNames); }
      setShowImport(false);
      setImportText('');
    } catch { alert('JSON 格式錯誤'); }
  };

  return (
    <div ref={appRef} className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-sand/30">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-navy tracking-wide">廈門 0708 小三通</h1>
              <p className="text-xs text-warm-gray mt-0.5">
                {tripDates.start} → {tripDates.end} · {tripDates.duration}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-warm-gray">
                {new Date(now).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', month: 'long', day: 'numeric', weekday: 'short' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Overview Section */}
      <Section id="overview" title="行程總覽" icon="🏠" subtitle={`${tripDates.duration} · 金門 + 廈門小三通`}>
        {/* Status banner */}
        {tripStatus === 'before' && (
          <div className="bg-ocean text-white rounded-card p-5 shadow-card">
            <p className="text-sm font-semibold mb-1">距離出發還有 {daysUntil} 天</p>
            <p className="text-2xl font-bold tabular-nums">{formatCountdown(new Date(tripDates.start + 'T00:00:00+08:00').getTime() - now)}</p>
            <p className="text-xs opacity-70 mt-2">出發日：{tripDates.start} · 出發前請確認清單</p>
          </div>
        )}
        {tripStatus === 'after' && (
          <div className="bg-gold text-navy rounded-card p-5 shadow-card">
            <p className="text-sm font-semibold">旅程已完成 🎉</p>
            <p className="text-xs opacity-70 mt-1">感謝這趟美好的廈門小三通之旅！</p>
          </div>
        )}

        {/* Quick Toolbar */}
        <div className="space-y-2">
          {/* 常用導航 */}
          <p className="text-xs text-warm-gray font-medium">🧭 碼頭導航</p>
          <div className="grid grid-cols-2 gap-2">
            <a href={geoAmap('厦门五通客运码头')} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-ocean text-white rounded-xl py-2.5 px-3 text-xs font-medium hover:bg-ocean/90 transition-colors">
              🗺️ 五通碼頭（廈門）
            </a>
            <a href={geoGoogle('金門水頭碼頭')} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-gold text-navy rounded-xl py-2.5 px-3 text-xs font-medium hover:bg-gold-light transition-colors">
              📍 水頭碼頭（金門）
            </a>
          </div>

          {/* 已訂住宿導航 - only entries the user filled in */}
          {(() => {
            const filledStays = stays.map((stay, i) => {
              const name = hotelNames[String(i)] || '';
              if (!name) return null;
              const isXiamen = stay.location === 'xiamen';
              return {
                date: stay.checkIn.slice(5), // '07-09'
                name,
                url: isXiamen ? geoAmap(name) : geoGoogle(name),
                isXiamen,
              };
            }).filter(Boolean) as { date: string; name: string; url: string; isXiamen: boolean }[];
            if (filledStays.length === 0) return null;
            return (
              <div>
                <p className="text-xs text-warm-gray font-medium mt-1">🏨 住宿導航</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {filledStays.slice(0, 6).map((s, idx) => (
                    <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-medium transition-colors truncate ${s.isXiamen ? 'bg-ocean/10 text-ocean hover:bg-ocean/20' : 'bg-gold-light/30 text-gold hover:bg-gold-light/50'}`}>
                      {s.isXiamen ? '🗺️' : '📍'} {s.date.slice(3)} {s.name.length > 10 ? s.name.slice(0, 8) + '…' : s.name}
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 民宿導航（家之形） - always show */}
          <a href={geoGoogle('金門縣金城鎮和平新村80號')} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-navy text-cream rounded-xl py-2.5 px-3 text-xs font-medium hover:bg-navy/80 transition-colors text-center">
            🏠 家之形民宿（金門）
          </a>

          {/* 我的清單 */}
          <button onClick={() => handleNavigate('checklist')}
            className="w-full flex items-center justify-center gap-1.5 bg-soft-white border border-sand rounded-xl py-2.5 px-3 text-xs font-medium text-navy hover:bg-cream transition-colors">
            📋 我的清單
          </button>

          {/* 下一個交通 */}
          {nextTransport && (
            <div className="bg-ocean/5 border border-ocean/20 rounded-xl p-3 text-center">
              <p className="text-xs text-ocean font-medium">⏰ 下一個交通</p>
              <p className="text-sm font-semibold text-navy">
                {nextTransport.leg.departure} → {nextTransport.leg.arrival} · {nextTransport.leg.date} {nextTransport.leg.departureTime}
              </p>
              <p className="text-xs text-ocean mt-0.5 tabular-nums">倒數 {formatCountdown(nextTransport.ts - now)}</p>
            </div>
          )}
        </div>

        <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs px-3 py-1 rounded-full bg-ocean/10 text-ocean">✈️ 飛機</span>
            <span className="text-xs px-3 py-1 rounded-full bg-gold-light/30 text-gold">🚢 小三通</span>
            <span className="text-xs px-3 py-1 rounded-full bg-ocean/10 text-ocean">🏨 民宿</span>
            <span className="text-xs px-3 py-1 rounded-full bg-gold-light/30 text-gold">📱 辦卡</span>
            <span className="text-xs px-3 py-1 rounded-full bg-ocean/10 text-ocean">💆 按摩</span>
          </div>
          <div className="space-y-2">
            {itinerary.map((day) => (
              <div key={day.date} className="flex items-center gap-3 py-2 border-b border-sand/30 last:border-0">
                <span className="text-xs font-semibold text-gold w-16 shrink-0">{day.date}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{day.title}</p>
                  <p className="text-xs text-warm-gray">{day.subtitle}</p>
                </div>
                {hiddenDays.includes(day.date) && <span className="text-[10px] px-1.5 py-0.5 bg-warm-gray/10 text-warm-gray rounded-full">已隱藏</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-ocean text-white rounded-card p-4 text-center">
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs opacity-80">段交通</p>
          </div>
          <div className="bg-gold text-navy rounded-card p-4 text-center">
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs opacity-80">天行程</p>
          </div>
        </div>
      </Section>

      {/* Today / Itinerary Section */}
      <Section id="today" title="每日行程" icon="📍" subtitle={tripStatus === 'during' ? '點擊日期展開 · 今天自動高亮' : '點擊日期展開'}>
        <div className="space-y-3">
          {itinerary.map((day) => {
            const isToday = tripStatus === 'during' && day.date === todayPlanKey;
            const isHidden = hiddenDays.includes(day.date);
            if (isHidden && !isToday) return null;
            const customForDay = customItems.filter(ci => ci.date === day.date);
            return (
              <details key={day.date} className="bg-soft-white rounded-card shadow-card border border-sand/50 group" open={isToday || (tripStatus === 'before' && day.date === itinerary[0].date)}>
                <summary className="p-4 cursor-pointer list-none flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gold bg-gold-light/20 px-2 py-0.5 rounded-full">{day.date}</span>
                      {isToday && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ocean/10 text-ocean font-medium">今天</span>
                      )}
                      {tripStatus === 'before' && day.date === itinerary[0].date && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ocean/10 text-ocean font-medium">Day 1</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-navy mt-1">{day.title}</p>
                    <p className="text-xs text-warm-gray mt-0.5">{day.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleHideDay(day.date); }}
                      className="text-[10px] px-2 py-1 rounded-full bg-warm-gray/10 text-warm-gray hover:bg-warm-gray/20"
                      title={isHidden ? '取消隱藏' : '隱藏'}>
                      {isHidden ? '👁️' : '🙈'}
                    </button>
                    <svg className="w-4 h-4 text-warm-gray group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>
                <div className="px-4 pb-4 space-y-4">
                  {day.sections.map((sec, si) => (
                    <div key={si}>
                      {sec.heading && (
                        <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">{sec.heading}</h4>
                      )}
                      {sec.timeline && <Timeline items={sec.timeline} />}
                      {sec.items && (
                        <ul className="space-y-1.5">
                          {sec.items.map((item, ii) => (
                            <li key={ii} className="text-sm text-warm-gray flex items-start gap-2">
                              <span className="text-gold shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {sec.alert && (
                        <div className="bg-coral/10 border border-coral/30 rounded-xl p-3 mt-2">
                          <p className="text-xs text-coral font-medium">⚠️ {sec.alert}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Custom items for this day */}
                  {customForDay.length > 0 && (
                    <div className="border-t border-sand/30 pt-3 mt-3">
                      <p className="text-xs text-gold font-medium mb-2">✨ 自訂行程</p>
                      <Timeline items={customForDay.map(ci => ({
                        time: ci.time,
                        label: ci.title,
                        detail: ci.note,
                        mapLinks: ci.mapLinks,
                      }))} />
                      <div className="space-y-1 mt-2">
                        {customForDay.map(ci => (
                          <div key={ci.id} className="flex items-center justify-between text-xs">
                            <span className="text-warm-gray">{ci.time} {ci.title}</span>
                            <button onClick={() => removeCustomItem(ci.id)}
                              className="text-coral hover:underline px-1">刪除</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Add custom button */}
                  <AddCustomForm date={day.date} onAdd={addCustomItem} />
                </div>
              </details>
            );
          })}
          {hiddenDays.length > 0 && (
            <button onClick={() => persistHidden([])}
              className="w-full text-xs text-warm-gray py-2 hover:text-ocean transition-colors">
              顯示全部已隱藏行程 ({hiddenDays.length} 天)
            </button>
          )}
        </div>

        {/* Export/Import */}
        <details className="bg-soft-white rounded-card shadow-card border border-sand/50 group">
          <summary className="p-3 cursor-pointer list-none flex items-center justify-between text-xs font-medium text-warm-gray">
            <span>📦 匯出 / 匯入自訂資料</span>
            <svg className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-3 pb-3 space-y-2">
            <p className="text-xs text-warm-gray">匯出（複製以下 JSON 貼到安全地方備份）：</p>
            <textarea readOnly value={exportData} className="w-full h-24 text-xs font-mono bg-cream rounded-lg p-2 border border-sand resize-none" onClick={e => (e.target as HTMLTextAreaElement).select()} />
            <button onClick={() => { navigator.clipboard.writeText(exportData); }}
              className="text-xs px-3 py-1.5 bg-ocean text-white rounded-lg">📋 複製到剪貼簿</button>
            <div className="border-t border-sand/30 pt-2">
              <button onClick={() => setShowImport(!showImport)}
                className="text-xs text-ocean font-medium underline">{showImport ? '取消匯入' : '📥 匯入資料'}</button>
              {showImport && (
                <div className="mt-2 space-y-2">
                  <textarea value={importText} onChange={e => setImportText(e.target.value)}
                    placeholder="貼上 JSON 資料..." className="w-full h-24 text-xs font-mono bg-cream rounded-lg p-2 border border-sand resize-none" />
                  <button onClick={handleImport} className="text-xs px-3 py-1.5 bg-gold text-navy rounded-lg font-medium">確認匯入</button>
                </div>
              )}
            </div>
          </div>
        </details>
      </Section>

      {/* Transport Section */}
      <Section id="transport" title="交通" icon="✈️" subtitle="飛機與船班">
        <div className="space-y-4">
          {transportLegs.map((leg, i) => (
            <TransportCard key={i} leg={leg} now={now} />
          ))}
        </div>
      </Section>

      {/* Stay Section */}
      <Section id="stay" title="住宿" icon="🏨">
        <div className="space-y-4">
          {stays.map((stay, i) => (
            <StayCard key={i} stay={stay} hotelName={hotelNames[String(i)] || ''} onHotelNameChange={(n) => updateHotelName(i, n)} />
          ))}
        </div>
      </Section>

      {/* SIM & Payment Section */}
      <Section id="sim" title="辦卡與網路" icon="📱" subtitle="手機卡、網路、支付策略">
        <div className="space-y-4">
          {simTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </Section>

      {/* Places Section */}
      <Section id="places" title="景點推薦" icon="🏛️">
        <div className="space-y-3">
          {places.map((place) => (
            <PlaceCard key={place.name} place={place} />
          ))}
        </div>
      </Section>

      {/* Massage Section */}
      <Section id="massage" title="手佳按摩" icon="💆">
        <MassagePlan plan={massagePlan} />
      </Section>

      {/* Checklist Section */}
      <Section id="checklist" title="清單" icon="✅" subtitle="勾選完成項目，自動儲存">
        <div className="space-y-4">
          {checklists.map((cat) => (
            <Checklist key={cat.id} category={cat} />
          ))}
        </div>
      </Section>

      {/* Notes Section */}
      <Section id="notes" title="備註" icon="📝">
        <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50 space-y-3 text-sm text-warm-gray">
          <p>• 台灣門號僅收簡訊，上網用 eSIM</p>
          <p>• 出發前確認所有截圖儲存到手機相簿</p>
          <p>• 7/9 辦卡是優先任務</p>
          <p>• 7/14 回程務必 15:30 前抵達五通碼頭</p>
          <p>• 按摩需提前預約</p>
          <p>• 天氣炎熱，注意防曬補水</p>
        </div>
        {/* Emergency info */}
        <div className="bg-coral/5 border border-coral/20 rounded-card p-4 mt-4">
          <h3 className="text-sm font-semibold text-coral mb-2">🆘 緊急資訊</h3>
          <p className="text-xs text-warm-gray mb-1">• 台胞證隨身攜帶，不可離身</p>
          <p className="text-xs text-warm-gray mb-1">• 旅外國人急難救助電話（24h）：<a href="tel:+886800085095" className="text-ocean font-medium underline">+886-800-085-095</a></p>
          <p className="text-xs text-warm-gray">• 中國報警 110 / 急救 120 / 火警 119</p>
        </div>
      </Section>

      {/* Map Section */}
      <Section id="map" title="景點地圖" icon="🗺️" subtitle="來自 Google Sheets 的互動地圖">
        <MapView />
      </Section>

      <div className="h-4" />
      <BottomNav activeSection={activeSection} onNavigate={handleNavigate} />
    </div>
  );
}

// ----- Add Custom Form Component -----
function AddCustomForm({ date, onAdd }: { date: string; onAdd: (item: CustomItineraryItem) => void }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [place, setPlace] = useState('');

  const handleSubmit = () => {
    if (!time || !title) return;
    onAdd({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      time,
      title,
      note: note || undefined,
      place: place || undefined,
    });
    setTime(''); setTitle(''); setNote(''); setPlace(''); setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full text-xs text-ocean font-medium py-2 border border-dashed border-ocean/30 rounded-lg hover:bg-ocean/5 transition-colors">
        ＋ 新增行程項目
      </button>
    );
  }

  return (
    <div className="bg-cream rounded-lg p-3 border border-sand/50 space-y-2">
      <div className="flex gap-2">
        <input value={time} onChange={e => setTime(e.target.value)} placeholder="時間 例：14:00" className="flex-1 text-xs bg-soft-white rounded-lg px-3 py-2 border border-sand" />
        <input value={place} onChange={e => setPlace(e.target.value)} placeholder="地點（自動產生地圖連結）" className="flex-[2] text-xs bg-soft-white rounded-lg px-3 py-2 border border-sand" />
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="行程標題 *" className="w-full text-xs bg-soft-white rounded-lg px-3 py-2 border border-sand" />
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="備註（選填）" className="w-full text-xs bg-soft-white rounded-lg px-3 py-2 border border-sand" />
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="text-xs px-3 py-1.5 bg-ocean text-white rounded-lg font-medium">新增</button>
        <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 bg-warm-gray/10 text-warm-gray rounded-lg">取消</button>
      </div>
    </div>
  );
}