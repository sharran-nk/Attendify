import { PageContainer } from '@/components/layout/PageContainer';
import { AttendanceInsights } from '@/components/dashboard/AttendanceInsights';
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable';
import { OverallAttendance } from '@/components/dashboard/OverallAttendance';
import { TodayClasses } from '@/components/dashboard/TodayClasses';
import { ModeToggle } from '@/components/mode-toggle';
import { ShareButton } from '@/components/share-button';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function Dashboard() {
  const { user } = useAuth();
  const { isInstalled, showPrompt } = usePWAInstall();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <PageContainer
      title={`${greeting}, ${firstName}`}
      subtitle={format(new Date(), 'EEEE, MMMM d')}
      rightAction={
        <div className="flex shrink-0 items-center gap-1">
          <ShareButton />
          {/* The sidebar carries the theme toggle on laptops; Settings has it on phones */}
          <div className="hidden sm:block lg:hidden">
            <ModeToggle />
          </div>
          {!isInstalled && (
            <Button variant="outline" size="icon" onClick={() => showPrompt()} aria-label="Install app">
              <Download aria-hidden="true" />
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 pb-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-5 lg:col-span-7">
          <OverallAttendance />
          <TodayClasses />
        </div>
        <div className="min-w-0 space-y-5 lg:col-span-5">
          <AttendanceInsights />
        </div>
        <div className="min-w-0 lg:col-span-12">
          <WeeklyTimetable />
        </div>
      </div>
    </PageContainer>
  );
}
