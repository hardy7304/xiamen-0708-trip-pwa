import { useState, useEffect, useCallback, useRef } from 'react';
import {
  transportLegs,
  stays,
  itinerary,
  checklists,
  places,
  massagePlan,
  simTasks,
  tripDates,
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

const SECTION_IDS = ['overview', 'today', 'transport', 'sim', 'checklist'];

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const appRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id;
          if (SECTION_IDS.includes(id)) {
            setActiveSection(id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Find "today" - the current day based on the trip dates
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayPlan = itinerary.find((day) => {
    const dayNum = parseInt(day.date.split('/')[0]);
    const month = 7;
    const dateStr = `2026-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return dateStr >= todayStr;
  }) || itinerary[0];

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
                {today.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Overview Section */}
      <Section id="overview" title="行程總覽" icon="🏠" subtitle={`${tripDates.duration} · 金門 + 廈門小三通`}>
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
                <div>
                  <p className="text-sm font-medium text-navy">{day.title}</p>
                  <p className="text-xs text-warm-gray">{day.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
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
      <Section id="today" title="每日行程" icon="📍" subtitle="點擊日期展開">
        <div className="space-y-4">
          {itinerary.map((day) => (
            <details key={day.date} className="bg-soft-white rounded-card shadow-card border border-sand/50 group" open={day === todayPlan}>
              <summary className="p-4 cursor-pointer list-none flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gold bg-gold-light/20 px-2 py-0.5 rounded-full">
                      {day.date}
                    </span>
                    {day === todayPlan && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ocean/10 text-ocean font-medium">
                        今天
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-navy mt-1">{day.title}</p>
                  <p className="text-xs text-warm-gray mt-0.5">{day.subtitle}</p>
                </div>
                <svg className="w-4 h-4 text-warm-gray group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 space-y-4">
                {day.sections.map((sec, si) => (
                  <div key={si}>
                    {sec.heading && (
                      <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">
                        {sec.heading}
                      </h4>
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
              </div>
            </details>
          ))}
        </div>
      </Section>

      {/* Transport Section */}
      <Section id="transport" title="交通" icon="✈️" subtitle="飛機與船班">
        <div className="space-y-4">
          {transportLegs.map((leg, i) => (
            <TransportCard key={i} leg={leg} />
          ))}
        </div>
      </Section>

      {/* Stay Section */}
      <Section id="stay" title="住宿" icon="🏨">
        <div className="space-y-4">
          {stays.map((stay, i) => (
            <StayCard key={i} stay={stay} />
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
      </Section>

      {/* Footer spacer */}
      <div className="h-4" />

      {/* Bottom Navigation */}
      <BottomNav activeSection={activeSection} onNavigate={handleNavigate} />
    </div>
  );
}