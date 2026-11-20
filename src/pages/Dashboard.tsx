import { PageContainer } from '@/components/layout/PageContainer';
import { AttendanceInsights } from '@/components/dashboard/AttendanceInsights';
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable';
import { OverallAttendance } from '@/components/dashboard/OverallAttendance';
import { ModeToggle } from '@/components/mode-toggle';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <PageContainer
      title={`${greeting}, ${firstName}`}
      subtitle={format(new Date(), 'EEEE, MMMM d')}
      rightAction={<ModeToggle />}
    >
      <div className="space-y-5 pb-8">
        <OverallAttendance />
        <WeeklyTimetable />
        <AttendanceInsights />
      </div>
    </PageContainer>
  );
}
