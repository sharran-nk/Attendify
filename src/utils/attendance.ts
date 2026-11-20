import { Subject, AttendanceEntry } from '@/types/attendance';

/**
 * Calculates the number of future classes a student can miss while maintaining
 * a specific attendance threshold.
 * 
 * @param attendedClasses Number of classes attended
 * @param totalClasses Total number of classes held so far
 * @param thresholdPercentage Required attendance percentage (0-100)
 * @returns The number of classes that can be missed. Returns 0 if already at or below threshold.
 */
export function calculateMissableClasses(
  attendedClasses: number,
  totalClasses: number,
  thresholdPercentage: number
): number {
  if (totalClasses <= 0 || thresholdPercentage <= 0) return 0;

  const threshold = thresholdPercentage / 100;
  const maxTotalClasses = attendedClasses / threshold;
  const missable = Math.floor(maxTotalClasses - totalClasses);

  return Math.max(0, missable);
}

/**
 * Calculates the consecutive future classes a student must attend to reach
 * or restore their attendance percentage to the warning threshold.
 */
export function calculateConsecutiveClassesNeeded(
  attendedClasses: number,
  totalClasses: number,
  thresholdPercentage: number
): number {
  if (totalClasses <= 0) return 0;
  const currentPct = (attendedClasses / totalClasses) * 100;
  if (currentPct >= thresholdPercentage) return 0;

  // Attended + N / (Total + N) >= Threshold
  // Attended + N >= Threshold * Total + Threshold * N
  // N * (1 - Threshold) >= Threshold * Total - Attended
  const threshold = thresholdPercentage / 100;
  if (threshold >= 1) return 0; // cannot reach 100% if missed any class

  const needed = Math.ceil((threshold * totalClasses - attendedClasses) / (1 - threshold));
  return Math.max(0, needed);
}

/**
 * Calculates unified aggregate attendance metrics across subjects and entries.
 * Excludes cancelled sessions according to Attendify domain rules.
 */
export function calculateOverallMetrics(
  subjects: Subject[],
  attendance: AttendanceEntry[]
): {
  attended: number;
  absent: number;
  cancelled: number;
  totalClasses: number;
  percentage: number;
} {
  let attended = 0;
  let absent = 0;
  let cancelled = 0;

  if (attendance && attendance.length > 0) {
    attendance.forEach((entry) => {
      if (entry.status === 'present') attended++;
      else if (entry.status === 'absent') absent++;
      else if (entry.status === 'cancelled') cancelled++;
    });
  } else if (subjects && subjects.length > 0) {
    // Fallback if detailed logs are not yet populated
    subjects.forEach((s) => {
      const att = Number(s.attendedClasses) || 0;
      const tot = Number(s.totalClasses) || 0;
      attended += att;
      absent += Math.max(0, tot - att);
    });
  }

  const totalClasses = attended + absent;
  const percentage = totalClasses > 0 ? (attended / totalClasses) * 100 : 0;

  return {
    attended,
    absent,
    cancelled,
    totalClasses,
    percentage,
  };
}
