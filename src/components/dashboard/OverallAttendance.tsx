import { useId } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { calculateOverallMetrics } from '@/utils/attendance';
import { cn } from '@/lib/utils';

export function OverallAttendance() {
  const { subjects, attendance, settings } = useApp();
  const gradientId = useId();

  const { attended, absent, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const roundedPercentage = Math.round(percentage);
  const threshold = settings.attendanceWarningThreshold || 75;
  const hasData = totalClasses > 0;
  const isHealthy = roundedPercentage >= threshold;

  const size = 152;
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const stops = isHealthy
    ? { from: 'hsl(var(--success))', to: 'hsl(172 66% 45%)' }
    : { from: 'hsl(var(--destructive))', to: 'hsl(25 95% 55%)' };

  const stats = [
    { label: 'Attended', value: attended },
    { label: 'Absent', value: absent },
    { label: 'Total', value: totalClasses },
  ];

  return (
    <section className="ios-card px-5 py-6" aria-label="Overall attendance">
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            role="img"
            aria-label={`Overall attendance ${roundedPercentage} percent`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={stops.from} />
                <stop offset="100%" stopColor={stops.to} />
              </linearGradient>
            </defs>
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                'text-4xl font-bold tracking-tight',
                !hasData ? 'text-muted-foreground' : isHealthy ? 'text-foreground' : 'text-destructive'
              )}
            >
              {roundedPercentage}%
            </span>
            <span className="text-xs text-muted-foreground">attendance</span>
          </div>
        </div>

        {hasData && (
          <p className={cn('mt-4 text-sm font-medium', isHealthy ? 'text-success' : 'text-destructive')}>
            {isHealthy ? `On track, above ${threshold}%` : `Below your ${threshold}% target`}
          </p>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-border/70 text-center">
        {stats.map(stat => (
          <div key={stat.label}>
            <dd className="text-xl font-semibold">{stat.value}</dd>
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
