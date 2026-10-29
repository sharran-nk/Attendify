import { PageContainer } from '@/components/layout/PageContainer';
import { AttendanceInsights } from '@/components/dashboard/AttendanceInsights';
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable';
import { OverallAttendance } from '@/components/dashboard/OverallAttendance';
import { ModeToggle } from '@/components/mode-toggle';
import { ShareButton } from '@/components/share-button';
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
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          {greeting()},
          <span className="text-primary font-bold">
            {getFirstName()}
          </span>
        </span>
      }
      subtitle={todayStr}
      rightAction={
        <div className="flex items-center gap-3">
          <ShareButton />
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

        {/* 1. TIMETABLE */}
        <WeeklyTimetable />

        {/* 2. OVERALL ATTENDANCE SUMMARY */}
        <OverallAttendance />

        {/* 3. ATTENDANCE INSIGHTS */}
        <AttendanceInsights />

      </div>
    </PageContainer>
  );
}
