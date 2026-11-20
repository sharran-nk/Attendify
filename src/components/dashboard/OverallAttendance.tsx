import { useId } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { calculateOverallMetrics, calculateMissableClasses, calculateConsecutiveClassesNeeded } from '@/utils/attendance';
import { cn } from '@/lib/utils';

const plural = (n: number) => `${n} class${n === 1 ? '' : 'es'}`;

export function OverallAttendance() {
  const { subjects, attendance, settings } = useApp();
  const gradientId = useId();

  const { attended, absent, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const rounded = Math.round(percentage);
  const threshold = settings.attendanceWarningThreshold || 75;
  const hasData = totalClasses > 0;
  const isHealthy = rounded >= threshold;

  const size = 176;
  const stroke = 12;
  const c = size / 2;
  const r = c - stroke / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;

  const stops = isHealthy
    ? { from: 'hsl(var(--success))', to: 'hsl(172 66% 45%)' }
    : { from: 'hsl(var(--destructive))', to: 'hsl(25 95% 55%)' };

  // Where the target sits on the ring (0% = 12 o'clock)
  const targetAngle = (threshold / 100) * 360;

  const missable = calculateMissableClasses(attended, totalClasses, threshold);
  const needed = calculateConsecutiveClassesNeeded(attended, totalClasses, threshold);
  const guidance = !hasData
    ? 'Mark your first class to see where you stand.'
    : isHealthy
      ? missable > 0
        ? `You can miss ${plural(missable)} and stay above ${threshold}%.`
        : `Right on the line. Don’t miss the next class.`
      : `Attend the next ${plural(needed)} to get back to ${threshold}%.`;

  const stats = [
    { label: 'Attended', value: attended, dot: 'bg-success' },
    { label: 'Absent', value: absent, dot: 'bg-destructive' },
    { label: 'Total', value: totalClasses, dot: 'bg-muted-foreground/50' },
  ];

  return (
    <section className="ios-card relative overflow-hidden px-5 pb-5 pt-6" aria-label="Overall attendance">
      {/* Soft status-coloured wash behind the ring */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-1/2 top-0 h-60 w-72 -translate-x-1/2 -translate-y-8 rounded-full blur-3xl',
          !hasData ? 'bg-muted/60' : isHealthy ? 'bg-success/10' : 'bg-destructive/10'
        )}
      />

      <div className="relative flex flex-col items-center">
        <div className="relative">
          <svg
            width={size}
            height={size}
            className="-rotate-90 overflow-visible"
            role="img"
            aria-label={`Overall attendance ${rounded} percent. Target ${threshold} percent.`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={stops.from} />
                <stop offset="100%" stopColor={stops.to} />
              </linearGradient>
            </defs>
            <circle cx={c} cy={c} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
            <motion.circle
              cx={c}
              cy={c}
              r={r}
              stroke={`url(#${gradientId})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
              fill="none"
            />
            {/* Target tick */}
            <line
              x1={c + r - stroke / 2 - 3}
              x2={c + r + stroke / 2 + 3}
              y1={c}
              y2={c}
              stroke="hsl(var(--foreground))"
              strokeOpacity="0.55"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${targetAngle} ${c} ${c})`}
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                'text-5xl font-bold leading-none tracking-tight tabular-nums',
                !hasData ? 'text-muted-foreground' : isHealthy ? 'text-foreground' : 'text-destructive'
              )}
            >
              {rounded}
              <span className="text-2xl font-semibold text-muted-foreground">%</span>
            </span>
            <span className="mt-1.5 text-xs text-muted-foreground">Target {threshold}%</span>
          </div>
        </div>

        {hasData && (
          <span
            className={cn(
              'mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
              isHealthy ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            {isHealthy ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
            {isHealthy ? 'On track' : 'Below target'}
          </span>
        )}

        <p className="mt-3 max-w-[30ch] text-center text-sm text-muted-foreground">{guidance}</p>
      </div>

      <dl className="relative mt-5 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
            <dt className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden="true" />
              {s.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
