import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { calculateOverallMetrics } from '@/utils/attendance';

export function OverallAttendance() {
  const { subjects, attendance, settings } = useApp();
  const navigate = useNavigate();

  const { attended, absent, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const roundedPercentage = Math.round(percentage);
  const isHealthy = roundedPercentage >= (settings.attendanceWarningThreshold || 75);

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
              stroke={isHealthy ? '#10b981' : '#f43f5e'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Centered Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              totalClasses === 0 ? 'text-slate-400' : isHealthy ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {roundedPercentage}%
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
