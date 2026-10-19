export interface Subject {
  id: string; // 'physics' | 'chemistry' | 'maths' or custom
  name: string; // Physics / Chemistry / Maths
  color?: string; // hex color code
  targetHours?: number;
}

export type ChemistryGroup = 'Physical' | 'Inorganic' | 'Organic';

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  group?: ChemistryGroup; // Physical / Inorganic / Organic (Chemistry only)
  order: number;
}

export interface ChapterPYQ {
  2022: boolean;
  2023: boolean;
  2024: boolean;
  2025: boolean;
  2026: boolean;
}

export interface ChapterProgress {
  chapterId: string;
  percentDone: number; // 0 - 100
  pyq: ChapterPYQ;
  notes: string;
  completed?: boolean; // derived: percentDone >= 90 and at least one PYQ year ticked
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string or time string
  durationMin: number; // duration in minutes
  subjectId: string;
  chapterId?: string; // optional
  source: 'timer' | 'manual';
  notes?: string;
  // Backwards compatibility with TimerSession
  duration?: number; // duration in seconds
  type?: 'focus' | 'short_break' | 'long_break';
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string; // ISO
  subjectId?: string;
  chapterId?: string;
}

// Backwards compatibility for existing views
export type TimerSession = StudySession;

export interface StudyLog {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  order: number;
  estimatedDuration?: number; // in minutes
  chapterId?: string;
}

export interface TestMark {
  id: string;
  subjectId: string;
  testName: string;
  marks?: number;
  maxMarks?: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  status?: 'upcoming' | 'completed';
}

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  subjectId?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null; // Date ISO string or null
  icon: string; // Lucide icon identifier
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'amoled';
  accentColor: string; // hex or tailwind class name
  pomodoroFocus: number; // in minutes
  pomodoroShortBreak: number; // in minutes
  pomodoroLongBreak: number; // in minutes
  notificationsEnabled: boolean;
  alarmSound: 'digital' | 'bell' | 'zen' | 'off';
}
