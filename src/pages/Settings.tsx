import { Moon, Sun, Percent, LogOut, Clock, Download, Share2, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ShareButton } from '@/components/share-button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

/** A row inside a grouped list. */
function Row({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="px-1 text-[13px] font-medium text-muted-foreground">{title}</h2>
      <div className="ios-card divide-y divide-border/60 overflow-hidden">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const { logout, user } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const { isInstalled, showPrompt } = usePWAInstall();
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

  return (
    <PageContainer title="Settings">
      <div className="space-y-6 pb-4">
        {/* Account */}
        <section className="ios-card flex items-center gap-3 p-4">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/10">
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-primary">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user?.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </section>

        {/* Preferences */}
        <Group title="Preferences">
          <Row icon={isDark ? Moon : Sun} title="Dark mode">
            <Switch
              aria-label="Dark mode"
              checked={isDark}
              onCheckedChange={checked => {
                setTheme(checked ? 'dark' : 'light');
                updateSettings({ darkMode: checked });
              }}
            />
          </Row>

          <div>
            <Row icon={Clock} title="Daily reminder" hint="A nudge to mark attendance">
              <Switch
                aria-label="Daily reminder"
                checked={!!settings.reminderEnabled}
                onCheckedChange={handleReminderToggle}
              />
            </Row>
            {settings.reminderEnabled && (
              <div className="flex items-center justify-between px-4 pb-3 pl-12 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="reminder-time" className="text-sm text-muted-foreground">
                  Remind me at
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime || '08:00'}
                  onChange={e => updateSettings({ reminderTime: e.target.value })}
                  className="h-10 rounded-lg border border-input bg-secondary px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>

          <div>
            <Row icon={Percent} title="Attendance target" hint={`Warn me below ${settings.attendanceWarningThreshold}%`}>
              <span className="text-base font-semibold text-primary">{settings.attendanceWarningThreshold}%</span>
            </Row>
            <div className="px-4 pb-4 pl-12">
              <Slider
                aria-label="Attendance target"
                value={[settings.attendanceWarningThreshold]}
                onValueChange={([value]) => updateSettings({ attendanceWarningThreshold: value })}
                min={50}
                max={90}
                step={5}
              />
            </div>
          </div>
        </Group>

        {/* App */}
        <Group title="App">
          <Row icon={Share2} title="Share Attendify" hint="Send it to a friend">
            <ShareButton />
          </Row>
          {!isInstalled && (
            <Row icon={Download} title="Install app" hint="Add to your home screen">
              <button
                onClick={() => showPrompt()}
                className={cn(
                  'min-h-10 rounded-full bg-brand px-4 text-sm font-semibold hover:brightness-110',
                )}
              >
                Install
              </button>
            </Row>
          )}
        </Group>
      </div>
    </PageContainer>
  );
}
