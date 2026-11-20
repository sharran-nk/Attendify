import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { DayOfWeek, TimetableSlot, Subject } from '@/types/attendance';
import { generateDefaultTimetable } from '@/lib/defaultTimetable';
import { Check, X, Clock, Upload, Ban, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatMinutesTo12h, getTimeRangeString, parseTimeToMinutes, findMatchingSubject } from '@/utils/timetable';

export function TodayClasses() {
  const { subjects, attendance, timetable, addAttendance, updateAttendance, deleteAttendance, settings } = useApp();
  const navigate = useNavigate();

  const todayDate = new Date();
  const todayDateStr = format(todayDate, 'yyyy-MM-dd');
  const dayName = format(todayDate, 'EEEE') as DayOfWeek;

  // Timetable slots source: user's custom timetable if populated, otherwise default timetable
  const effectiveTimetable = useMemo(() => {
    if (timetable && timetable.length > 0) {
      return timetable;
    }
    return generateDefaultTimetable();
  }, [timetable]);

  // All non-break timetable slots scheduled for today (regardless of subject matching)
  const allTodaySlots = useMemo(() => {
    return effectiveTimetable
      .filter(s => s.day === dayName && !s.isBreak && (s.subjectId || s.subjectName))
      .map(slot => ({ ...slot, ...getTimeRangeString(slot.startTime) }))
      .sort((a, b) => a.startMin - b.startMin);
  }, [effectiveTimetable, dayName]);

  // Only display slots whose subject exists in the user's subject list
  const todaySlots = useMemo(() => {
    return allTodaySlots
      .map(slot => {
        const matchedSubject = findMatchingSubject(slot, subjects);
        if (!matchedSubject) return null;
        return { ...slot, matchedSubject };
      })
      .filter((slot): slot is (typeof allTodaySlots[0] & { matchedSubject: Subject }) => slot !== null);
  }, [allTodaySlots, subjects]);

  // Current time in minutes from midnight
  const nowMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();

  // Highlight next upcoming class
  const nextUpcomingSlotId = useMemo(() => {
    const upcoming = todaySlots.find(s => s.endMin > nowMinutes);
    return upcoming ? upcoming.id : null;
  }, [todaySlots, nowMinutes]);

  const handleSetStatus = async (
    slot: TimetableSlot,
    matchedSubjectId: string,
    newStatus: 'present' | 'absent' | 'cancelled' | 'unmarked'
  ) => {
    const slotTimeFormatted = formatMinutesTo12h(parseTimeToMinutes(slot.startTime));

    // Find matching entry for this subject today with matching slot time or tag
    const existingEntry =
      attendance.find(
        a =>
          a.date === todayDateStr &&
          a.subjectId === matchedSubjectId &&
          (a.notes === `slot:${slot.id}` || a.time === slotTimeFormatted)
      ) ||
      attendance.find(
        // Fallback: any entry today for this subject without another slot tag
        a => a.date === todayDateStr && a.subjectId === matchedSubjectId && !a.notes
      );

    try {
      if (newStatus === 'unmarked') {
        if (existingEntry) {
          await deleteAttendance(existingEntry.id);
          toast.success('Attendance reset');
        }
        return;
      }

      if (existingEntry) {
        await updateAttendance(existingEntry.id, {
          status: newStatus,
          notes: `slot:${slot.id}`,
        });
      } else {
        await addAttendance({
          subjectId: matchedSubjectId,
          date: todayDateStr,
          status: newStatus,
          time: slotTimeFormatted,
          notes: `slot:${slot.id}`,
        });
      }
      toast.success(`Marked ${newStatus}`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't update attendance. Try again.");
    }
  };

  // If no timetable has been uploaded or configured at all
  const hasNoTimetableConfigured = (!timetable || timetable.length === 0) && !settings.timetableImage;

  return (
    <section aria-labelledby="today-heading" className="ios-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="today-heading" className="text-xl font-bold text-foreground">
            Today's classes
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{format(todayDate, 'EEEE, MMMM d')}</p>
        </div>
        <button
          onClick={() => navigate('/attendance')}
          className="press -mr-2 min-h-11 rounded-md px-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Open attendance
        </button>
      </div>

      {todaySlots.length === 0 ? (
        <div className="py-8">
          {allTodaySlots.length > 0 ? (
            <>
              <p className="text-base font-medium text-foreground">None of today's classes match your subjects</p>
              <p className="mt-1 max-w-[44ch] text-sm text-muted-foreground">
                The timetable has classes today, but those subjects aren't in your list yet.
              </p>
              <button
                onClick={() => navigate('/subjects')}
                className="press mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Add subjects
              </button>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-foreground">No classes scheduled today</p>
              {hasNoTimetableConfigured ? (
                <>
                  <p className="mt-1 max-w-[44ch] text-sm text-muted-foreground">
                    Upload a photo of your timetable to keep it handy.
                  </p>
                  <button
                    onClick={() => {
                      const timetableInput = document.querySelector(
                        'input[type="file"][accept*="image"]'
                      ) as HTMLInputElement;
                      if (timetableInput) timetableInput.click();
                      else navigate('/subjects');
                    }}
                    className="press mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Upload timetable
                  </button>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Enjoy the free day.</p>
              )}
            </>
          )}
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {todaySlots.map(slot => {
            const subject = slot.matchedSubject;
            const slotTimeFormatted = formatMinutesTo12h(slot.startMin);

            const record = attendance.find(
              a =>
                a.date === todayDateStr &&
                a.subjectId === subject.id &&
                (a.notes === `slot:${slot.id}` || a.time === slotTimeFormatted || !a.notes)
            );

            let status: Status = 'unmarked';
            if (record) {
              status = record.status;
            } else if (slot.startMin > nowMinutes) {
              status = 'upcoming';
            }

            const isNext = slot.id === nextUpcomingSlotId && status === 'upcoming';
            const badge = <StatusBadge status={status} />;

            return (
              <li key={slot.id} className="flex items-center gap-3 py-3.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subject.color || 'hsl(var(--primary))' }}
                  aria-hidden="true"
                />

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-base font-medium text-foreground">
                    <span className="truncate">{subject.name}</span>
                    {isNext && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        Next
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="tabular">{slot.displayRange}</span>
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`${subject.name}, ${slot.displayRange}. Status: ${status}. Change status`}
                      className="press flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg pl-0.5 pr-1"
                    >
                      {badge}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      className="min-h-10 cursor-pointer gap-2 font-medium text-success focus:text-success"
                      onClick={() => handleSetStatus(slot, subject.id, 'present')}
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Mark present
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="min-h-10 cursor-pointer gap-2 font-medium text-destructive focus:text-destructive"
                      onClick={() => handleSetStatus(slot, subject.id, 'absent')}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Mark absent
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="min-h-10 cursor-pointer gap-2 font-medium"
                      onClick={() => handleSetStatus(slot, subject.id, 'cancelled')}
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                      Mark cancelled
                    </DropdownMenuItem>
                    {record && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="min-h-10 cursor-pointer font-medium text-muted-foreground"
                          onClick={() => handleSetStatus(slot, subject.id, 'unmarked')}
                        >
                          Reset
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
