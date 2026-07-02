interface SectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}

export default function Section({ id, title, subtitle, icon, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20 px-4 py-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="text-lg font-semibold text-navy tracking-wide">{title}</h2>
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-warm-gray">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}