/* RiskBadge component */
interface RiskBadgeProps {
  level: string;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const styles: Record<string, string> = {
    low: 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-900/50 text-amber-400 border-amber-500/30',
    high: 'bg-rose-900/50 text-rose-400 border-rose-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold capitalize ${styles[level]}`}>
      {level}
    </span>
  );
}