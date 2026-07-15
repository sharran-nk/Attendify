import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';

export function QuickStats() {
  const { subjects, attendance, tasks, settings } = useApp();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAttendance = attendance.filter(a => a.date === today);
  const pendingTasks = tasks.filter(t => !t.completed);
  
  const lowAttendanceSubjects = subjects.filter(s => {
    const pct = s.totalClasses > 0 ? (s.attendedClasses / s.totalClasses) * 100 : 100;
    return pct < settings.attendanceWarningThreshold;
  });

  const cards = [
    {
      title: 'Total Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-400',
      shadowColor: 'shadow-blue-500/20',
      bgColor: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Today\'s Classes',
      value: todayAttendance.length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-400',
      shadowColor: 'shadow-emerald-500/20',
      bgColor: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks.length,
      icon: Calendar,
      color: 'from-amber-500 to-orange-400',
      shadowColor: 'shadow-amber-500/20',
      bgColor: 'bg-amber-500/10 text-amber-500',
    },
    {
      title: 'At Risk',
      value: lowAttendanceSubjects.length,
      icon: AlertCircle,
      color: lowAttendanceSubjects.length > 0 ? 'from-rose-500 to-pink-500' : 'from-emerald-500 to-teal-400',
      shadowColor: lowAttendanceSubjects.length > 0 ? 'shadow-rose-500/20' : 'shadow-emerald-500/20',
      bgColor: lowAttendanceSubjects.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500',
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start"
    >
      {cards.map((card, idx) => (
        <motion.div 
          key={idx}
          variants={item}
          whileHover={{ y: -3, scale: 1.02 }}
          className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm ${card.shadowColor} transition-all duration-300 group`}
        >
          {/* Background Gradient Glow on Hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.05] transition-opacity duration-500`} />
          
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500 ease-out`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            
            <div>
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={card.value}
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                {card.value}
              </motion.h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {card.title}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
