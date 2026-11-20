import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarCheck, ListChecks, Settings, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';
import { Wordmark } from '@/components/layout/Wordmark';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/subjects', icon: BookOpen, label: 'Subjects' },
  { path: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { path: '/tasks', icon: ListChecks, label: 'Tasks' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="px-5 pb-4 pt-6">
        <Wordmark />
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'press press-hover relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-margin" aria-hidden="true" />
                )}
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
        {user && (
          <img
            src={user.picture}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full bg-muted object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <ModeToggle />
      </div>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur lg:hidden safe-area-inset"
    >
      <ul className="mx-auto flex max-w-xl">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <li key={path} className="flex-1">
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'press relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Wraps all routes. Phones get a bottom nav, laptops a left sidebar.
 * The login page renders bare.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  if (pathname === '/login') return <>{children}</>;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div
        id="main"
        key={pathname}
        className="page-enter min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60"
      >
        {children}
      </div>
      <BottomNav />
    </>
  );
}
