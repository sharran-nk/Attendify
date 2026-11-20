import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { calculateMissableClasses, calculateConsecutiveClassesNeeded } from '@/utils/attendance';
import { AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function AttendanceInsights() {
  const { subjects, settings } = useApp();
  const navigate = useNavigate();

  return (
    <div className="ios-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Attendance Insights</h2>
        <button
          onClick={() => navigate('/subjects')}
          className="group flex items-center gap-1 rounded-md px-1 text-sm font-semibold text-primary transition-opacity hover:opacity-70"
        >
          See All
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="space-y-1">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No insights available yet</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Add some subjects to see your attendance health here.
            </p>
          </div>
        ) : (
          subjects.map((subject, idx) => {
            const pct = subject.totalClasses > 0 ? (subject.attendedClasses / subject.totalClasses) * 100 : 100;
            const isLow = pct < settings.attendanceWarningThreshold;
            const missable = calculateMissableClasses(
              subject.attendedClasses,
              subject.totalClasses,
              settings.attendanceWarningThreshold
            );
            const classesNeeded = isLow
              ? calculateConsecutiveClassesNeeded(
                  subject.attendedClasses,
                  subject.totalClasses,
                  settings.attendanceWarningThreshold
                )
              : 0;

            return (
              <motion.button
                type="button"
                key={subject.id}
                onClick={() => navigate('/subjects')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="group -mx-3 block w-[calc(100%+1.5rem)] rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 active:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color }}
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1 truncate font-semibold text-foreground">{subject.name}</p>
                  <span className={cn('text-sm font-bold', isLow ? 'text-destructive' : 'text-success')}>
                    {pct.toFixed(1)}%
                  </span>
                </div>

                {/* Slim progress bar, with a tick at the warning threshold */}
                <div className="relative ml-[1.375rem] mt-2 h-1.5 rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', isLow ? 'bg-destructive' : 'bg-success')}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 h-2.5 w-px bg-foreground/40"
                    style={{ left: `${settings.attendanceWarningThreshold}%` }}
                  />
                </div>

                <div className="ml-[1.375rem] mt-1.5 flex items-center gap-1.5">
                  {isLow ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span className="truncate text-xs font-medium text-destructive">
                        Attend next {classesNeeded} class{classesNeeded > 1 ? 'es' : ''} to reach{' '}
                        {settings.attendanceWarningThreshold}%
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      <span className="truncate text-xs font-medium text-success">
                        {missable > 0
                          ? `Safe to miss ${missable} class${missable > 1 ? 'es' : ''}`
                          : 'Cannot miss next class'}
                      </span>
                    </>
                  )}
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
