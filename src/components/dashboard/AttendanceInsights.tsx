import { useApp } from '@/contexts/AppContext';
import { calculateMissableClasses, calculateConsecutiveClassesNeeded } from '@/utils/attendance';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function AttendanceInsights() {
  const { subjects, settings } = useApp();
  const navigate = useNavigate();
  const threshold = settings.attendanceWarningThreshold;

  return (
    <section className="ios-card px-5 py-4" aria-labelledby="subjects-heading">
      <h2 id="subjects-heading" className="text-base font-semibold text-foreground">
        Subjects
      </h2>

      {subjects.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-foreground">No subjects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a subject to see how many classes you can skip.</p>
          <button
            onClick={() => navigate('/subjects')}
            className="mt-4 min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
          >
            Add subject
          </button>
        </div>
      ) : (
        <ul className="mt-1 divide-y divide-border/60">
          {subjects.map(subject => {
            const pct = subject.totalClasses > 0 ? (subject.attendedClasses / subject.totalClasses) * 100 : 100;
            const isLow = pct < threshold;
            const missable = calculateMissableClasses(subject.attendedClasses, subject.totalClasses, threshold);
            const needed = isLow
              ? calculateConsecutiveClassesNeeded(subject.attendedClasses, subject.totalClasses, threshold)
              : 0;

            const hint = isLow
              ? `Attend the next ${needed} to reach ${threshold}%`
              : missable > 0
                ? `Can miss ${missable} more`
                : 'Can’t miss the next class';

            return (
              <li key={subject.id}>
                <button
                  type="button"
                  onClick={() => navigate('/subjects')}
                  className="-mx-2 block w-[calc(100%+1rem)] rounded-xl px-2 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: subject.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{subject.name}</span>
                    <span className={cn('text-sm font-semibold tabular-nums', isLow ? 'text-destructive' : 'text-foreground')}>
                      {Math.round(pct)}%
                    </span>
                  </div>

                  <div
                    className="relative mt-2 h-1 rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${subject.name} attendance`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(pct)}
                  >
                    <div
                      className={cn('h-full rounded-full', isLow ? 'bg-destructive' : 'bg-success')}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
