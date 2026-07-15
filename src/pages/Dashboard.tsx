import { PageContainer } from '@/components/layout/PageContainer';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { TodayClasses } from '@/components/dashboard/TodayClasses';
import { AttendanceInsights } from '@/components/dashboard/AttendanceInsights';
import { ModeToggle } from '@/components/mode-toggle';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { subjects } = useApp();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFirstName = () => {
    if (!user?.name) return 'Student';
    return user.name.split(' ')[0];
  };

  const todayStr = format(new Date(), 'EEEE, MMMM d');

  const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
  const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

  return (
    <PageContainer
      title=""
      subtitle=""
      rightAction={null} // Removed from standard header as we build custom hero
    >
      <div className="space-y-5 pb-8">
        
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg dark:shadow-2xl border border-slate-100 dark:border-none"
        >
          {/* Abstract glowing blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[250px] h-[250px] bg-blue-500/10 dark:bg-blue-600/30 rounded-full blur-[60px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[200px] h-[200px] bg-purple-500/10 dark:bg-purple-600/30 rounded-full blur-[60px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between p-6 md:p-8 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-blue-600 dark:text-blue-200 font-medium tracking-wide mb-1 text-xs uppercase">{todayStr}</p>
                <h1 className="text-[28px] md:text-3xl font-bold tracking-tight leading-tight">
                  {greeting()}, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
                    {getFirstName()}
                  </span>
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 max-w-md text-[13px] md:text-sm leading-relaxed">
                Stay on top of your academic journey. You have a great day ahead to crush your goals and maintain your attendance streak.
              </p>
              <div className="pt-1">
                <ModeToggle />
              </div>
            </div>

            {/* Overall Attendance Glass Card */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0 bg-slate-50 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/20 p-5 rounded-xl flex flex-col items-center justify-center shadow-sm dark:shadow-inner min-w-[160px]"
            >
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="5" fill="none" className="text-slate-200 dark:text-slate-700/50" />
                  <circle 
                    cx="40" cy="40" r="34" 
                    stroke="currentColor" 
                    strokeWidth="5" 
                    fill="none" 
                    strokeDasharray="213.6" 
                    strokeDashoffset={213.6 - (213.6 * overallPercentage) / 100}
                    className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold tracking-tight">{overallPercentage.toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 mt-3 uppercase tracking-wider">Overall</p>
            </motion.div>
          </div>
        </motion.div>

        {/* QUICK STATS CARDS */}
        <QuickStats />

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Left Column (Insights) */}
          <div className="xl:col-span-2 space-y-5">
            <AttendanceInsights />
          </div>

          {/* Right Column (Tasks & Schedule) */}
          <div className="space-y-5">
            <div className="ios-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <TodayClasses />
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
