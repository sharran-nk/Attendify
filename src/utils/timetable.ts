import { TimetableSlot, Subject } from '@/types/attendance';

// Standard 50-minute slot parser & range calculator
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  // Normalize 1-7 PM college timings if not in 24h
  if (hours >= 1 && hours <= 7) {
    hours += 12;
  }
  return hours * 60 + minutes;
}

export function formatMinutesTo12h(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${minsStr} ${ampm}`;
}

export function getTimeRangeString(startTime: string): { displayRange: string; startMin: number; endMin: number } {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = startMin + 50; // default 50-minute college period
  return {
    displayRange: `${formatMinutesTo12h(startMin)} - ${formatMinutesTo12h(endMin)}`,
    startMin,
    endMin,
  };
}

// Clean string for normalized comparison (lowercase, single spaces, stripped punctuation)
function normalizeName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Matches a timetable slot to an existing user Subject.
 * 1. Exact subject ID match
 * 2. Exact name match (normalized case and whitespace)
 * 3. Single-token word match (e.g. "IP Lab" -> "IP")
 * 4. Acronym match (e.g. "Deep Learning" -> "dl")
 * Returns undefined if no existing subject matches.
 */
export function findMatchingSubject(slot: TimetableSlot, userSubjects: Subject[]): Subject | undefined {
  if (!userSubjects || userSubjects.length === 0) return undefined;

  if (slot.subjectId) {
    const byId = userSubjects.find(s => s.id === slot.subjectId);
    if (byId) return byId;
  }

  if (!slot.subjectName) return undefined;
  const slotNorm = normalizeName(slot.subjectName);
  if (!slotNorm) return undefined;

  const byExactName = userSubjects.find(s => normalizeName(s.name) === slotNorm);
  if (byExactName) return byExactName;

  const byWordBoundary = userSubjects.find(s => {
    const subNorm = normalizeName(s.name);
    if (subNorm === slotNorm) return true;
    const subWords = subNorm.split(' ');
    const slotWords = slotNorm.split(' ');
    if (subWords.includes(slotNorm) || slotWords.includes(subNorm)) return true;
    return false;
  });
  if (byWordBoundary) return byWordBoundary;

  const byAcronym = userSubjects.find(s => {
    const subNorm = normalizeName(s.name);
    const subAcronym = subNorm.split(' ').map(w => w[0]).join('');
    const slotAcronym = slotNorm.split(' ').map(w => w[0]).join('');

    return (
      (slotNorm.length >= 2 && subAcronym === slotNorm) ||
      (subNorm.length >= 2 && slotAcronym === subNorm) ||
      (subAcronym && slotAcronym && subAcronym === slotAcronym)
    );
  });
  if (byAcronym) return byAcronym;

  return undefined;
}
