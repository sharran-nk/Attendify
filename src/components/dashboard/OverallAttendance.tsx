import { useId } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { calculateOverallMetrics } from '@/utils/attendance';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OverallAttendance() {
  const { subjects, attendance, settings } = useApp();
  const navigate = useNavigate();
  const gradientId = useId();

  const { attended, absent, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const roundedPercentage = Math.round(percentage);
  const threshold = settings.attendanceWarningThreshold || 75;
  const hasData = totalClasses > 0;
  const isHealthy = roundedPercentage >= threshold;

  // SVG circular gauge
  const size = 144;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const stops = isHealthy
    ? { from: 'hsl(var(--success))', to: 'hsl(172 66% 45%)' }
    : { from: 'hsl(var(--destructive))', to: 'hsl(25 95% 55%)' };

  const stats = [
    { label: 'Total', value: totalClasses, tint: 'bg-primary/10 text-primary' },
    { label: 'Attended', value: attended, tint: 'bg-success/10 text-success' },
    { label: 'Absent', value: absent, tint: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className="ios-card relative overflow-hidden p-5">
      {/* Soft tint behind the ring */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl',
          !hasData ? 'bg-muted' : isHealthy ? 'bg-success/15' : 'bg-destructive/15'
        )}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground sm:text-lg">Overall Attendance</h2>
          <button
            onClick={() => navigate('/subjects')}
            className="rounded-md px-1 text-sm font-semibold text-primary transition-opacity hover:opacity-70"
          >
            View All
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <svg
              width={size}
              height={size}
              className="-rotate-90 overflow-visible drop-shadow-sm"
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
                  'text-4xl font-extrabold tracking-tight',
                  !hasData ? 'text-muted-foreground' : isHealthy ? 'text-foreground' : 'text-destructive'
                )}
              >
                {roundedPercentage}%
              </span>
              <span className="text-xs font-medium text-muted-foreground">attendance</span>
            </div>
          </div>

          {hasData && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                isHealthy ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}
            >
              {isHealthy ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {isHealthy ? `On track, above ${threshold}%` : `Below ${threshold}% target`}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map(stat => (
            <div key={stat.label} className={cn('rounded-xl px-3 py-2.5 text-center', stat.tint)}>
              <div className="text-xl font-bold leading-tight">{stat.value}</div>
              <div className="mt-0.5 text-xs font-medium opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
