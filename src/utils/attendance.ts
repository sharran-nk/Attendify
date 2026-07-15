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
    if (totalClasses === 0) return 0;

    const threshold = thresholdPercentage / 100;

    // Logic: Attended / (Total + Missable) >= Threshold
    // Attended / Threshold >= Total + Missable
    // Missable <= (Attended / Threshold) - Total

    const maxTotalClasses = attendedClasses / threshold;
    const missable = Math.floor(maxTotalClasses - totalClasses);

    return Math.max(0, missable);
}
