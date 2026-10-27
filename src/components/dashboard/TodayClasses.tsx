import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { DayOfWeek, TimetableSlot } from '@/types/attendance';
import { generateDefaultTimetable } from '@/lib/defaultTimetable';
import { Check, X, Clock, Upload, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Standard 50-minute slot parser & range calculator
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  // Normalize 1-7 PM college timings if not in 24h
  if (hours >= 1 && hours <= 7) {
    hours += 12;
  }
  return hours * 60 + minutes;
}

function formatMinutesTo12h(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${minsStr} ${ampm}`;
}

function getTimeRangeString(startTime: string): { displayRange: string; startMin: number; endMin: number } {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = startMin + 50; // default 50-minute college period
  return {
    displayRange: `${formatMinutesTo12h(startMin)} - ${formatMinutesTo12h(endMin)}`,
    startMin,
    endMin,
  };
}

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

  // Today's academic slots (exclude breaks/lunch)
  const todaySlots = useMemo(() => {
    return effectiveTimetable
      .filter(s => s.day === dayName && !s.isBreak && (s.subjectId || s.subjectName))
      .map(slot => {
        const timeInfo = getTimeRangeString(slot.startTime);
        return {
          ...slot,
          ...timeInfo,
        };
      })
      .sort((a, b) => a.startMin - b.startMin);
  }, [effectiveTimetable, dayName]);

  // Current time in minutes from midnight
  const nowMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();

  // Highlight next upcoming class
  const nextUpcomingSlotId = useMemo(() => {
    const upcoming = todaySlots.find(s => s.endMin > nowMinutes);
    return upcoming ? upcoming.id : null;
  }, [todaySlots, nowMinutes]);

  // Handle setting status
  const handleSetStatus = async (
    slot: TimetableSlot,
    matchedSubjectId: string,
    newStatus: 'present' | 'absent' | 'cancelled' | 'unmarked'
  ) => {
    const slotTimeFormatted = formatMinutesTo12h(parseTimeToMinutes(slot.startTime));
    
    // Find matching entry for this subject on today with matching slot time or time stamp
    const existingEntry = attendance.find(
      a => a.date === todayDateStr &&
           a.subjectId === matchedSubjectId &&
           (a.notes === `slot:${slot.id}` || a.time === slotTimeFormatted)
    ) || attendance.find(
      // Fallback: any entry today for this subject without another slot tag
      a => a.date === todayDateStr && a.subjectId === matchedSubjectId && !a.notes
    );

    try {
      if (newStatus === 'unmarked') {
        if (existingEntry) {
          await deleteAttendance(existingEntry.id);
          toast.success("Attendance unmarked");
        }
        return;
      }

      if (existingEntry) {
        await updateAttendance(existingEntry.id, {
          status: newStatus,
          notes: `slot:${slot.id}`,
        });
        toast.success(`Marked as ${newStatus}`);
      } else {
        await addAttendance({
          subjectId: matchedSubjectId,
          date: todayDateStr,
          status: newStatus,
          time: slotTimeFormatted,
          notes: `slot:${slot.id}`,
        });
        toast.success(`Marked as ${newStatus}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update attendance");
    }
  };

  // If no timetable has been uploaded or configured at all
  const hasNoTimetableConfigured = (!timetable || timetable.length === 0) && !settings.timetableImage;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Today's Classes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {format(todayDate, 'EEEE, MMMM d')}
          </p>
        </div>
        <button
          onClick={() => navigate('/attendance')}
          className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View Attendance
        </button>
      </div>

      {/* Classes list */}
      <div className="space-y-3">
        {todaySlots.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No classes scheduled today.
            </p>
            {hasNoTimetableConfigured ? (
              <div className="mt-4">
                <button
                  onClick={() => {
                    const timetableInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement;
                    if (timetableInput) timetableInput.click();
                    else navigate('/subjects');
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Timetable
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Enjoy your free day or catch up on studies!
              </p>
            )}
          </div>
        ) : (
          todaySlots.map((slot, index) => {
            // Find linked Subject by subjectId or matching name
            const subject = subjects.find(
              s => (slot.subjectId && s.id === slot.subjectId) ||
                   (slot.subjectName && s.name.toLowerCase() === slot.subjectName.toLowerCase()) ||
                   (slot.subjectName && s.name.toLowerCase().includes(slot.subjectName.toLowerCase())) ||
                   (slot.subjectName && slot.subjectName.toLowerCase().includes(s.name.toLowerCase()))
            );

            const subjectDisplayName = subject?.name || slot.subjectName || "Subject";
            const subjectColor = subject?.color || "#4f46e5";
            const slotTimeFormatted = formatMinutesTo12h(slot.startMin);

            // Find attendance record for this slot
            const record = attendance.find(
              a => a.date === todayDateStr &&
                   (
                     (subject && a.subjectId === subject.id && a.notes === `slot:${slot.id}`) ||
                     (subject && a.subjectId === subject.id && a.time === slotTimeFormatted) ||
                     (subject && a.subjectId === subject.id && !a.notes)
                   )
            );

            // Determine Status
            let status: 'present' | 'absent' | 'cancelled' | 'upcoming' | 'not_marked' = 'not_marked';

            if (record) {
              if (record.status === 'present') status = 'present';
              else if (record.status === 'absent') status = 'absent';
              else if (record.status === 'cancelled') status = 'cancelled';
            } else {
              // If not marked, check if class is in the future
              if (slot.startMin > nowMinutes) {
                status = 'upcoming';
              } else {
                status = 'not_marked';
              }
            }

            const isNext = slot.id === nextUpcomingSlotId && status === 'upcoming';

            return (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isNext
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 border-slate-100 dark:border-slate-800'
                }`}
              >
                {/* Colored Vertical Accent on the Left */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full"
                  style={{ backgroundColor: subjectColor }}
                />

                {/* Left side: Subject name & time */}
                <div className="pl-3.5 pr-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {subjectDisplayName}
                    </h3>
                    {isNext && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                        Next
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{slot.displayRange}</span>
                  </div>
                </div>

                {/* Right side: Status Badge + Action Dropdown */}
                <div className="shrink-0 pl-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          status === 'present'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : status === 'absent'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : status === 'upcoming'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : status === 'cancelled'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {status === 'present' && <Check className="w-3.5 h-3.5" />}
                        {status === 'absent' && <X className="w-3.5 h-3.5" />}
                        {status === 'cancelled' && <Ban className="w-3.5 h-3.5" />}
                        <span>
                          {status === 'present'
                            ? 'Present'
                            : status === 'absent'
                            ? 'Absent'
                            : status === 'upcoming'
                            ? 'Upcoming'
                            : status === 'cancelled'
                            ? 'Cancelled'
                            : 'Not Marked'}
                        </span>
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
                        onClick={() => {
                          if (subject) handleSetStatus(slot, subject.id, 'present');
                          else toast.error("Please add this subject in Subjects first to record attendance");
                        }}
                      >
                        <Check className="w-4 h-4" />
                        Mark Present
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium cursor-pointer"
                        onClick={() => {
                          if (subject) handleSetStatus(slot, subject.id, 'absent');
                          else toast.error("Please add this subject in Subjects first to record attendance");
                        }}
                      >
                        <X className="w-4 h-4" />
                        Mark Absent
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium cursor-pointer"
                        onClick={() => {
                          if (subject) handleSetStatus(slot, subject.id, 'cancelled');
                          else toast.error("Please add this subject in Subjects first to record attendance");
                        }}
                      >
                        <Ban className="w-4 h-4" />
                        Mark Cancelled
                      </DropdownMenuItem>

                      {record && (
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-slate-500 font-medium cursor-pointer border-t mt-1"
                          onClick={() => {
                            if (subject) handleSetStatus(slot, subject.id, 'unmarked');
                          }}
                        >
                          Reset to Unmarked
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
