import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Subject, AppSettings } from '@/types/attendance';

const mockUseApp = vi.fn();
const warning = vi.fn();

vi.mock('@/contexts/AppContext', () => ({ useApp: () => mockUseApp() }));
vi.mock('sonner', () => ({ toast: { warning: (...a: unknown[]) => warning(...a) } }));

import { useAttendanceReminder } from './useAttendanceReminder';

const sub = (over: Partial<Subject>): Subject => ({
  id: 'x',
  name: 'Maths',
  credits: 3,
  totalClasses: 40,
  attendedClasses: 20,
  color: '#000',
  createdAt: '',
  ...over,
});

const settings = (over: Partial<AppSettings> = {}): AppSettings => ({
  attendanceWarningThreshold: 75,
  darkMode: false,
  reminderEnabled: true,
  reminderTime: '08:00',
  ...over,
});

/** Start the clock 30s before 08:00 so one 60s tick lands on 08:00. */
function setup(subjects: Subject[], s: AppSettings) {
  vi.setSystemTime(new Date(2025, 2, 20, 7, 59, 30));
  mockUseApp.mockReturnValue({ subjects, settings: s });
  return renderHook(() => useAttendanceReminder());
}

beforeEach(() => {
  vi.useFakeTimers();
  warning.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useAttendanceReminder', () => {
  it('warns about a subject below the threshold at the reminder time', () => {
    setup([sub({})], settings());
    vi.advanceTimersByTime(60_000);

    expect(warning).toHaveBeenCalledTimes(1);
    const [title, opts] = warning.mock.calls[0];
    expect(title).toContain('Attendance Alert');
    expect(opts.description).toBe('Maths attendance is 50%. Attend 40 more classes to reach 75%.');
  });

  it('does not warn for subjects at or above the threshold', () => {
    setup([sub({ attendedClasses: 30 })], settings());
    vi.advanceTimersByTime(60_000);
    expect(warning).not.toHaveBeenCalled();
  });

  it('skips subjects with no classes held', () => {
    setup([sub({ totalClasses: 0, attendedClasses: 0 })], settings());
    vi.advanceTimersByTime(60_000);
    expect(warning).not.toHaveBeenCalled();
  });

  it('warns once per low subject', () => {
    setup(
      [sub({ id: '1' }), sub({ id: '2', name: 'Physics' }), sub({ id: '3', attendedClasses: 40 })],
      settings()
    );
    vi.advanceTimersByTime(60_000);
    expect(warning).toHaveBeenCalledTimes(2);
  });

  it('does nothing when reminders are disabled', () => {
    setup([sub({})], settings({ reminderEnabled: false }));
    vi.advanceTimersByTime(60_000);
    expect(warning).not.toHaveBeenCalled();
  });

  it('does nothing when the time does not match', () => {
    setup([sub({})], settings({ reminderTime: '09:00' }));
    vi.advanceTimersByTime(60_000);
    expect(warning).not.toHaveBeenCalled();
  });

  it('does not notify again if already notified today', () => {
    localStorage.setItem('attendify_last_notified', new Date(2025, 2, 20).toDateString());
    setup([sub({})], settings());
    vi.advanceTimersByTime(60_000);
    expect(warning).not.toHaveBeenCalled();
  });

  it('stores today as the last-notified date after firing', () => {
    setup([sub({})], settings());
    vi.advanceTimersByTime(60_000);
    expect(localStorage.getItem('attendify_last_notified')).toBe(new Date(2025, 2, 20).toDateString());
  });

  it('sends a browser notification when permission is granted', () => {
    const NotificationMock = Object.assign(vi.fn(), { permission: 'granted' });
    vi.stubGlobal('Notification', NotificationMock);

    setup([sub({})], settings());
    vi.advanceTimersByTime(60_000);

    expect(NotificationMock).toHaveBeenCalledWith(
      '⚠️ Attendance Alert',
      expect.objectContaining({ body: expect.stringContaining('Maths') })
    );
  });

  it('stops the interval on unmount', () => {
    const { unmount } = setup([sub({})], settings());
    unmount();
    vi.advanceTimersByTime(60_000);
    expect(warning).not.toHaveBeenCalled();
  });
});
