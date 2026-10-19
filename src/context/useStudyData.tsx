import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Subject, 
  Chapter, 
  ChapterProgress, 
  StudySession, 
  Todo 
} from '../types';
import { SEED_SUBJECTS, SEED_CHAPTERS } from '../data/seedData';

// Helper for clean, local YYYY-MM-DD date keys
export const getLocalDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Initial sample sessions so initial views render nicely
const DEFAULT_SESSIONS: StudySession[] = [
  {
    id: 'seed-sess-1',
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    durationMin: 75,
    duration: 75 * 60,
    subjectId: 'physics',
    chapterId: 'phy-2', // Kinematics
    source: 'timer',
    type: 'focus'
  },
  {
    id: 'seed-sess-2',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // Yesterday
    startTime: new Date(Date.now() - 86400000 - 3600000 * 2).toISOString(),
    durationMin: 90,
    duration: 90 * 60,
    subjectId: 'chemistry',
    chapterId: 'chem-p-1', // Mole Concept
    source: 'timer',
    type: 'focus'
  },
  {
    id: 'seed-sess-3',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), // 2 days ago
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMin: 80,
    duration: 80 * 60,
    subjectId: 'maths',
    chapterId: 'math-4', // Quadratic Equation
    source: 'manual',
    type: 'focus'
  }
];

const DEFAULT_TODOS: Todo[] = [
  {
    id: 'todo-1',
    text: 'Solve 20 PYQ problems from Kinematics',
    done: false,
    createdAt: new Date().toISOString(),
    subjectId: 'physics',
    chapterId: 'phy-2'
  },
  {
    id: 'todo-2',
    text: 'Review Mole Concept stoichiometry formulas',
    done: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    subjectId: 'chemistry',
    chapterId: 'chem-p-1'
  },
  {
    id: 'todo-3',
    text: 'Complete Quadratic Equations practice sheet',
    done: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    subjectId: 'maths',
    chapterId: 'math-4'
  }
];

interface SubjectStats {
  completedChapters: number;
  totalChapters: number;
  avgPercentDone: number;
  totalHours: number;
}

interface StudyDataContextType {
  subjects: Subject[];
  chapters: Chapter[];
  progress: Record<string, ChapterProgress>;
  sessions: StudySession[];
  todos: Todo[];
  
  // Derived values
  dailyMinutes: Record<string, number>;
  todayTotalMinutes: number;
  todayTotalHours: { hrs: number; mins: number; decimal: number };
  streak: number;
  chapterHours: Record<string, number>;
  subjectStats: Record<string, SubjectStats>;

  // Progress helpers
  isChapterCompleted: (chapterId: string) => boolean;
  getChapterUnmetReason: (chapterId: string) => string | null;

  // Actions
  updateChapterProgress: (chapterId: string, updates: Partial<Omit<ChapterProgress, 'chapterId' | 'completed'>>) => void;
  addSession: (session: Omit<StudySession, 'id'>) => void;
  deleteSession: (id: string) => void;
  addTodo: (todo: { text: string; subjectId?: string; chapterId?: string }) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

const StudyDataContext = createContext<StudyDataContextType | null>(null);

export const StudyDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core State
  const subjects = useMemo(() => SEED_SUBJECTS, []);
  const chapters = useMemo(() => SEED_CHAPTERS, []);

  // Chapter Progress
  const [progress, setProgress] = useState<Record<string, ChapterProgress>>(() => {
    try {
      const saved = localStorage.getItem('studyx_chapter_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial seed progress for a few chapters to make initial presentation shine
    const initial: Record<string, ChapterProgress> = {};
    initial['phy-1'] = {
      chapterId: 'phy-1',
      percentDone: 100,
      pyq: { 2022: true, 2023: true, 2024: true, 2025: false, 2026: false },
      notes: 'Units conversions & dimensions formulas memorized.'
    };
    initial['phy-2'] = {
      chapterId: 'phy-2',
      percentDone: 85,
      pyq: { 2022: true, 2023: true, 2024: false, 2025: false, 2026: false },
      notes: 'Relative motion and projectile trajectory analysis.'
    };
    initial['chem-p-1'] = {
      chapterId: 'chem-p-1',
      percentDone: 95,
      pyq: { 2022: true, 2023: true, 2024: true, 2025: true, 2026: false },
      notes: 'Limiting reagent problems practiced.'
    };
    return initial;
  });

  // Sessions
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem('studyx_sessions');
      if (saved) return JSON.parse(saved);

      // Check legacy study_sessions
      const legacy = localStorage.getItem('study_sessions');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => ({
            id: s.id || `sess-${Date.now()}`,
            date: (s.date || new Date().toISOString()).slice(0, 10),
            startTime: s.date || new Date().toISOString(),
            durationMin: s.durationMin || Math.round((s.duration || 1500) / 60),
            duration: s.duration || 1500,
            subjectId: s.subjectId || 'physics',
            chapterId: s.chapterId,
            source: s.source || 'timer',
            type: s.type || 'focus'
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SESSIONS;
  });

  // Todos
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem('studyx_todos');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TODOS;
  });

