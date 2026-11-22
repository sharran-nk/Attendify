import { describe, it, expect } from 'vitest';
import { generateDefaultTimetable } from './defaultTimetable';

describe('generateDefaultTimetable', () => {
  const slots = generateDefaultTimetable();

  it('produces slots with unique "Day-time" ids', () => {
    const ids = slots.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    slots.forEach((s) => expect(s.id).toBe(`${s.day}-${s.startTime}`));
  });

  it('leaves Saturday empty and fills Monday to Friday', () => {
    expect(slots.filter((s) => s.day === 'Saturday')).toHaveLength(0);
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((d) =>
      expect(slots.some((s) => s.day === d)).toBe(true)
    );
  });

  it('marks Break and Lunch as breaks with a label and no subject', () => {
    const breaks = slots.filter((s) => s.isBreak);
    expect(breaks.length).toBeGreaterThan(0);
    breaks.forEach((s) => {
      expect(['Break', 'Lunch']).toContain(s.breakLabel);
      expect(s.subjectName).toBeUndefined();
    });
  });

  it('gives every non-break slot a subject name and no break label', () => {
    slots
      .filter((s) => !s.isBreak)
      .forEach((s) => {
        expect(s.subjectName).toBeTruthy();
        expect(s.breakLabel).toBeUndefined();
      });
  });

  it('returns a fresh, equal array on every call', () => {
    expect(generateDefaultTimetable()).not.toBe(slots);
    expect(generateDefaultTimetable()).toEqual(slots);
  });
});
