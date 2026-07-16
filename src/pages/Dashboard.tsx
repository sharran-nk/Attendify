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
      title={
        <span className="flex items-center gap-1.5">
          {greeting()},
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
            {getFirstName()}
          </span>
        </span>
      }
      subtitle={todayStr.toUpperCase()}
      rightAction={
        <div className="flex items-center gap-3">
          <ModeToggle />
          {!isInstalled ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => showPrompt()}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Install App
            </motion.button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5 pb-8">

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
