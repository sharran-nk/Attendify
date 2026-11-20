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
        <span className="block truncate font-semibold text-foreground">
          {greeting()}, <span className="font-bold text-primary">{getFirstName()}</span>
        </span>
      }
      subtitle={todayStr}
      rightAction={
        <div className="flex shrink-0 items-center gap-2">
          <ShareButton />
          <ModeToggle />
          {!isInstalled ? (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => showPrompt()}
              aria-label="Install app"
              className="flex h-10 items-center gap-2 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20 sm:px-4"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Install App</span>
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
