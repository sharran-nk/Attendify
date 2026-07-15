import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, X, Plus, Minus } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApp } from '@/contexts/AppContext';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';

export default function AttendanceCalendar() {
  const { subjects, attendance, addAttendance, deleteAttendance } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayAttendance = attendance.filter(a => a.date === dateStr);

  const getSubjectAttendance = (subjectId: string) => {
    const entries = dayAttendance.filter(a => a.subjectId === subjectId);
    const presentCount = entries.filter(a => a.status === 'present').length;
    const absentCount = entries.filter(a => a.status === 'absent').length;
    return { entries, presentCount, absentCount, total: presentCount + absentCount };
  };

  const handleAddAttendance = (subjectId: string, status: 'present' | 'absent') => {
    addAttendance({
      subjectId,
      date: dateStr,
      status,
    });
  };

  const handleRemoveAttendance = (subjectId: string, status: 'present' | 'absent') => {
    const entries = dayAttendance.filter(a => a.subjectId === subjectId && a.status === status);
    if (entries.length > 0) {
      deleteAttendance(entries[entries.length - 1].id);
    }
  };

  return (
    <PageContainer
      title="Attendance"
      subtitle={format(selectedDate, 'MMMM yyyy')}
    >
      <div className="space-y-6">
        {/* Week Navigation */}
        <div className="ios-card p-3.5">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDate(subDays(selectedDate, 7))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <span className="font-semibold">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayEntries = attendance.filter(a => a.date === dayStr);
              const hasAttendance = dayEntries.length > 0;

              return (
                <motion.button
                  key={day.toISOString()}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center py-1.5 rounded-[10px] transition-colors ${isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                      ? 'bg-primary/10'
                      : 'hover:bg-muted'
                    }`}
                >
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className="text-[13px] font-medium mt-0.5">
                    {format(day, 'd')}
                  </span>
                  {hasAttendance && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'
                      }`} />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Day View */}
        <div className="space-y-4">
          <h2 className="font-semibold text-sm px-0">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>

          <AnimatePresence mode="popLayout">
            {subjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ios-card p-6 text-center"
              >
                <p className="text-muted-foreground">
                  Add subjects first to mark attendance
                </p>
              </motion.div>
            ) : (
              subjects.map((subject, index) => {
                const { entries, presentCount, absentCount, total } = getSubjectAttendance(subject.id);

                return (
                  <motion.div
                    key={subject.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="ios-card overflow-hidden"
                  >
                    {/* Subject Row */}
                    <div className="p-3.5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <p className="font-medium text-base">{subject.name}</p>
                              <span className="text-xs text-muted-foreground">
                                {subject.totalClasses > 0
                                  ? ((subject.attendedClasses / subject.totalClasses) * 100).toFixed(1)
                                  : 0}%
                              </span>
                            </div>
                            <div className="flex gap-3 text-sm text-muted-foreground">
                              <span className="font-medium text-success">{presentCount} Present</span>
                              <span className="text-border">•</span>
                              <span className="font-medium text-destructive">{absentCount} Absent</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {/* Present Controls */}
                        <div className="flex-1 flex items-center gap-1 bg-secondary/10 rounded-full p-1 border border-secondary/20">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddAttendance(subject.id, 'present')}
                            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-full bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <Check className="w-4 h-4" />
                          </motion.button>

                          <motion.button
                            initial={false}
                            animate={{ 
                              width: presentCount > 0 ? 36 : 0, 
                              opacity: presentCount > 0 ? 1 : 0,
                              marginLeft: presentCount > 0 ? 4 : 0
                            }}
                            onClick={() => handleRemoveAttendance(subject.id, 'present')}
                            className="h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/40 hover:text-destructive overflow-hidden transition-colors bg-secondary/20"
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                        </div>

                        {/* Absent Controls */}
                        <div className="flex-1 flex items-center gap-1 bg-secondary/10 rounded-full p-1 border border-secondary/20">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddAttendance(subject.id, 'absent')}
                            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-full bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <X className="w-4 h-4" />
                          </motion.button>

                          <motion.button
                            initial={false}
                            animate={{ 
                              width: absentCount > 0 ? 36 : 0, 
                              opacity: absentCount > 0 ? 1 : 0,
                              marginLeft: absentCount > 0 ? 4 : 0
                            }}
                            onClick={() => handleRemoveAttendance(subject.id, 'absent')}
                            className="h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/40 hover:text-destructive overflow-hidden transition-colors bg-secondary/20"
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer >
  );
}

