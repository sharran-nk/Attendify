import { AlertTriangle, Ban, Check, CircleDashed, Clock, ShieldCheck, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Status = 'present' | 'absent' | 'cancelled' | 'upcoming' | 'unmarked' | 'safe' | 'watch' | 'danger';

const CONFIG: Record<Status, { label: string; icon: LucideIcon; className: string }> = {
  present: { label: 'Present', icon: Check, className: 'bg-success/10 text-success' },
  absent: { label: 'Absent', icon: X, className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', icon: Ban, className: 'bg-muted text-muted-foreground' },
  upcoming: { label: 'Upcoming', icon: Clock, className: 'bg-muted text-muted-foreground' },
  unmarked: { label: 'Not marked', icon: CircleDashed, className: 'bg-warning/10 text-warning' },
  safe: { label: 'On track', icon: ShieldCheck, className: 'bg-success/10 text-success' },
  watch: { label: 'Close to limit', icon: AlertTriangle, className: 'bg-warning/10 text-warning' },
  danger: { label: 'Below target', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
};

/** Status is always icon + text, never colour alone. */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  const { label: defaultLabel, icon: Icon, className: tone } = CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
        tone,
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}
