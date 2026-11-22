import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { calculateOverallMetrics, calculateMissableClasses, calculateConsecutiveClassesNeeded } from '@/utils/attendance';
import { cn } from '@/lib/utils';

const plural = (n: number) => `${n} class${n === 1 ? '' : 'es'}`;

export function OverallAttendance() {
  const { subjects, attendance, settings } = useApp();

  const { attended, absent, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const rounded = Math.round(percentage);
  const threshold = settings.attendanceWarningThreshold || 75;
  const hasData = totalClasses > 0;
  const isHealthy = rounded >= threshold;

  const missable = calculateMissableClasses(attended, totalClasses, threshold);
  const needed = calculateConsecutiveClassesNeeded(attended, totalClasses, threshold);
  const guidance = !hasData
    ? 'Mark your first class to see where you stand.'
    : isHealthy
      ? missable > 0
        ? `You can miss ${plural(missable)} and stay above ${threshold}%.`
        : 'Right on the line. Don’t miss the next class.'
      : `Attend the next ${plural(needed)} to get back to ${threshold}%.`;

  return (
    <section
      aria-label="Overall attendance"
      className={cn(
        'relative overflow-hidden rounded-3xl p-5 shadow-lg',
        // Light mode: white card like the others. Dark mode: navy gradient (grey until there is data).
        'border border-slate-200 bg-white text-slate-900 shadow-slate-900/5 dark:border-transparent dark:text-white',
        hasData ? 'dark:bg-brand' : 'dark:bg-gradient-to-br dark:from-slate-500 dark:to-slate-600'
      )}
    >
      {/* Decorative arcs */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-900/5 dark:bg-white/5" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-10 h-36 w-36 rounded-full bg-blue-900/[0.03] dark:bg-white/5" />

      <div className="relative flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-white/80">Overall attendance</p>
        {hasData && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/20 dark:text-white dark:backdrop-blur">
            {isHealthy ? 'On track' : 'Below target'}
          </span>
        )}
      </div>

      <p className="relative mt-2 text-7xl font-bold leading-none tracking-tighter tabular-nums">
        {rounded}
        <span className="ml-1 text-3xl font-semibold text-slate-400 dark:text-white/70">%</span>
      </p>

      {/* Progress bar with target marker */}
      <div className="relative mt-6">
        <div
          className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/25"
          role="progressbar"
          aria-label="Overall attendance"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rounded}
        >
          <motion.div
            className={cn('h-full rounded-full', hasData && !isHealthy ? 'bg-red-500' : 'bg-[#1e3a8a] dark:bg-white')}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percentage)}%` }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        <div
          aria-hidden="true"
          className={cn(
            'absolute -top-1 h-5 w-1 -translate-x-1/2 rounded-full ring-2 ring-white dark:ring-1 dark:ring-white/70',
            !hasData ? 'bg-slate-400 dark:bg-white/90' : isHealthy ? 'bg-green-400' : 'bg-red-500'
          )}
          style={{ left: `${threshold}%` }}
        />
        <div
          aria-hidden="true"
          className={cn(
            'absolute top-6 -translate-x-1/2 rounded-full px-2 py-0.5 text-xs font-semibold',
            !hasData ? 'text-slate-500 dark:text-white/80' : isHealthy ? 'bg-green-400 text-green-950' : 'bg-red-500 text-white'
          )}
          style={{ left: `${Math.min(92, Math.max(8, threshold))}%` }}
        >
          Target {threshold}%
        </div>
      </div>

      <p className="relative mt-10 text-sm leading-snug text-slate-600 dark:text-white/90">{guidance}</p>

      <dl className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Attended', value: attended },
          { label: 'Absent', value: absent },
          { label: 'Total', value: totalClasses },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-slate-100 px-3 py-2.5 dark:bg-white/10 dark:backdrop-blur-sm">
            <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
            <dt className="text-xs text-slate-500 dark:text-white/75">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
