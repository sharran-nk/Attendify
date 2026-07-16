import { PageContainer } from '@/components/layout/PageContainer';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { TodayClasses } from '@/components/dashboard/TodayClasses';
import { AttendanceInsights } from '@/components/dashboard/AttendanceInsights';
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable';
import { ModeToggle } from '@/components/mode-toggle';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const { subjects } = useApp();
  const { isInstallable, isInstalled, showPrompt, promptInstall, isIOS } = usePWAInstall();

  const handleInstallClick = () => {
    if (isIOS) {
      showPrompt();
    } else {
      promptInstall();
    }
  };

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

  return (
    <PageContainer
      title=""
      subtitle=""
      rightAction={
        !isInstalled ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (isIOS) {
                showPrompt();
              } else {
                promptInstall().then(success => {
                  if (!success && !isIOS) {
                    toast.info("Click the install icon in your browser's address bar to install");
                  }
                });
              }
            }}
            className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            Install App
          </motion.button>
        ) : null
      }
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

          </div>
        </motion.div>

        {/* 1. WEEKLY TIMETABLE */}
        <WeeklyTimetable />

        {/* 2. QUICK STATS CARDS */}
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
