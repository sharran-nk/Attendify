import { motion } from 'framer-motion';
import { Moon, Sun, Percent, Info, LogOut, Cloud, RefreshCw, Clock, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { calculateOverallMetrics } from '@/utils/attendance';
import { cn } from '@/lib/utils';

/** Rounded colour tile behind a row icon, like iOS Settings. */
function IconTile({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return (
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]', className)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.3, ease: [0.23, 1, 0.32, 1] as const },
});

export default function Settings() {
  const { settings, updateSettings, subjects, attendance, isSyncing } = useApp();
  const { logout, user } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleReminderToggle = (checked: boolean) => {
    if (checked && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(() => {
        updateSettings({ reminderEnabled: checked });
      });
    } else {
      updateSettings({ reminderEnabled: checked });
    }
  };

  const { attended: totalAttended, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const isHealthy = percentage >= settings.attendanceWarningThreshold;

  const summary = [
    { label: 'Subjects', value: subjects.length, tint: 'bg-primary/10 text-primary' },
    { label: 'Total classes', value: totalClasses, tint: 'bg-secondary text-foreground' },
    { label: 'Attended', value: totalAttended, tint: 'bg-success/10 text-success' },
    {
      label: 'Overall',
      value: totalClasses > 0 ? `${Math.round(percentage)}%` : 'N/A',
      tint: totalClasses === 0 ? 'bg-secondary text-foreground' : isHealthy ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
    },
  ];

  return (
    <PageContainer title="Settings" subtitle="Customize your experience">
      <div className="space-y-5 pb-4">
        {/* Account */}
        <section className="space-y-1.5">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Account</h2>
          <motion.div {...fadeUp()} className="ios-card relative overflow-hidden p-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
            />
            <div className="relative flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-card">
                {user?.picture ? (
                  <img src={user.picture} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{user?.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                {user && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-3 w-3 text-success" />
                        Cloud synced
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="relative mt-4 w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </motion.div>
        </section>

        {/* Appearance */}
        <section className="space-y-1.5">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Appearance</h2>
          <motion.div {...fadeUp(0.04)} className="ios-card">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <IconTile
                  icon={isDark ? Moon : Sun}
                  className={isDark ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'}
                />
                <div>
                  <p className="font-medium">Dark mode</p>
                  <p className="text-sm text-muted-foreground">{isDark ? 'On' : 'Off'}</p>
                </div>
              </div>
              <Switch
                aria-label="Dark mode"
                checked={isDark}
                onCheckedChange={checked => {
                  setTheme(checked ? 'dark' : 'light');
                  updateSettings({ darkMode: checked });
                }}
              />
            </div>
          </motion.div>
        </section>

        {/* Notifications */}
        <section className="space-y-1.5">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Notifications</h2>
          <motion.div {...fadeUp(0.08)} className="ios-card">
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconTile icon={Clock} className="bg-primary/10 text-primary" />
                  <div>
                    <p className="font-medium">Daily reminder</p>
                    <p className="text-sm text-muted-foreground">Get a nudge to mark attendance</p>
                  </div>
                </div>
                <Switch
                  aria-label="Daily reminder"
                  checked={!!settings.reminderEnabled}
                  onCheckedChange={handleReminderToggle}
                />
              </div>
              {settings.reminderEnabled && (
                <div className="flex items-center justify-between border-t border-border/60 pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label htmlFor="reminder-time" className="text-sm font-medium">
                    Reminder time
                  </label>
                  <input
                    id="reminder-time"
                    type="time"
                    value={settings.reminderTime || '08:00'}
                    onChange={e => updateSettings({ reminderTime: e.target.value })}
                    className="flex h-10 rounded-lg border border-input bg-secondary px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Attendance threshold */}
        <section className="space-y-1.5">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Attendance</h2>
          <motion.div {...fadeUp(0.12)} className="ios-card space-y-4 p-4">
            <div className="flex items-center gap-3">
              <IconTile icon={Percent} className="bg-success/10 text-success" />
              <div className="flex-1">
                <p className="font-medium">Warning threshold</p>
                <p className="text-sm text-muted-foreground">Alert when below {settings.attendanceWarningThreshold}%</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-base font-bold text-primary">
                {settings.attendanceWarningThreshold}%
              </span>
            </div>
            <Slider
              aria-label="Attendance warning threshold"
              value={[settings.attendanceWarningThreshold]}
              onValueChange={([value]) => updateSettings({ attendanceWarningThreshold: value })}
              min={50}
              max={90}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span>90%</span>
            </div>
          </motion.div>
        </section>

        {/* Summary */}
        <section className="space-y-1.5">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Summary</h2>
          <motion.div {...fadeUp(0.16)} className="grid grid-cols-2 gap-3">
            {summary.map(item => (
              <div key={item.label} className={cn('rounded-2xl p-4', item.tint)}>
                <p className="text-2xl font-bold leading-tight">{item.value}</p>
                <p className="mt-0.5 text-sm font-medium opacity-80">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* About */}
        <motion.div {...fadeUp(0.2)} className="ios-card p-4">
          <div className="flex items-start gap-3">
            <IconTile icon={Info} className="bg-primary/10 text-primary" />
            <div>
              <p className="font-medium">Attendify</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your personal attendance tracker. All data is securely synced to your account.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
