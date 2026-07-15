import { useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export function useAttendanceReminder() {
  const { subjects, settings } = useApp();
  const checkedToday = useRef<string | null>(null);

  useEffect(() => {
    const lastNotified = localStorage.getItem('attendify_last_notified');
    if (lastNotified) {
      checkedToday.current = lastNotified;
    }

    const interval = setInterval(() => {
      if (!settings.reminderEnabled || !settings.reminderTime) return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toDateString();

      if (currentTime === settings.reminderTime && checkedToday.current !== todayDateStr) {
        checkedToday.current = todayDateStr;
        localStorage.setItem('attendify_last_notified', todayDateStr);

        let notifiedCount = 0;
        const threshold = settings.attendanceWarningThreshold / 100;

        subjects.forEach(subject => {
          if (subject.totalClasses === 0) return;

          const attendancePercentage = subject.attendedClasses / subject.totalClasses;

          if (attendancePercentage < threshold) {
            notifiedCount++;
            
            // X = ceil((Threshold * Total - Attended) / (1 - Threshold))
            const targetClasses = Math.ceil(
              (threshold * subject.totalClasses - subject.attendedClasses) / (1 - threshold)
            );
            
            const percentageStr = Math.round(attendancePercentage * 100);
            const message = `${subject.name} attendance is ${percentageStr}%. Attend ${targetClasses} more classes to reach ${settings.attendanceWarningThreshold}%.`;

            // In-app Sonner toast
            toast.warning('⚠️ Attendance Alert', {
              description: message,
              duration: 10000,
            });

            // Browser Push Notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⚠️ Attendance Alert', {
                body: message,
              });
            }
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [settings.reminderEnabled, settings.reminderTime, settings.attendanceWarningThreshold, subjects]);
}
