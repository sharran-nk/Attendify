import { Subject, AttendanceEntry } from '@/types/attendance';
import { parseISO, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { calculateMissableClasses, calculateConsecutiveClassesNeeded, calculateOverallMetrics } from '@/utils/attendance';

export interface AttendanceAnalyticsContext {
  subjects: Subject[];
  attendance: AttendanceEntry[];
  warningThreshold: number;
}

export interface QueryResult {
  intent: string;
  headline: string;
  details: string;
  bulletPoints?: string[];
  suggestedFollowUps?: string[];
  subjectName?: string;
  calculatedMetrics?: Record<string, number | string>;
}

/**
 * Normalizes user subject names and slot strings for robust partial/fuzzy/acronym matching.
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Finds a matching subject from user input by exact name, ID, word boundary, or acronym.
 */
export function findSubjectInQuery(query: string, subjects: Subject[]): Subject | undefined {
  const normQuery = normalizeName(query);
  const words = normQuery.split(' ');

  // 1. Direct exact or substring match
  for (const s of subjects) {
    const sNorm = normalizeName(s.name);
    if (normQuery.includes(sNorm)) return s;
  }

  // 2. Acronym match (e.g. "IP" -> "Image Processing", "DL" -> "Deep Learning", "NLP" -> "Natural Language Processing")
  for (const s of subjects) {
    const sNorm = normalizeName(s.name);
    const sWords = sNorm.split(' ');
    const acronym = sWords.map((w) => w[0]).join('');

    // Check if query contains the acronym as a standalone word
    if (words.includes(acronym)) return s;

    // Check if user specifically wrote subject code in parentheses like "(IP)"
    for (const w of sWords) {
      if (w.length >= 2 && words.includes(w)) {
        return s;
      }
    }
  }

  // 3. Reverse substring match: check if a subject contains a word with length >= 3
  for (const s of subjects) {
    const sNorm = normalizeName(s.name);
    for (const w of words) {
      if (w.length >= 4 && sNorm.includes(w)) {
        return s;
      }
    }
  }

  return undefined;
}

/**
 * Core Deterministic Attendance Analytics Engine.
 * Answers user questions directly from their verified Firebase records.
 */
export function answerAttendanceQuery(
  rawQuery: string,
  context: AttendanceAnalyticsContext,
  previousSubject?: Subject
): QueryResult {
  const query = rawQuery.trim().toLowerCase();
  const { subjects, attendance, warningThreshold } = context;

  // Identify target subject (either directly in query or through follow-up context)
  const matchedSubject = findSubjectInQuery(query, subjects) || previousSubject;

  // Helper to convert word numbers or digits to integer
  const parseWordOrDigit = (str: string): number => {
    const wordMap: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    };
    const s = str.trim().toLowerCase();
    if (wordMap[s] !== undefined) return wordMap[s];
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
  };

  // -------------------------------------------------------------
  // Intent: Target Percentage Simulation ("If I attend next X classes...")
  // -------------------------------------------------------------
  const numberPattern = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten)';
  const attendRegex = new RegExp(`(?:if i attend|attend(?:ing)?(?: my)?(?: next)?|go to)\\s+(${numberPattern})`, 'i');
  const attendFutureMatch = query.match(attendRegex) ||
    query.match(new RegExp(`(${numberPattern})\\s+(?:more\\s+)?classes`, 'i'));

  if (attendFutureMatch && (query.includes('attend') || query.includes('go to') || query.includes('if i attend') || query.includes('what if i attend'))) {
    const count = parseWordOrDigit(attendFutureMatch[1]);
    if (count > 0) {
      if (matchedSubject) {
        const currentAttended = matchedSubject.attendedClasses;
        const currentTotal = matchedSubject.totalClasses;
        const newAttended = currentAttended + count;
        const newTotal = currentTotal + count;
        const currentPct = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;
        const newPct = newTotal > 0 ? (newAttended / newTotal) * 100 : 0;

        return {
          intent: 'hypothetical_attend_subject',
          headline: `${matchedSubject.name}: +${count} Attended Classes`,
          details: `If you attend your next ${count} ${matchedSubject.name} class${count > 1 ? 'es' : ''}, your attendance will rise from ${currentPct.toFixed(1)}% (${currentAttended}/${currentTotal}) to ${newPct.toFixed(1)}% (${newAttended}/${newTotal}).`,
          bulletPoints: [
            `Current: ${currentAttended}/${currentTotal} (${currentPct.toFixed(1)}%)`,
            `Projected: ${newAttended}/${newTotal} (${newPct.toFixed(1)}%)`,
            newPct >= warningThreshold
              ? `Status: Safe! Meets the ${warningThreshold}% institutional minimum.`
              : `Status: Still below ${warningThreshold}%. You need ${calculateConsecutiveClassesNeeded(currentAttended, currentTotal, warningThreshold)} consecutive classes in total.`,
          ],
          suggestedFollowUps: [
            `What if I miss 1 class in ${matchedSubject.name}?`,
            `How many classes can I skip in ${matchedSubject.name}?`,
          ],
          subjectName: matchedSubject.name,
          calculatedMetrics: { count, currentPct, newPct },
        };
      } else {
        // Overall attendance hypothetical
        const { attended, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
        const newAttended = attended + count;
        const newTotal = totalClasses + count;
        const newPct = newTotal > 0 ? (newAttended / newTotal) * 100 : 0;

        return {
          intent: 'hypothetical_attend_overall',
          headline: `Overall: +${count} Attended Classes`,
          details: `Attending your next ${count} classes across all subjects will raise your overall attendance from ${percentage.toFixed(1)}% (${attended}/${totalClasses}) to ${newPct.toFixed(1)}% (${newAttended}/${newTotal}).`,
          suggestedFollowUps: ['Which subject needs the most attention?', 'Show my lowest attendance subject'],
          calculatedMetrics: { count, currentPct: percentage, newPct },
        };
      }
    }
  }

  // -------------------------------------------------------------
  // Intent: Hypothetical Absence / Miss ("What happens if I miss X classes...")
  // -------------------------------------------------------------
  const missRegex = new RegExp(`(?:if i miss|miss(?:ing)?(?: my)?(?: next)?|skip(?: my)?(?: next)?|bunk(?: my)?(?: next)?)\\s+(${numberPattern})`, 'i');
  const missFutureMatch = query.match(missRegex);

  if (missFutureMatch) {
    const count = parseWordOrDigit(missFutureMatch[1]);
    if (count > 0) {
      if (matchedSubject) {
        const currentAttended = matchedSubject.attendedClasses;
        const currentTotal = matchedSubject.totalClasses;
        const newTotal = currentTotal + count;
        const currentPct = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;
        const newPct = newTotal > 0 ? (currentAttended / newTotal) * 100 : 0;
        const safeMissable = calculateMissableClasses(currentAttended, currentTotal, warningThreshold);

        return {
          intent: 'hypothetical_miss_subject',
          headline: `${matchedSubject.name}: -${count} Missed Classes`,
          details: `If you miss ${count} upcoming ${matchedSubject.name} class${count > 1 ? 'es' : ''}, your attendance will drop from ${currentPct.toFixed(1)}% to ${newPct.toFixed(1)}% (${currentAttended}/${newTotal}).`,
          bulletPoints: [
            `Current: ${currentAttended}/${currentTotal} (${currentPct.toFixed(1)}%)`,
            `Projected: ${currentAttended}/${newTotal} (${newPct.toFixed(1)}%)`,
            count > safeMissable
              ? `Warning: This will drop you below your ${warningThreshold}% threshold (safe to miss: ${safeMissable}).`
              : `Safe: You can absorb this absence and remain at or above ${warningThreshold}%.`,
          ],
          suggestedFollowUps: [
            `How many classes can I miss in ${matchedSubject.name}?`,
            `Analyze my attendance.`,
          ],
          subjectName: matchedSubject.name,
          calculatedMetrics: { count, currentPct, newPct, safeMissable },
        };
      } else {
        const { attended, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
        const newTotal = totalClasses + count;
        const newPct = newTotal > 0 ? (attended / newTotal) * 100 : 0;

        return {
          intent: 'hypothetical_miss_overall',
          headline: `Overall: -${count} Missed Classes`,
          details: `Missing ${count} upcoming classes will lower your overall attendance from ${percentage.toFixed(1)}% to ${newPct.toFixed(1)}% (${attended}/${newTotal}).`,
          suggestedFollowUps: ['Which subject needs the most attention?'],
          calculatedMetrics: { count, currentPct: percentage, newPct },
        };
      }
    }
  }

  // -------------------------------------------------------------
  // Intent: Safe Skips / Bunk Allowance ("How many classes can I miss before 75%?")
  // -------------------------------------------------------------
  if (query.includes('how many classes can i miss') || query.includes('safe to miss') || query.includes('safe to bunk') || query.includes('can i skip') || query.includes('bunk allowance')) {
    if (matchedSubject) {
      const safe = calculateMissableClasses(matchedSubject.attendedClasses, matchedSubject.totalClasses, warningThreshold);
      const pct = matchedSubject.totalClasses > 0 ? (matchedSubject.attendedClasses / matchedSubject.totalClasses) * 100 : 100;

      return {
        intent: 'safe_skips_subject',
        headline: `${matchedSubject.name} Bunk Allowance`,
        details: safe > 0
          ? `You can safely miss ${safe} class${safe > 1 ? 'es' : ''} in ${matchedSubject.name} while maintaining at least ${warningThreshold}% attendance.`
          : `You cannot afford to miss any classes in ${matchedSubject.name}. Your current attendance is ${pct.toFixed(1)}% against the ${warningThreshold}% threshold.`,
        bulletPoints: [
          `Current Attendance: ${pct.toFixed(1)}% (${matchedSubject.attendedClasses}/${matchedSubject.totalClasses})`,
          `Safe Skips Available: ${safe}`,
          `Warning Threshold: ${warningThreshold}%`,
        ],
        suggestedFollowUps: [
          `What if I attend 5 more classes in ${matchedSubject.name}?`,
          `Which subject has the most absences?`,
        ],
        subjectName: matchedSubject.name,
      };
    } else {
      // Breakdown of safe skips across all subjects
      const items = subjects.map((s) => {
        const safe = calculateMissableClasses(s.attendedClasses, s.totalClasses, warningThreshold);
        const pct = s.totalClasses > 0 ? (s.attendedClasses / s.totalClasses) * 100 : 100;
        return `${s.name}: ${safe} safe skip${safe === 1 ? '' : 's'} (${pct.toFixed(1)}%)`;
      });

      return {
        intent: 'safe_skips_all',
        headline: 'Safe Skip Allowance Across Subjects',
        details: `Here is your current skip budget for each subject to remain at or above ${warningThreshold}%:`,
        bulletPoints: items,
        suggestedFollowUps: [
          'Which subject needs the most attention?',
          'Analyze my overall attendance.',
        ],
      };
    }
  }

  // -------------------------------------------------------------
  // Intent: Lowest / Highest Subject
  // -------------------------------------------------------------
  if (query.includes('lowest') || query.includes('least attendance') || query.includes('needs the most attention') || query.includes('at risk') || query.includes('why is my attendance in') || query.includes('so low')) {
    if (subjects.length === 0) {
      return {
        intent: 'no_subjects',
        headline: 'No Subjects Found',
        details: 'You haven\'t added any subjects yet. Add subjects in the Subjects tab to track attendance.',
      };
    }

    const sorted = [...subjects].sort((a, b) => {
      const aPct = a.totalClasses > 0 ? a.attendedClasses / a.totalClasses : 1;
      const bPct = b.totalClasses > 0 ? b.attendedClasses / b.totalClasses : 1;
      return aPct - bPct;
    });

    const lowest = sorted[0];
    const lowestPct = lowest.totalClasses > 0 ? (lowest.attendedClasses / lowest.totalClasses) * 100 : 0;
    const needed = calculateConsecutiveClassesNeeded(lowest.attendedClasses, lowest.totalClasses, warningThreshold);

    return {
      intent: 'lowest_subject',
      headline: `Lowest Attendance: ${lowest.name}`,
      details: `${lowest.name} is your lowest attendance subject at ${lowestPct.toFixed(1)}% (${lowest.attendedClasses}/${lowest.totalClasses} classes attended).`,
      bulletPoints: [
        `Current: ${lowest.attendedClasses} attended, ${lowest.totalClasses - lowest.attendedClasses} missed.`,
        lowestPct < warningThreshold
          ? `Action needed: You must attend your next ${needed} consecutive class${needed > 1 ? 'es' : ''} to reach ${warningThreshold}%.`
          : `Status: Currently above your ${warningThreshold}% goal.`,
      ],
      suggestedFollowUps: [
        `What if I attend the next 5 classes in ${lowest.name}?`,
        `Show my absences for ${lowest.name}`,
      ],
      subjectName: lowest.name,
    };
  }

  if (query.includes('highest') || query.includes('best attendance') || query.includes('most attendance')) {
    const sorted = [...subjects].sort((a, b) => {
      const aPct = a.totalClasses > 0 ? a.attendedClasses / a.totalClasses : 0;
      const bPct = b.totalClasses > 0 ? b.attendedClasses / b.totalClasses : 0;
      return bPct - aPct;
    });

    const highest = sorted[0];
    const pct = highest.totalClasses > 0 ? (highest.attendedClasses / highest.totalClasses) * 100 : 0;
    const safe = calculateMissableClasses(highest.attendedClasses, highest.totalClasses, warningThreshold);

    return {
      intent: 'highest_subject',
      headline: `Highest Attendance: ${highest.name}`,
      details: `${highest.name} has your best attendance record at ${pct.toFixed(1)}% (${highest.attendedClasses}/${highest.totalClasses} attended).`,
      bulletPoints: [
        `Attended: ${highest.attendedClasses} of ${highest.totalClasses} classes.`,
        `Skip Budget: You can safely miss ${safe} class${safe === 1 ? '' : 'es'} without dropping below ${warningThreshold}%.`,
      ],
      suggestedFollowUps: [
        `Which subject has my lowest attendance?`,
        `Analyze my overall attendance.`,
      ],
      subjectName: highest.name,
    };
  }

  // -------------------------------------------------------------
  // Intent: Specific Subject Summary ("How is my attendance in IP?")
  // -------------------------------------------------------------
  if (matchedSubject && (query.includes(normalizeName(matchedSubject.name)) || query.includes('that subject') || query.includes('this subject'))) {
    const sAttended = matchedSubject.attendedClasses;
    const sTotal = matchedSubject.totalClasses;
    const sPct = sTotal > 0 ? (sAttended / sTotal) * 100 : 0;
    const safe = calculateMissableClasses(sAttended, sTotal, warningThreshold);
    const needed = calculateConsecutiveClassesNeeded(sAttended, sTotal, warningThreshold);

    return {
      intent: 'subject_summary',
      headline: `${matchedSubject.name} Attendance`,
      details: `Your current attendance in ${matchedSubject.name} is ${sPct.toFixed(1)}% (${sAttended} attended out of ${sTotal} total classes).`,
      bulletPoints: [
        `Attended: ${sAttended} | Missed: ${sTotal - sAttended}`,
        sPct < warningThreshold
          ? `⚠️ Below ${warningThreshold}% target: Attend your next ${needed} classes consecutively.`
          : `✅ Safe: You can skip up to ${safe} class${safe === 1 ? '' : 'es'}.`,
      ],
      suggestedFollowUps: [
        `If I attend my next 5 classes in ${matchedSubject.name}?`,
        `Show my absences for ${matchedSubject.name}`,
      ],
      subjectName: matchedSubject.name,
    };
  }

  // -------------------------------------------------------------
  // Intent: Absences & Absent Dates ("Show me every day I was absent...")
  // -------------------------------------------------------------
  if (query.includes('absent') || query.includes('missed') || query.includes('absences')) {
    let absentEntries = attendance.filter((a) => a.status === 'absent');

    if (matchedSubject) {
      absentEntries = absentEntries.filter((a) => a.subjectId === matchedSubject.id);
    }

    // Check date filters in query (this month, this week, etc.)
    if (query.includes('this month')) {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      absentEntries = absentEntries.filter((a) => {
        const d = parseISO(a.date);
        return isWithinInterval(d, { start, end });
      });
    } else if (query.includes('this week')) {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(), { weekStartsOn: 1 });
      absentEntries = absentEntries.filter((a) => {
        const d = parseISO(a.date);
        return isWithinInterval(d, { start, end });
      });
    }

    if (absentEntries.length === 0) {
      return {
        intent: 'no_absences',
        headline: 'No Absences Recorded',
        details: matchedSubject
          ? `You have zero recorded absences for ${matchedSubject.name} in this period! Great job!`
          : `No recorded absences found for the requested period.`,
        suggestedFollowUps: ['Analyze my overall attendance.', 'Which subject has the most classes?'],
      };
    }

    const bullets = absentEntries.slice(0, 8).map((e) => {
      const s = subjects.find((sub) => sub.id === e.subjectId);
      const timeStr = e.time ? ` at ${e.time}` : '';
      return `${e.date}: ${s ? s.name : 'Unknown'}${timeStr}`;
    });

    if (absentEntries.length > 8) {
      bullets.push(`...and ${absentEntries.length - 8} more recorded absence(s).`);
    }

    return {
      intent: 'absent_list',
      headline: `${absentEntries.length} Recorded Absence${absentEntries.length > 1 ? 's' : ''}`,
      details: `Here are your recorded absences${matchedSubject ? ` for ${matchedSubject.name}` : ''}:`,
      bulletPoints: bullets,
      suggestedFollowUps: [
        'How many classes can I safely miss?',
        'Analyze my attendance overall.',
      ],
      subjectName: matchedSubject?.name,
    };
  }

  // -------------------------------------------------------------
  // Intent: Monthly or Weekly Comparison ("Compare my attendance this month with last month")
  // -------------------------------------------------------------
  if (query.includes('compare') || (query.includes('this month') && query.includes('last month'))) {
    const thisMonthStart = startOfMonth(new Date());
    const thisMonthEnd = endOfMonth(new Date());
    const lastMonthDate = subMonths(new Date(), 1);
    const lastMonthStart = startOfMonth(lastMonthDate);
    const lastMonthEnd = endOfMonth(lastMonthDate);

    const thisMonthEntries = attendance.filter((a) => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    });

    const lastMonthEntries = attendance.filter((a) => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
    });

    const tmPresent = thisMonthEntries.filter((a) => a.status === 'present').length;
    const tmAbsent = thisMonthEntries.filter((a) => a.status === 'absent').length;
    const tmTotal = tmPresent + tmAbsent;
    const tmPct = tmTotal > 0 ? (tmPresent / tmTotal) * 100 : 0;

    const lmPresent = lastMonthEntries.filter((a) => a.status === 'present').length;
    const lmAbsent = lastMonthEntries.filter((a) => a.status === 'absent').length;
    const lmTotal = lmPresent + lmAbsent;
    const lmPct = lmTotal > 0 ? (lmPresent / lmTotal) * 100 : 0;

    const diff = tmPct - lmPct;
    const trendText = diff > 0 ? `up by +${diff.toFixed(1)}%` : diff < 0 ? `down by ${diff.toFixed(1)}%` : 'unchanged';

    return {
      intent: 'monthly_comparison',
      headline: 'Attendance Comparison',
      details: `Your attendance this month is ${trendText} compared to last month:`,
      bulletPoints: [
        `This Month: ${tmPct.toFixed(1)}% (${tmPresent} attended, ${tmAbsent} missed)`,
        `Last Month: ${lmPct.toFixed(1)}% (${lmPresent} attended, ${lmAbsent} missed)`,
      ],
      suggestedFollowUps: ['Which subject needs the most attention?', 'Show my lowest attendance subject'],
    };
  }

  // -------------------------------------------------------------
  // Default / Overview: Comprehensive Attendance Analysis
  // -------------------------------------------------------------
  const { attended, absent, cancelled, totalClasses, percentage } = calculateOverallMetrics(subjects, attendance);
  const isHealthy = percentage >= warningThreshold;

  const lowSubjects = subjects.filter((s) => {
    const p = s.totalClasses > 0 ? (s.attendedClasses / s.totalClasses) * 100 : 100;
    return p < warningThreshold;
  });

  return {
    intent: 'general_analysis',
    headline: 'Overall Attendance Summary',
    details: `You have attended ${attended} out of ${totalClasses} total eligible classes (${percentage.toFixed(1)}% overall attendance).`,
    bulletPoints: [
      `Overall Status: ${isHealthy ? '✅ Safe (Above threshold)' : `⚠️ Below ${warningThreshold}% institutional threshold`}`,
      `Recorded Stats: ${attended} attended, ${absent} missed, ${cancelled} cancelled sessions`,
      lowSubjects.length > 0
        ? `Subjects needing attention: ${lowSubjects.map((s) => s.name).join(', ')}`
        : 'All individual subjects are currently above your warning threshold!',
    ],
    suggestedFollowUps: [
      'Which subject has my lowest attendance?',
      'How many classes can I safely miss?',
      'Show my absences this month.',
    ],
  };
}
