import { motion } from 'framer-motion';
import { Check, X, Clock, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function TodayClasses() {
  const { subjects, attendance } = useApp();
  const navigate = useNavigate();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAttendance = attendance.filter(a => a.date === today);

  if (subjects.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Clock className="w-10 h-10 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Subjects Yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[200px] mx-auto leading-relaxed">
          Get started by adding your courses to track today's schedule.
        </p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/subjects')}
          className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-medium shadow-md transition-colors hover:bg-slate-800 dark:hover:bg-slate-100"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Schedule</h2>
        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
          {format(new Date(), 'MMM d')}
        </span>
      </div>

      <div className="space-y-3">
        {subjects.map((subject, index) => {
          const subjectAttendance = todayAttendance.find(a => a.subjectId === subject.id);
          
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate('/attendance')}
              className="group flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
            >
              <div 
                className="w-1.5 h-10 rounded-full flex-shrink-0 transition-transform group-hover:scale-y-110"
                style={{ backgroundColor: subject.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                  {subject.name}
                </p>
                {subject.instructor && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {subject.instructor}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {subjectAttendance ? (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold shadow-sm ${
                    subjectAttendance.status === 'present' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                      : subjectAttendance.status === 'absent'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}>
                    {subjectAttendance.status === 'present' && <Check className="w-3.5 h-3.5" />}
                    {subjectAttendance.status === 'absent' && <X className="w-3.5 h-3.5" />}
                    <span className="capitalize tracking-wide">{subjectAttendance.status}</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-md">
                    Not marked
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
