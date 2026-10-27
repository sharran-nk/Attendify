import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export function OverallAttendance() {
  const { subjects, attendance } = useApp();
  const navigate = useNavigate();

  // If there are attendance logs, we can count precisely by status (excluding cancelled)
  // Also cross-reference subject summary values in case user added subjects with initial total/attended counts
  let attended = 0;
  let absent = 0;

  if (attendance && attendance.length > 0) {
    attendance.forEach(entry => {
      if (entry.status === 'present') {
        attended++;
      } else if (entry.status === 'absent') {
        absent++;
      }
      // 'cancelled' is excluded as required
    });
  } else if (subjects && subjects.length > 0) {
    // Fallback to subjects' aggregate counters if detailed logs aren't populated yet
    subjects.forEach(s => {
      const att = Number(s.attendedClasses) || 0;
      const tot = Number(s.totalClasses) || 0;
      attended += att;
      absent += Math.max(0, tot - att);
    });
  }

  const totalClasses = attended + absent;
  const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

  // SVG circular gauge calculations
  const size = 120;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="ios-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Overall Attendance
        </h2>
        <button
          onClick={() => navigate('/subjects')}
          className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View All
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2 px-1">
        {/* Circular Progress Indicator */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90 overflow-visible"
          >
            <defs>
              <linearGradient id="attendanceGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-slate-100 dark:text-slate-800/80"
            />

            {/* Animated progress ring */}
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#attendanceGreenGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Centered Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Stats Table / List to the right */}
        <div className="flex-1 w-full space-y-3 sm:pl-4">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Classes
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {totalClasses}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              Attended
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
              {attended}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              Absent
            </span>
            <span className="text-sm sm:text-base font-bold text-rose-500 dark:text-rose-400">
              {absent}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
