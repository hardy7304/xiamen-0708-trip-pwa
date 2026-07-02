import { useState, useEffect, useCallback } from 'react';
import type { ChecklistCategory } from '../data/trip';

interface ChecklistProps {
  category: ChecklistCategory;
}

export default function Checklist({ category }: ChecklistProps) {
  const storageKey = `checklist-${category.id}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setChecked(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [storageKey],
  );

  const total = category.items.length;
  const done = category.items.filter((item) => checked[item.id]).length;

  return (
    <div className="bg-soft-white rounded-card shadow-card p-4 border border-sand/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">{category.title}</h3>
        <span className="text-xs text-warm-gray">
          {done}/{total}
        </span>
      </div>
      <div className="w-full h-1.5 bg-sand rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-ocean rounded-full transition-all duration-300"
          style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
        />
      </div>
      <div className="space-y-2.5">
        {category.items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="w-full flex items-start gap-3 text-left group"
          >
            <div
              className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                checked[item.id]
                  ? 'bg-ocean border-ocean'
                  : 'border-sand group-hover:border-gold'
              }`}
            >
              {checked[item.id] && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm leading-relaxed ${
                  checked[item.id] ? 'text-warm-gray/50 line-through' : 'text-navy'
                }`}
              >
                {item.label}
              </p>
              {item.detail && (
                <p className="text-xs text-warm-gray/60 mt-0.5">{item.detail}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}