import { useState, useEffect, useCallback } from 'react';
import type { ChecklistCategory, ChecklistItem } from '../data/trip';

interface ChecklistProps {
  category: ChecklistCategory;
}

function loadCustom(catId: string): ChecklistItem[] {
  try {
    const raw = localStorage.getItem(`custom-checklist-${catId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCustom(catId: string, items: ChecklistItem[]) {
  try { localStorage.setItem(`custom-checklist-${catId}`, JSON.stringify(items)); } catch { /* ignore */ }
}

export default function Checklist({ category }: ChecklistProps) {
  const storageKey = `checklist-${category.id}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<ChecklistItem[]>(() => loadCustom(category.id));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newDetail, setNewDetail] = useState('');

  const allItems: ChecklistItem[] = [...category.items, ...customItems];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setChecked(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [storageKey]);

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  // Add custom item
  const addCustom = () => {
    if (!newLabel.trim()) return;
    const item: ChecklistItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: newLabel.trim(),
      detail: newDetail.trim() || undefined,
    };
    const next = [...customItems, item];
    setCustomItems(next);
    saveCustom(category.id, next);
    setNewLabel('');
    setNewDetail('');
  };

  // Remove custom item
  const removeCustom = (id: string) => {
    const next = customItems.filter(i => i.id !== id);
    setCustomItems(next);
    saveCustom(category.id, next);
  };

  // Drag & drop
  const dragStart = (idx: number) => setDragIdx(idx);
  const dragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const drop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return; }
    // Reorder customItems (only custom items can be reordered)
    const draggedId = allItems[dragIdx]?.id;
    if (!customItems.find(c => c.id === draggedId)) { setDragIdx(null); return; }
    const customStartIdx = customItems.findIndex(c => c.id === draggedId);
    if (customStartIdx === -1) { setDragIdx(null); return; }
    // Map targetIdx to customItems index
    const builtInCount = category.items.length;
    const customTargetIdx = targetIdx - builtInCount;
    if (customTargetIdx < 0 || customTargetIdx >= customItems.length) { setDragIdx(null); return; }
    const next = [...customItems];
    const [moved] = next.splice(customStartIdx, 1);
    next.splice(customTargetIdx, 0, moved);
    setCustomItems(next);
    saveCustom(category.id, next);
    setDragIdx(null);
  };

  const total = allItems.length;
  const done = allItems.filter(item => checked[item.id]).length;

  return (
    <div className="bg-soft-white rounded-card shadow-card p-4 border border-sand/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">{category.title}</h3>
        <span className="text-xs text-warm-gray">{done}/{total}</span>
      </div>
      <div className="w-full h-1.5 bg-sand rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-ocean rounded-full transition-all duration-300"
          style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
        />
      </div>
      <div className="space-y-2.5">
        {allItems.map((item, idx) => {
          const isCustom = customItems.some(c => c.id === item.id);
          return (
            <div
              key={item.id}
              draggable={isCustom}
              onDragStart={() => isCustom && dragStart(idx)}
              onDragOver={dragOver}
              onDrop={() => drop(idx)}
              className={`flex items-start gap-3 group ${isCustom ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {/* Item number */}
              <span className="text-[10px] text-warm-gray/40 font-mono w-4 shrink-0 text-right mt-0.5 pt-[3px]">{idx + 1}.</span>
              {/* Checkbox */}
              <button
                onClick={() => toggle(item.id)}
                className="shrink-0"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  checked[item.id] ? 'bg-ocean border-ocean' : 'border-sand group-hover:border-gold'
                }`}>
                  {checked[item.id] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm leading-relaxed ${checked[item.id] ? 'text-warm-gray/50 line-through' : 'text-navy'}`}>
                    {item.label}
                  </p>
                  {isCustom && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ocean/10 text-ocean shrink-0">自訂</span>
                  )}
                </div>
                {item.detail && (
                  <p className="text-xs text-warm-gray/60 mt-0.5">{item.detail}</p>
                )}
              </div>
              {/* Delete custom */}
              {isCustom && (
                <button onClick={() => removeCustom(item.id)}
                  className="text-[10px] text-coral/60 hover:text-coral shrink-0 mt-0.5"
                  title="刪除">✕</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom item */}
      <div className="border-t border-sand/30 pt-3 mt-3 space-y-2">
        <div className="flex gap-2">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="新增項目" className="flex-1 text-xs bg-cream rounded-lg px-3 py-2 border border-sand" />
          <input value={newDetail} onChange={e => setNewDetail(e.target.value)}
            placeholder="備註（選填）" className="flex-1 text-xs bg-cream rounded-lg px-3 py-2 border border-sand" />
        </div>
        <button onClick={addCustom}
          className="w-full text-xs text-ocean font-medium py-2 border border-dashed border-ocean/30 rounded-lg hover:bg-ocean/5 transition-colors">
          ＋ 新增自訂項目
        </button>
      </div>
    </div>
  );
}