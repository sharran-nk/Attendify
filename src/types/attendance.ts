export interface ExamMarks {
  ct1?: number;
  ct2?: number;
  project?: number; // Added project field
  endSem?: number;
  ct1Max?: number;
  ct2Max?: number;
  projectMax?: number; // Added project max field
  endSemMax?: number;
}

export interface Subject {
  id: string;
  name: string;
  instructor?: string;
  credits: number;
  totalClasses: number;
  attendedClasses: number;
  color: string;
  examMarks?: ExamMarks;
  createdAt: string;
}

export interface AttendanceEntry {
  id: string;
  subjectId: string;
  date: string;
  status: 'present' | 'absent' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  createdAt: string;
}

export interface CoursePlan {
  id: string;
  subjectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // Base64 encoded
  uploadedAt: string;
}

export interface AppSettings {
  attendanceWarningThreshold: number;
  darkMode: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string;
  timetableTimes?: string[]; // Array of time strings, e.g., ["8:30", "9:20", ...]
  timetableImage?: string; // Base64 image
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSlot {
  id: string; // e.g. "Monday-8:30"
  day: DayOfWeek;
  startTime: string; // "8:30"
  isBreak: boolean; 
  breakLabel?: string; 
  subjectId?: string; // Links to a subject, can be matched by name or ID
  subjectName?: string; // Fallback string if subjectId isn't linked yet
}
