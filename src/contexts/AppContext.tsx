import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subject, AttendanceEntry, Task, CoursePlan, AppSettings } from '@/types/attendance';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch
} from 'firebase/firestore';
import { toast } from 'sonner';

interface AppContextType {
  subjects: Subject[];
  attendance: AttendanceEntry[];
  tasks: Task[];
  coursePlans: CoursePlan[];
  settings: AppSettings;
  isSyncing: boolean;

  // Subject actions
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // Attendance actions
  addAttendance: (entry: Omit<AttendanceEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateAttendance: (id: string, updates: Partial<AttendanceEntry>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;

  // Course plan actions
  addCoursePlan: (plan: Omit<CoursePlan, 'id' | 'uploadedAt'>) => Promise<void>;
  deleteCoursePlan: (id: string) => Promise<void>;

  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
  attendanceWarningThreshold: 75,
  darkMode: false,
  reminderEnabled: false,
  reminderTime: "08:00",
};

const subjectColors = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
  '#5856D6', '#00C7BE', '#FF2D55', '#FF6482', '#32ADE6'
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

const STORAGE_KEY = 'attendance_app_v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-migration from localStorage on first login
  useEffect(() => {
    const migrateData = async () => {
      if (!user) return;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          console.log("Migrating local data to Firestore...");
          setIsSyncing(true);
          const parsed = JSON.parse(stored);
          const batch = writeBatch(db);
          
          const uid = user.id;

          // Migrate Settings
          if (parsed.settings) {
            batch.set(doc(db, 'users', uid, 'settings', 'current'), parsed.settings, { merge: true });
          }

          // Migrate Subjects
          (parsed.subjects || []).forEach((sub: Subject) => {
            batch.set(doc(db, 'users', uid, 'subjects', sub.id), sub);
          });

          // Migrate Attendance
          (parsed.attendance || []).forEach((att: AttendanceEntry) => {
            batch.set(doc(db, 'users', uid, 'attendance', att.id), att);
          });

          // Migrate Tasks
          (parsed.tasks || []).forEach((task: Task) => {
            batch.set(doc(db, 'users', uid, 'tasks', task.id), task);
          });

          // Migrate Course Plans
          (parsed.coursePlans || []).forEach((cp: CoursePlan) => {
            batch.set(doc(db, 'users', uid, 'coursePlans', cp.id), cp);
          });

          await batch.commit();
          localStorage.removeItem(STORAGE_KEY);
          console.log("Migration successful");
        } catch (e) {
          console.error("Migration failed", e);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    migrateData();
  }, [user]);

  // Set up real-time listeners
  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setAttendance([]);
      setTasks([]);
      setCoursePlans([]);
      setSettings(defaultSettings);
      return;
    }

    const uid = user.id;
    setIsSyncing(true);

    const unsubSettings = onSnapshot(doc(db, 'users', uid, 'settings', 'current'), (doc) => {
      if (doc.exists()) {
        setSettings({ ...defaultSettings, ...(doc.data() as AppSettings) });
      } else {
        setSettings(defaultSettings);
      }
    }, (error) => {
      console.error("Settings sync error:", error);
      toast.error("Database permission denied. Check your Firestore Security Rules.");
    });

    const unsubSubjects = onSnapshot(collection(db, 'users', uid, 'subjects'), (snap) => {
      setSubjects(snap.docs.map(d => d.data() as Subject));
    }, (error) => console.error("Subjects sync error:", error));

    const unsubAttendance = onSnapshot(collection(db, 'users', uid, 'attendance'), (snap) => {
      setAttendance(snap.docs.map(d => d.data() as AttendanceEntry));
    }, (error) => console.error("Attendance sync error:", error));

    const unsubTasks = onSnapshot(collection(db, 'users', uid, 'tasks'), (snap) => {
      setTasks(snap.docs.map(d => d.data() as Task));
    }, (error) => console.error("Tasks sync error:", error));

    const unsubCoursePlans = onSnapshot(collection(db, 'users', uid, 'coursePlans'), (snap) => {
      setCoursePlans(snap.docs.map(d => d.data() as CoursePlan));
    }, (error) => console.error("Course plans sync error:", error));

    // Mark syncing as complete after a short delay (once initial reads finish)
    setTimeout(() => setIsSyncing(false), 1000);

    return () => {
      unsubSettings();
      unsubSubjects();
      unsubAttendance();
      unsubTasks();
      unsubCoursePlans();
    };
  }, [user]);

  // -----------------------------------------------------
  // Firestore Write Actions
  // -----------------------------------------------------
  const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const newId = generateId();
      const newSubject: Subject = {
        ...subject,
        id: newId,
        color: subject.color || subjectColors[subjects.length % subjectColors.length],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.id, 'subjects', newId), newSubject);
      toast.success("Subject added");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add subject: " + error.message);
    }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id, 'subjects', id), updates);
  };

  const deleteSubject = async (id: string) => {
    if (!user) return;
    const batch = writeBatch(db);
    
    // Delete subject
    batch.delete(doc(db, 'users', user.id, 'subjects', id));

    // Delete related attendance
    attendance.filter(a => a.subjectId === id).forEach(a => {
      batch.delete(doc(db, 'users', user.id, 'attendance', a.id));
    });

    // Delete related tasks
    tasks.filter(t => t.subjectId === id).forEach(t => {
      batch.delete(doc(db, 'users', user.id, 'tasks', t.id));
    });

    // Delete related course plans
    coursePlans.filter(cp => cp.subjectId === id).forEach(cp => {
      batch.delete(doc(db, 'users', user.id, 'coursePlans', cp.id));
    });

    await batch.commit();
  };

  const addAttendance = async (entry: Omit<AttendanceEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newId = generateId();
    const newEntry: AttendanceEntry = {
      ...entry,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.id, 'attendance', newId), newEntry);

    // Update subject counts
    const subject = subjects.find(s => s.id === entry.subjectId);
    if (subject) {
      const subjectRef = doc(db, 'users', user.id, 'subjects', entry.subjectId);
      if (entry.status === 'present') {
        batch.update(subjectRef, {
          totalClasses: subject.totalClasses + 1,
          attendedClasses: subject.attendedClasses + 1,
        });
      } else if (entry.status === 'absent') {
        batch.update(subjectRef, {
          totalClasses: subject.totalClasses + 1,
        });
      }
    }
    await batch.commit();
  };

  const updateAttendance = async (id: string, updates: Partial<AttendanceEntry>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id, 'attendance', id), updates);
  };

  const deleteAttendance = async (id: string) => {
    if (!user) return;
    const entry = attendance.find(a => a.id === id);
    if (!entry) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', user.id, 'attendance', id));

    const subject = subjects.find(s => s.id === entry.subjectId);
    if (subject) {
      const subjectRef = doc(db, 'users', user.id, 'subjects', entry.subjectId);
      if (entry.status === 'present') {
        batch.update(subjectRef, {
          totalClasses: Math.max(0, subject.totalClasses - 1),
          attendedClasses: Math.max(0, subject.attendedClasses - 1),
        });
      } else if (entry.status === 'absent') {
        batch.update(subjectRef, {
          totalClasses: Math.max(0, subject.totalClasses - 1),
        });
      }
    }
    await batch.commit();
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newId = generateId();
    const newTask: Task = {
      ...task,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.id, 'tasks', newId), newTask);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id, 'tasks', id), updates);
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'tasks', id));
  };

  const toggleTaskComplete = async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateDoc(doc(db, 'users', user.id, 'tasks', id), {
      completed: !task.completed
    });
  };

  const addCoursePlan = async (plan: Omit<CoursePlan, 'id' | 'uploadedAt'>) => {
    if (!user) return;
    const newId = generateId();
    const newPlan: CoursePlan = {
      ...plan,
      id: newId,
      uploadedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.id, 'coursePlans', newId), newPlan);
  };

  const deleteCoursePlan = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'coursePlans', id));
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!user) return;
    // We update local state optimistically here because sometimes settings are needed immediately for UI renders
    setSettings(prev => ({ ...prev, ...updates }));
    
    const settingsRef = doc(db, 'users', user.id, 'settings', 'current');
    await setDoc(settingsRef, updates, { merge: true });
  };

  return (
    <AppContext.Provider
      value={{
        subjects,
        attendance,
        tasks,
        coursePlans,
        settings,
        isSyncing,
        addSubject,
        updateSubject,
        deleteSubject,
        addAttendance,
        updateAttendance,
        deleteAttendance,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addCoursePlan,
        deleteCoursePlan,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
