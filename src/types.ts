export interface Subject {
  id: string;
  name: string;
  color: string; // hex color code
  targetHours: number;
}

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

export interface TimerSession {
  id: string;
  duration: number; // in seconds
  date: string; // ISO or YYYY-MM-DD
  subjectId: string;
  type: 'focus' | 'short_break' | 'long_break';
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
