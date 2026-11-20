import { useApp } from '@/contexts/AppContext';
import { calculateOverallMetrics, calculateMissableClasses, calculateConsecutiveClassesNeeded, getAttendanceTone } from '@/utils/attendance';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TallyStrip } from '@/components/ui/TallyStrip';
import { cn } from '@/lib/utils';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 'es'}`;

/** The page's one bold moment: a huge percentage and the register's tally marks. */
export function OverallAttendance() {
  const { subjects, attendance, settings } = useApp();
  const threshold = settings.attendanceWarningThreshold || 75;

  const { attended, absent, cancelled, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const hasData = totalClasses > 0;
  const tone = getAttendanceTone(percentage, threshold);

  let guidance = 'Mark your first class to start the tally.';
  if (hasData) {
    if (tone === 'danger') {
      const needed = calculateConsecutiveClassesNeeded(attended, totalClasses, threshold);
      guidance = `Attend the next ${plural(needed, 'class')} in a row to get back to ${threshold}%.`;
    } else {
      const missable = calculateMissableClasses(attended, totalClasses, threshold);
      guidance =
        missable > 0
          ? `You can miss ${plural(missable, 'more class')} and stay above ${threshold}%.`
          : `You're right on the line. Don't miss the next class.`;
    }
  }

  return (
    <section
      aria-labelledby="overall-heading"
      className="ios-card margin-rule py-5 pl-10 pr-5 sm:py-6 sm:pl-12 sm:pr-7"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="overall-heading" className="text-base font-semibold text-muted-foreground">
          Overall attendance
        </h2>
        {hasData && <StatusBadge status={tone} />}
      </div>

      <p
        className={cn(
          'tabular mt-1 font-display text-hero font-extrabold',
          !hasData ? 'text-muted-foreground' : tone === 'danger' ? 'text-destructive' : 'text-foreground'
        )}
      >
        {hasData ? Math.round(percentage) : '--'}
        <span className="ml-1 text-[2rem] font-bold text-muted-foreground">%</span>
      </p>

      <p className="mt-3 max-w-[40ch] text-base text-foreground">{guidance}</p>

      {hasData && (
        <>
          <TallyStrip attended={attended} absent={absent} className="mt-5" />
          <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div>
              <dt className="text-sm text-muted-foreground">Attended</dt>
              <dd className="tabular font-display text-xl font-bold text-foreground">{attended}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Absent</dt>
              <dd className="tabular font-display text-xl font-bold text-foreground">{absent}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Cancelled</dt>
              <dd className="tabular font-display text-xl font-bold text-foreground">{cancelled}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
