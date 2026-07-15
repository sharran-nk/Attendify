import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { calculateMissableClasses } from '@/utils/attendance';
import { AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AttendanceInsights() {
  const { subjects, settings } = useApp();
  const navigate = useNavigate();

  return (
    <div className="ios-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Insights</h2>
        <button 
          onClick={() => navigate('/subjects')}
          className="group flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          See All
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="space-y-2">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No insights available yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Add some subjects to see your attendance health here.
            </p>
          </div>
        ) : (
          subjects.map((subject, idx) => {
            const pct = subject.totalClasses > 0 ? (subject.attendedClasses / subject.totalClasses) * 100 : 100;
            const isLow = pct < settings.attendanceWarningThreshold;
            const missable = calculateMissableClasses(subject.attendedClasses, subject.totalClasses, settings.attendanceWarningThreshold);
            
            let classesNeeded = 0;
            if (isLow) {
              // How many consecutive classes needed to reach threshold?
              let tempAttended = subject.attendedClasses;
              let tempTotal = subject.totalClasses;
              while ((tempAttended / tempTotal) * 100 < settings.attendanceWarningThreshold) {
                tempAttended++;
                tempTotal++;
                classesNeeded++;
                if (classesNeeded > 100) break; // sanity limit
              }
            }

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <div 
                  className="w-1.5 h-10 rounded-full flex-shrink-0 transition-transform group-hover:scale-y-110"
                  style={{ backgroundColor: subject.color }}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate transition-colors group-hover:text-blue-500">
                      {subject.name}
                    </p>
                    <span className={`text-sm font-bold ml-2 ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLow ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span className="text-xs text-rose-500 font-medium truncate">
                          Attend next {classesNeeded} class{classesNeeded > 1 ? 'es' : ''} to reach {settings.attendanceWarningThreshold}%
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs text-emerald-500 font-medium truncate">
                          {missable > 0 
                            ? `Safe to miss ${missable} class${missable > 1 ? 'es' : ''}` 
                            : 'Cannot miss next class'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
