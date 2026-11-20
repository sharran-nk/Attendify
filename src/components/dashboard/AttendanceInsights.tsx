import { useApp } from '@/contexts/AppContext';
import { calculateMissableClasses, calculateConsecutiveClassesNeeded, getAttendanceTone } from '@/utils/attendance';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const plural = (n: number) => `${n} class${n === 1 ? '' : 'es'}`;

const TONE_TEXT = {
  safe: 'text-success',
  watch: 'text-warning',
  danger: 'text-destructive',
} as const;

const TONE_BAR = {
  safe: 'bg-success',
  watch: 'bg-warning',
  danger: 'bg-destructive',
} as const;

/** Per-subject standing. The tick on each bar marks the attendance target. */
export function AttendanceInsights() {
  const { subjects, settings } = useApp();
  const threshold = settings.attendanceWarningThreshold || 75;

  return (
    <section aria-labelledby="subjects-heading" className="ios-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="subjects-heading" className="text-xl font-bold text-foreground">
          Subjects
        </h2>
        <Link
          to="/subjects"
          className="press -mr-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Manage
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="py-8">
          <p className="text-base font-medium text-foreground">No subjects yet</p>
          <p className="mt-1 max-w-[40ch] text-sm text-muted-foreground">
            Add your subjects and we'll show how many classes you can skip in each.
          </p>
          <Link
            to="/subjects"
            className="press mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Add a subject
          </Link>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {subjects.map(subject => {
            const pct = subject.totalClasses > 0 ? (subject.attendedClasses / subject.totalClasses) * 100 : 100;
            const tone = getAttendanceTone(pct, threshold);
            const missable = calculateMissableClasses(subject.attendedClasses, subject.totalClasses, threshold);
            const needed =
              tone === 'danger'
                ? calculateConsecutiveClassesNeeded(subject.attendedClasses, subject.totalClasses, threshold)
                : 0;

            const message =
              tone === 'danger'
                ? `Attend next ${plural(needed)} to reach ${threshold}%`
                : missable > 0
                  ? `Safe to miss ${plural(missable)}`
                  : 'Cannot miss the next class';

            return (
              <li key={subject.id}>
                <Link
                  to="/subjects"
                  className="press press-hover -mx-3 block rounded-lg px-3 py-3.5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="flex min-w-0 items-center gap-2 text-base font-medium text-foreground">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{subject.name}</span>
                    </p>
                    <span className={cn('tabular font-display text-lg font-bold', TONE_TEXT[tone])}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  <div
                    className="relative mt-2 h-1.5 rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${subject.name} attendance`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(pct)}
                  >
                    <div
                      className={cn('h-full rounded-full', TONE_BAR[tone])}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                    <span
                      className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-foreground/60"
                      style={{ left: `${threshold}%` }}
                      aria-hidden="true"
                    />
                  </div>

                  <p className={cn('mt-2 flex items-center gap-1.5 text-sm', TONE_TEXT[tone])}>
                    {tone === 'danger' || tone === 'watch' ? (
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    {message}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
