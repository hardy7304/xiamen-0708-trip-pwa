import type { SimTask } from '../data/trip';

interface TaskCardProps {
  task: SimTask;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="bg-soft-white rounded-card shadow-card p-5 border border-sand/50">
      <h3 className="text-sm font-semibold text-navy mb-2">{task.title}</h3>
      <p className="text-sm text-warm-gray mb-3">{task.description}</p>
      {task.script && (
        <div className="bg-cream rounded-xl p-3 mb-3 border border-gold-light/50">
          <p className="text-xs text-gold font-medium mb-1">💬 門市詢問話術</p>
          <p className="text-xs text-warm-gray leading-relaxed">{task.script}</p>
        </div>
      )}
      {task.steps && task.steps.length > 0 && (
        <div className="mb-3">
          {task.steps.map((step, i) => (
            <p key={i} className="text-xs text-warm-gray flex items-start gap-2 mb-1">
              <span className="text-ocean shrink-0">{i + 1}.</span>
              {step}
            </p>
          ))}
        </div>
      )}
      {task.tips && task.tips.length > 0 && (
        <div className="border-t border-sand/50 pt-3 mt-2">
          {task.tips.map((tip, i) => (
            <p key={i} className="text-xs text-warm-gray flex items-start gap-1.5 mb-1 last:mb-0">
              <span className="text-gold shrink-0">•</span>
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}