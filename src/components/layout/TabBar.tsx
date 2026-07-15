import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Calendar, CheckSquare, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Home' },
  { id: 'subjects', path: '/subjects', icon: BookOpen, label: 'Subjects' },
  { id: 'attendance', path: '/attendance', icon: Calendar, label: 'Attendance' },
  { id: 'tasks', path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/login') {
    return null;
  }

  const activeTab = tabs.find(tab => tab.path === location.pathname)?.id || 'dashboard';

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 glass-effect safe-area-inset"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <tab.icon
                className={`w-5 h-5 transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              />
              <span
                className={`text-[10px] mt-1 font-medium transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
