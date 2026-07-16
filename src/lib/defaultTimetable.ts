import { TimetableSlot, DayOfWeek } from '@/types/attendance';

export const generateDefaultTimetable = (): TimetableSlot[] => {
  const slots: TimetableSlot[] = [];
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const times = ['8:30', '9:20', '10:10', '11:20', '12:10', '1:30', '2:30', '3:20', '4:10', '5:10'];

  const scheduleMap: Record<string, Record<string, string>> = {
    'Monday': { '8:30': 'Honors', '10:10': 'Break', '12:10': 'Lunch', '1:30': 'Minor', '2:30': 'IP', '3:20': 'Adv Crypto', '4:10': 'DL' },
    'Tuesday': { '10:10': 'Break', '11:20': 'IP', '12:10': 'Lunch', '1:30': 'Minor', '2:30': 'DL', '3:20': 'Adv Crypto', '4:10': 'Honors' },
    'Wednesday': { '10:10': 'Break', '11:20': 'NLP', '12:10': 'Lunch', '1:30': 'Minor', '2:30': 'DL', '3:20': 'Adv Crypto', '4:10': 'Honors' },
    'Thursday': { '10:10': 'Break', '12:10': 'Lunch', '1:30': 'Minor', '2:30': 'Adv Crypto', '3:20': 'IP', '4:10': 'NLP', '5:10': 'Honors' },
    'Friday': { '10:10': 'Break', '12:10': 'Lunch', '2:30': 'DL', '3:20': 'NLP' },
    'Saturday': {} // Empty by default
  };

  days.forEach(day => {
    times.forEach(time => {
      const subjectOrBreak = scheduleMap[day]?.[time];
      
      if (subjectOrBreak) {
        const isBreak = subjectOrBreak === 'Break' || subjectOrBreak === 'Lunch';
        
        const slot: TimetableSlot = {
          id: `${day}-${time}`,
          day,
          startTime: time,
          isBreak: isBreak,
        };

        if (isBreak) {
          slot.breakLabel = subjectOrBreak;
        } else {
          slot.subjectName = subjectOrBreak;
        }
        
        slots.push(slot);
      }
    });
  });

  return slots;
};
