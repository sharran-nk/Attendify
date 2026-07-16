import { motion } from 'framer-motion';
import { Moon, Sun, Percent, Info, LogOut, Cloud, RefreshCw, Clock, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const { settings, updateSettings, subjects, isSyncing } = useApp();
  const { logout, user } = useAuth();
  const { setTheme, theme } = useTheme();

  const handleReminderToggle = (checked: boolean) => {
    if (checked && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(() => {
        updateSettings({ reminderEnabled: checked });
      });
    } else {
      updateSettings({ reminderEnabled: checked });
    }
  };

  const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.totalClasses, 0);

  return (
    <PageContainer
      title="Settings"
      subtitle="Customize your experience"
    >
      <div className="space-y-3">
        {/* Profile */}
        <div className="space-y-1.5">
          <h2 className="text-[13px] font-medium text-muted-foreground px-1">Account</h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card p-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button variant="ghost" size="sm" onClick={logout} className="text-destructive h-8 px-2">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
                {user && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3 h-3 text-green-500" />
                        <span>Cloud Synced</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        {/* Appearance */}
        <div className="space-y-1.5">
          <h2 className="text-[13px] font-medium text-muted-foreground px-1">Appearance</h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card"
          >
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.darkMode ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-warning" />
                )}
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.darkMode ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark' || settings.darkMode}
                onCheckedChange={(checked) => {
                  setTheme(checked ? 'dark' : 'light');
                  updateSettings({ darkMode: checked });
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Notifications */}
        <div className="space-y-1.5">
          <h2 className="text-[13px] font-medium text-muted-foreground px-1">Notifications</h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="ios-card"
          >

            <div className="p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Daily Reminder</p>
                    <p className="text-sm text-muted-foreground">
                      Get daily attendance notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!!settings.reminderEnabled}
                  onCheckedChange={handleReminderToggle}
                />
              </div>
              {settings.reminderEnabled && (
                <div className="flex items-center justify-between pl-8 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-sm font-medium">Reminder Time</p>
                  <input
                    type="time"
                    value={settings.reminderTime || "08:00"}
                    onChange={(e) => updateSettings({ reminderTime: e.target.value })}
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>


        {/* Attendance Threshold */}
        <div className="space-y-1.5">
          <h2 className="text-[13px] font-medium text-muted-foreground px-1">Attendance</h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="ios-card p-3.5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Percent className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Warning Threshold</p>
                <p className="text-sm text-muted-foreground">
                  Alert when below {settings.attendanceWarningThreshold}%
                </p>
              </div>
              <span className="text-lg font-bold text-primary">
                {settings.attendanceWarningThreshold}%
              </span>
            </div>
            <Slider
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
        </div>

        {/* Stats Summary */}
        <div className="space-y-1.5">
          <h2 className="text-[13px] font-medium text-muted-foreground px-1">Summary</h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="ios-card p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Subjects</span>
              <span className="font-semibold">{subjects.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Classes</span>
              <span className="font-semibold">{totalClasses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Classes Attended</span>
              <span className="font-semibold">{totalAttended}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overall Attendance</span>
              <span className={`font-semibold ${totalClasses > 0
                ? (totalAttended / totalClasses) * 100 >= settings.attendanceWarningThreshold
                  ? 'text-success'
                  : 'text-destructive'
                : ''
                }`}>
                {totalClasses > 0
                  ? `${Math.round((totalAttended / totalClasses) * 100)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </motion.div>
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="ios-card p-3.5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Attendify</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your personal attendance tracker. All data is securely synced to your account.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