  // Persist State Changes
  useEffect(() => {
    localStorage.setItem('studyx_chapter_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('studyx_sessions', JSON.stringify(sessions));
    // Keep legacy key synced for other components
    localStorage.setItem('study_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('studyx_todos', JSON.stringify(todos));
  }, [todos]);

  // -------------------------------------------------------------
  // DERIVED COMPUTATIONS
  // -------------------------------------------------------------

  // Helper: Is Chapter Completed?
  // Rule: completed = percentDone >= 90 and at least one PYQ year ticked
  const isChapterCompleted = useCallback((chapterId: string): boolean => {
    const cp = progress[chapterId];
    if (!cp) return false;
    const hasPyq = !!(cp.pyq && (cp.pyq[2022] || cp.pyq[2023] || cp.pyq[2024] || cp.pyq[2025] || cp.pyq[2026]));
    return cp.percentDone >= 90 && hasPyq;
  }, [progress]);

  const getChapterUnmetReason = useCallback((chapterId: string): string | null => {
    const cp = progress[chapterId];
    const percent = cp?.percentDone || 0;
    const hasPyq = !!(cp?.pyq && (cp.pyq[2022] || cp.pyq[2023] || cp.pyq[2024] || cp.pyq[2025] || cp.pyq[2026]));

    if (percent >= 90 && hasPyq) {
      return null; // Completed!
    }
    if (percent >= 90 && !hasPyq) {
      return 'Needs at least 1 PYQ year';
    }
    if (percent < 90 && hasPyq) {
      return 'Needs ≥90% done';
    }
    return 'Needs ≥90% & 1 PYQ';
  }, [progress]);

  // 1. dailyMinutes[date] = sum of StudySession.durationMin for that date
  const dailyMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const dateKey = (s.date || '').slice(0, 10);
      if (!dateKey) return;
      const min = s.durationMin || (s.duration ? Math.round(s.duration / 60) : 0);
      map[dateKey] = (map[dateKey] || 0) + min;
    });
    return map;
  }, [sessions]);

  // 2. todayTotal = dailyMinutes for today
  const todayTotalMinutes = useMemo(() => {
    const todayStr = getLocalDateKey();
    return dailyMinutes[todayStr] || 0;
  }, [dailyMinutes]);

  const todayTotalHours = useMemo(() => {
    const hrs = Math.floor(todayTotalMinutes / 60);
    const mins = todayTotalMinutes % 60;
    const decimal = Number((todayTotalMinutes / 60).toFixed(1));
    return { hrs, mins, decimal };
  }, [todayTotalMinutes]);

  // 3. streak = consecutive days ending today (or yesterday, if today has no session yet) with dailyMinutes > 0
  const streak = useMemo(() => {
    const todayStr = getLocalDateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterdayDate);

    const todayMin = dailyMinutes[todayStr] || 0;
    const yesterdayMin = dailyMinutes[yesterdayStr] || 0;

    let cursorDate: Date;
    if (todayMin > 0) {
      cursorDate = new Date();
    } else if (yesterdayMin > 0) {
      cursorDate = yesterdayDate;
    } else {
      return 0;
    }

    let count = 0;
    // Iterate back up to 365 days max to prevent infinite loops
    for (let i = 0; i < 365; i++) {
      const dateKey = getLocalDateKey(cursorDate);
      if ((dailyMinutes[dateKey] || 0) > 0) {
        count++;
        cursorDate.setDate(cursorDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [dailyMinutes]);

  // 4. Hours per Chapter
  const chapterHours = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.chapterId) {
        const min = s.durationMin || (s.duration ? Math.round(s.duration / 60) : 0);
        map[s.chapterId] = Number(((map[s.chapterId] || 0) + min / 60).toFixed(1));
      }
    });
    return map;
  }, [sessions]);

  // 5. Subject Stats
  const subjectStats = useMemo(() => {
    const stats: Record<string, SubjectStats> = {};

    subjects.forEach((sub) => {
      const subChapters = chapters.filter((c) => c.subjectId === sub.id);
      let completedCount = 0;
      let totalPercent = 0;

      subChapters.forEach((c) => {
        const cp = progress[c.id];
        const percent = cp?.percentDone || 0;
        totalPercent += percent;
        if (isChapterCompleted(c.id)) {
          completedCount++;
        }
      });

      // Total hours studied for this subject
      const subSessions = sessions.filter((s) => s.subjectId === sub.id);
      const subMin = subSessions.reduce((sum, s) => {
        return sum + (s.durationMin || (s.duration ? Math.round(s.duration / 60) : 0));
      }, 0);

      stats[sub.id] = {
        completedChapters: completedCount,
        totalChapters: subChapters.length,
        avgPercentDone: subChapters.length > 0 ? Math.round(totalPercent / subChapters.length) : 0,
        totalHours: Number((subMin / 60).toFixed(1))
      };
    });

    return stats;
  }, [subjects, chapters, progress, sessions, isChapterCompleted]);

  // -------------------------------------------------------------
  // MUTATION ACTIONS
  // -------------------------------------------------------------

  // Update Chapter Progress + Interconnection Rule 3:
  // Completing the chapter can auto-tick linked to-dos.
  const updateChapterProgress = useCallback((
    chapterId: string, 
    updates: Partial<Omit<ChapterProgress, 'chapterId' | 'completed'>>
  ) => {
    setProgress((prev) => {
      const current = prev[chapterId] || {
        chapterId,
        percentDone: 0,
        pyq: { 2022: false, 2023: false, 2024: false, 2025: false, 2026: false },
        notes: ''
      };

      const updatedProgress: ChapterProgress = {
        ...current,
        ...updates,
        pyq: {
          ...current.pyq,
          ...(updates.pyq || {})
        }
      };

      // Check if newly completed
      const wasCompleted = current.percentDone >= 90 && Object.values(current.pyq || {}).some(Boolean);
      const isNowCompleted = updatedProgress.percentDone >= 90 && Object.values(updatedProgress.pyq || {}).some(Boolean);

      // Auto-tick linked todos if newly completed
      if (!wasCompleted && isNowCompleted) {
        setTodos((prevTodos) => 
          prevTodos.map((t) => t.chapterId === chapterId ? { ...t, done: true } : t)
        );
      }

      return {
        ...prev,
        [chapterId]: updatedProgress
      };
    });
  }, []);

  // Add Session
  const addSession = useCallback((newSession: Omit<StudySession, 'id'>) => {
    const durationMin = newSession.durationMin || (newSession.duration ? Math.round(newSession.duration / 60) : 0);
    const sessionObj: StudySession = {
      ...newSession,
      id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: newSession.date ? newSession.date.slice(0, 10) : getLocalDateKey(),
      startTime: newSession.startTime || new Date().toISOString(),
      durationMin: Math.max(1, durationMin),
      duration: newSession.duration || durationMin * 60,
      source: newSession.source || 'timer',
      type: newSession.type || 'focus'
    };

    setSessions((prev) => [sessionObj, ...prev]);
  }, []);

  // Delete Session
  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Todo CRUD (sorted: incomplete first, then newest)
  const addTodo = useCallback((todoItem: { text: string; subjectId?: string; chapterId?: string }) => {
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: todoItem.text.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      subjectId: todoItem.subjectId,
      chapterId: todoItem.chapterId
    };

    setTodos((prev) => [newTodo, ...prev]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sorted todos: Incomplete first, then newest
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1; // Incomplete first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
    });
  }, [todos]);

  const value = useMemo(() => ({
    subjects,
    chapters,
    progress,
    sessions,
    todos: sortedTodos,
    dailyMinutes,
    todayTotalMinutes,
    todayTotalHours,
    streak,
    chapterHours,
    subjectStats,
    isChapterCompleted,
    getChapterUnmetReason,
    updateChapterProgress,
    addSession,
    deleteSession,
    addTodo,
    toggleTodo,
    deleteTodo
  }), [
    subjects,
    chapters,
    progress,
    sessions,
    sortedTodos,
    dailyMinutes,
    todayTotalMinutes,
    todayTotalHours,
    streak,
    chapterHours,
    subjectStats,
    isChapterCompleted,
    getChapterUnmetReason,
    updateChapterProgress,
    addSession,
    deleteSession,
    addTodo,
    toggleTodo,
    deleteTodo
  ]);

  return (
    <StudyDataContext.Provider value={value}>
      {children}
    </StudyDataContext.Provider>
  );
};

export const useStudyData = () => {
  const context = useContext(StudyDataContext);
  if (!context) {
    throw new Error('useStudyData must be used within a StudyDataProvider');
  }
  return context;
};
