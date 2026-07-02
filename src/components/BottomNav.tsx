import { navSections } from '../data/trip';

interface BottomNavProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

export default function BottomNav({ activeSection, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-soft-white/95 backdrop-blur-lg border-t border-sand/50 shadow-nav z-50 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navSections.map((section) => (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-0 ${
              activeSection === section.id
                ? 'text-ocean scale-105'
                : 'text-warm-gray/60 hover:text-warm-gray'
            }`}
          >
            <span className="text-lg leading-none">{section.icon}</span>
            <span className={`text-[10px] font-medium leading-none ${
              activeSection === section.id ? 'text-ocean' : ''
            }`}>
              {section.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}