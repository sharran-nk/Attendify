import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateCSV, downloadCSV, generatePDF, type ReportData } from './exportUtils';
import type { Subject, AttendanceEntry } from '@/types/attendance';

const subjects: Subject[] = [
  { id: 'a', name: 'Maths', credits: 3, totalClasses: 0, attendedClasses: 0, color: '#000', createdAt: '' },
  { id: 'b', name: 'Physics, Advanced', credits: 3, totalClasses: 0, attendedClasses: 0, color: '#111', createdAt: '' },
];

const e = (
  id: string,
  subjectId: string,
  date: string,
  status: AttendanceEntry['status'],
  time?: string
): AttendanceEntry => ({ id, subjectId, date, status, time, createdAt: '' });

const base = (over: Partial<ReportData> = {}): ReportData => ({
  userName: 'Test',
  userEmail: 't@example.com',
  subjects,
  attendance: [],
  dateRange: { type: 'all' },
  selectedSubjectId: 'all',
  warningThreshold: 75,
  ...over,
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('generateCSV', () => {
  it('returns only the header when there is no data', () => {
    expect(generateCSV(base())).toBe('Date,Day,Time,Subject,Status');
  });

  it('formats date, weekday, time, subject and status', () => {
    const csv = generateCSV(base({ attendance: [e('1', 'a', '2025-03-10', 'present', '9:20')] }));
    expect(csv.split('\n')[1]).toBe('10-03-2025,Monday,9:20,Maths,Present');
  });

  it('uses a dash for missing time and "Unknown" for a missing subject', () => {
    const csv = generateCSV(base({ attendance: [e('1', 'zzz', '2025-03-10', 'absent')] }));
    expect(csv.split('\n')[1]).toBe('10-03-2025,Monday,—,Unknown,Absent');
  });

  it('maps cancelled status', () => {
    const csv = generateCSV(base({ attendance: [e('1', 'a', '2025-03-10', 'cancelled')] }));
    expect(csv).toContain(',Cancelled');
  });

  it('quotes subject names containing commas', () => {
    const csv = generateCSV(base({ attendance: [e('1', 'b', '2025-03-10', 'present')] }));
    expect(csv).toContain('"Physics, Advanced"');
  });

  it('sorts rows chronologically', () => {
    const csv = generateCSV(
      base({ attendance: [e('1', 'a', '2025-03-12', 'present'), e('2', 'a', '2025-03-10', 'present')] })
    );
    const rows = csv.split('\n').slice(1);
    expect(rows[0].startsWith('10-03-2025')).toBe(true);
    expect(rows[1].startsWith('12-03-2025')).toBe(true);
  });

  it('filters by subject', () => {
    const csv = generateCSV(
      base({
        selectedSubjectId: 'a',
        attendance: [e('1', 'a', '2025-03-10', 'present'), e('2', 'b', '2025-03-10', 'present')],
      })
    );
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('Maths');
  });

  it('custom range is inclusive of both the start and end days', () => {
    const csv = generateCSV(
      base({
        dateRange: { type: 'custom', start: new Date(2025, 2, 10), end: new Date(2025, 2, 12) },
        attendance: [
          e('0', 'a', '2025-03-09', 'present'),
          e('1', 'a', '2025-03-10', 'present'),
          e('2', 'a', '2025-03-12', 'present'),
          e('3', 'a', '2025-03-13', 'present'),
        ],
      })
    );
    const rows = csv.split('\n').slice(1);
    expect(rows.map((r) => r.slice(0, 10))).toEqual(['10-03-2025', '12-03-2025']);
  });

  it('"week" keeps the last 7 days and drops older entries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 20, 12, 0, 0));
    const csv = generateCSV(
      base({
        dateRange: { type: 'week' },
        attendance: [e('1', 'a', '2025-03-12', 'present'), e('2', 'a', '2025-03-13', 'present')],
      })
    );
    const rows = csv.split('\n').slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].startsWith('13-03-2025')).toBe(true);
  });

  it('"month" keeps the last 30 days and drops older entries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 20, 12, 0, 0));
    const csv = generateCSV(
      base({
        dateRange: { type: 'month' },
        attendance: [e('1', 'a', '2025-02-17', 'present'), e('2', 'a', '2025-02-18', 'present')],
      })
    );
    const rows = csv.split('\n').slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].startsWith('18-02-2025')).toBe(true);
  });

  it('does not mutate the input attendance array', () => {
    const attendance = [e('1', 'a', '2025-03-12', 'present'), e('2', 'a', '2025-03-10', 'present')];
    generateCSV(base({ attendance }));
    expect(attendance.map((x) => x.id)).toEqual(['1', '2']);
  });
});

describe('downloadCSV', () => {
  it('creates a blob link, clicks it, and cleans up the DOM', () => {
    const createObjectURL = vi.fn(() => 'blob:fake');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCSV('a,b', 'report.csv');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download]')).toBeNull();
  });
});

describe('generatePDF', () => {
  it('builds a PDF document with at least one page for populated data', () => {
    const doc = generatePDF(
      base({
        attendance: [
          e('1', 'a', '2025-03-10', 'present', '9:20'),
          e('2', 'a', '2025-03-11', 'absent', '10:30'),
          e('3', 'b', '2025-03-11', 'cancelled'),
        ],
      })
    );
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('does not throw with no attendance data', () => {
    expect(() => generatePDF(base())).not.toThrow();
  });
});
