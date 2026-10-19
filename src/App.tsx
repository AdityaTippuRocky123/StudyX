import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Timer as TimerIcon,
  BookOpen,
  CheckSquare,
  FileText,
  TrendingUp,
  Calendar as CalendarIcon,
  Award,
  Settings as SettingsIcon,
  Search,
  Sparkles,
  Command,
  Undo2,
  ChevronRight,
  Flame,
  Clock,
  LogOut,
  Moon,
  User,
  Loader2,
  Trophy
} from 'lucide-react';

import { Subject, StudyLog, Task, TestMark, Goal, TimerSession, AppSettings, Achievement, CalendarNote } from './types';
import Confetti, { triggerConfetti } from './components/Confetti';
import Dashboard from './components/Dashboard';
import Timer from './components/Timer';
import StudyLogs from './components/StudyLogs';
import TodoList from './components/TodoList';
import Subjects from './components/Subjects';
import TestMarks from './components/TestMarks';
import CalendarView from './components/CalendarView';
import Analytics from './components/Analytics';
import GoalsAchievements from './components/GoalsAchievements';
import Settings from './components/Settings';
import StudyXLogo from './components/StudyXLogo';
import Login from './components/Login';
import Signup from './components/Signup';
import Leaderboard from './components/Leaderboard';
import { useStudyData } from './context/useStudyData';
import { SEED_SUBJECTS } from './data/seedData';

// Default initial state data for Phase 1
const DEFAULT_SUBJECTS: Subject[] = SEED_SUBJECTS;

const DEFAULT_LOGS: StudyLog[] = [
  { id: 'log-1', subjectId: 'sub-1', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().slice(0, 10), hours: 2.5, notes: 'Studied limit theorems and practicing sequences.' },
  { id: 'log-2', subjectId: 'sub-2', date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 10), hours: 3.0, notes: 'Reviewed CPU scheduling policies & thread states.' },
  { id: 'log-3', subjectId: 'sub-3', date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().slice(0, 10), hours: 1.8, notes: 'Explored neural networks propagation algorithms.' },
];

const DEFAULT_SESSIONS: TimerSession[] = [
  { id: 'sess-1', duration: 1500, date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), subjectId: 'sub-2', type: 'focus' },
  { id: 'sess-2', duration: 3000, date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), subjectId: 'sub-3', type: 'focus' },
];

const DEFAULT_TASKS: Task[] = [
  { id: 'task-1', title: 'Complete Calculus Assignment 4', subjectId: 'sub-1', priority: 'high', dueDate: new Date().toISOString().slice(0, 10), completed: false, order: 0 },
  { id: 'task-2', title: 'Implement mutex locks simulation', subjectId: 'sub-2', priority: 'medium', dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10), completed: false, order: 1 },
  { id: 'task-3', title: 'Summarize neural attention research paper', subjectId: 'sub-3', priority: 'low', dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10), completed: false, order: 2 },
  { id: 'task-4', title: 'Prepare OS midterm cheat sheet', subjectId: 'sub-2', priority: 'high', dueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().slice(0, 10), completed: true, order: 3 },
];

const DEFAULT_TESTS: TestMark[] = [
  { id: 'test-1', subjectId: 'sub-1', testName: 'Calculus Quiz 1', marks: 18, maxMarks: 20, date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().slice(0, 10) },
  { id: 'test-2', subjectId: 'sub-2', testName: 'OS Midterm 1', marks: 44, maxMarks: 50, date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 10) },
];

const DEFAULT_GOALS: Goal[] = [
  { id: 'goal-1', title: 'Excel OS Curriculum', targetValue: 20, currentValue: 4.5, unit: 'hours', dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10), completed: false },
  { id: 'goal-2', title: 'Complete calculus homework chapters', targetValue: 4, currentValue: 1, unit: 'chapters', dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10), completed: false },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'First Steps', description: 'Log your first study hour.', unlockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), icon: 'first_step' },
  { id: 'ach-2', title: 'Deep Focus', description: 'Log a focused timer session.', unlockedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), icon: 'deep_focus' },
  { id: 'ach-3', title: 'Dedicated Learn', description: 'Reach a study streak of 3 consecutive days.', unlockedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), icon: 'dedicated' },
  { id: 'ach-4', title: 'Grade Peak', description: 'Score 90%+ on any logged exam.', unlockedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), icon: 'grade_peak' },
  { id: 'ach-5', title: 'Goal Crusher', description: 'Complete a personalized study goal.', unlockedAt: null, icon: 'goal_crusher' },
  { id: 'ach-6', title: 'Syllabus Master', description: 'Register 3 or more subjects.', unlockedAt: new Date().toISOString(), icon: 'omniscient' },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#EAB308',
  pomodoroFocus: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  notificationsEnabled: false,
  alarmSound: 'bell'
};

export default function App() {
  const { streak, todayTotalHours, addSession, deleteSession, subjects: studySubjects } = useStudyData();

  // Authentication states
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('studyx_auth_token'));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataLoadedFromCloud, setDataLoadedFromCloud] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // Navigation states
  const [view, setView] = useState('dashboard');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Logout callback
  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      console.error('Error logging out from backend:', e);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('studyx_auth_token');
    localStorage.removeItem('studyx_auth_user');
    setDataLoadedFromCloud(false);
    setView('dashboard'); // reset view to dashboard
    setAuthView('login');
  };

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setUser(data.user);
        } else {
          // Token is invalid or expired
          handleLogout();
        }
      } catch (err) {
        console.error('Error verifying authentication token:', err);
        // On transient errors, avoid logging out unless token is invalid
        // But for safe/clean recovery we can keep it or clear it if 401 is received
      } finally {
        setIsAuthLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    setToken(newToken);
    setUser(loggedInUser);
    localStorage.setItem('studyx_auth_token', newToken);
    localStorage.setItem('studyx_auth_user', JSON.stringify(loggedInUser));
    setView('dashboard');
  };

  // Primary Data State
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('study_subjects');
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [logs, setLogs] = useState<StudyLog[]>(() => {
    const saved = localStorage.getItem('study_logs');
    return saved ? JSON.parse(saved) : DEFAULT_LOGS;
  });

  const [sessions, setSessions] = useState<TimerSession[]>(() => {
    const saved = localStorage.getItem('study_sessions');
    return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('study_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [tests, setTests] = useState<TestMark[]>(() => {
    const saved = localStorage.getItem('study_tests');
    return saved ? JSON.parse(saved) : DEFAULT_TESTS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('study_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('study_achievements');
    return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('study_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [notes, setNotes] = useState<CalendarNote[]>(() => {
    const saved = localStorage.getItem('study_notes');
    return saved ? JSON.parse(saved) : [];
  });

  // Undo Delete Stack
  const [lastDeletedItem, setLastDeletedItem] = useState<{
    type: 'log' | 'task' | 'test' | 'goal' | 'subject';
    data: any;
  } | null>(null);

  const [showUndoToast, setShowUndoToast] = useState(false);

  // Sync to LocalStorage and Cloud
  useEffect(() => {
    localStorage.setItem('study_subjects', JSON.stringify(subjects));
    localStorage.setItem('study_logs', JSON.stringify(logs));
    localStorage.setItem('study_sessions', JSON.stringify(sessions));
    localStorage.setItem('study_tasks', JSON.stringify(tasks));
    localStorage.setItem('study_tests', JSON.stringify(tests));
    localStorage.setItem('study_goals', JSON.stringify(goals));
    localStorage.setItem('study_achievements', JSON.stringify(achievements));
    localStorage.setItem('study_settings', JSON.stringify(settings));
    localStorage.setItem('study_notes', JSON.stringify(notes));

    if (dataLoadedFromCloud && token) {
      const timerId = setTimeout(() => {
        fetch('/api/user/data', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subjects, logs, sessions, tasks, tests, goals, achievements, settings, notes
          })
        }).catch(err => console.error('Failed to sync to cloud:', err));
      }, 1500);
      return () => clearTimeout(timerId);
    }
  }, [subjects, logs, sessions, tasks, tests, goals, achievements, settings, notes, dataLoadedFromCloud, token]);

  // Fetch initial data from cloud
  useEffect(() => {
    if (!user || !token) return;

    const fetchCloudData = async () => {
      setIsDataLoading(true);
      try {
        const response = await fetch('/api/user/data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data) {
          if (data.subjects && data.subjects.length > 0) setSubjects(data.subjects);
          if (data.logs && data.logs.length > 0) setLogs(data.logs);
          if (data.sessions && data.sessions.length > 0) setSessions(data.sessions);
          if (data.tasks && data.tasks.length > 0) setTasks(data.tasks);
          if (data.tests && data.tests.length > 0) setTests(data.tests);
          if (data.goals && data.goals.length > 0) setGoals(data.goals);
          if (data.achievements && data.achievements.length > 0) setAchievements(data.achievements);
          if (data.settings && Object.keys(data.settings).length > 0) setSettings(data.settings);
          if (data.notes && data.notes.length > 0) setNotes(data.notes);

          if (data.timerState) {
            localStorage.setItem('studyx_timer_state', JSON.stringify(data.timerState));
          }
        }
      } catch (err) {
        console.error('Failed to fetch cloud data:', err);
      } finally {
        setDataLoadedFromCloud(true);
        setIsDataLoading(false);
      }
    };

    fetchCloudData();
  }, [user, token]);

  // Recover interrupted study session on mount
  useEffect(() => {
    try {
      const savedTimerStateStr = localStorage.getItem('studyx_timer_state');
      if (savedTimerStateStr) {
        const savedTimerState = JSON.parse(savedTimerStateStr);
        if (savedTimerState && savedTimerState.isRunning && savedTimerState.mode === 'focus') {
          const sessionId = savedTimerState.sessionId;

          // Check if already logged (loaded from LocalStorage in useState)
          const savedSessionsStr = localStorage.getItem('study_sessions');
          const currentSessions = savedSessionsStr ? JSON.parse(savedSessionsStr) : [];
          const exists = currentSessions.some((s: any) => s.id === sessionId);

          if (!exists) {
            const startTimestamp = savedTimerState.startTimestamp;
            const accumulatedSeconds = savedTimerState.accumulatedSeconds || 0;
            const timeLeft = savedTimerState.timeLeft || 0;

            if (startTimestamp) {
              const currentElapsed = Math.min(timeLeft, Math.floor((Date.now() - startTimestamp) / 1000));
              const totalElapsed = accumulatedSeconds + currentElapsed;

              if (totalElapsed > 0) {
                const recoveredSession: TimerSession = {
                  id: sessionId,
                  duration: totalElapsed,
                  date: new Date().toISOString(),
                  subjectId: savedTimerState.selectedSubjectId || 'other',
                  type: 'focus'
                };

                setSessions(prev => {
                  if (prev.some(s => s.id === sessionId)) return prev;
                  const updated = [...prev, recoveredSession];
                  localStorage.setItem('study_sessions', JSON.stringify(updated));
                  return updated;
                });
              }
            }
          }

          // Clear running state to avoid duplicate recovery
          savedTimerState.isRunning = false;
          savedTimerState.accumulatedSeconds = 0;
          localStorage.setItem('studyx_timer_state', JSON.stringify(savedTimerState));
        }
      }
    } catch (e) {
      console.error("Failed to recover crashed timer session:", e);
    }
  }, []);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD + K or CTRL + K triggers search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }

      // Quick tab routing keys when not focused in input/textarea
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );

      if (!isTyping) {
        if (e.key === 'd' || e.key === 'D') setView('dashboard');
        if (e.key === 't' || e.key === 'T') setView('timer');
        if (e.key === 'l' || e.key === 'L') setView('logs');
        if (e.key === 'k' || e.key === 'K') setView('todo');
        if (e.key === 's' || e.key === 'S') setView('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check achievements status triggers based on updated state
  useEffect(() => {
    let changed = false;
    const currentAch = [...achievements];

    // Badge 1: Syllabus master (3 subjects)
    const achOmniIdx = currentAch.findIndex(a => a.id === 'ach-6');
    if (achOmniIdx !== -1 && !currentAch[achOmniIdx].unlockedAt && subjects.length >= 3) {
      currentAch[achOmniIdx].unlockedAt = new Date().toISOString();
      changed = true;
    }

    // Badge 2: Goal crusher (1 completed goal)
    const achGoalIdx = currentAch.findIndex(a => a.id === 'ach-5');
    const completedGoalCount = goals.filter(g => g.currentValue >= g.targetValue).length;
    if (achGoalIdx !== -1 && !currentAch[achGoalIdx].unlockedAt && completedGoalCount >= 1) {
      currentAch[achGoalIdx].unlockedAt = new Date().toISOString();
      changed = true;
    }

    // Badge 3: Deep Focus (timer sessions focus)
    const achFocusIdx = currentAch.findIndex(a => a.id === 'ach-2');
    const focusCount = sessions.filter(s => s.type === 'focus').length;
    if (achFocusIdx !== -1 && !currentAch[achFocusIdx].unlockedAt && focusCount >= 1) {
      currentAch[achFocusIdx].unlockedAt = new Date().toISOString();
      changed = true;
    }

    if (changed) {
      setAchievements(currentAch);
      triggerConfetti();
    }
  }, [subjects, goals, sessions, achievements]);

  // Calculate active study streak days
  const calculateStreak = () => {
    // Collect all dates where logs were recorded or timer focus sessions completed
    const activeDates = new Set<string>();
    logs.forEach(l => activeDates.add(l.date));
    sessions.forEach(s => activeDates.add(s.date.slice(0, 10)));

    const sortedDates = Array.from(activeDates).sort((a, b) => b.localeCompare(a));
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);

    // If there's no activity today or yesterday, the streak is broken
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }

    let currentCursor = new Date(sortedDates[0] + 'T00:00:00');
    streak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const nextDateStr = sortedDates[i];
      const prevDate = new Date(nextDateStr + 'T00:00:00');

      const diffTime = Math.abs(currentCursor.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        currentCursor = prevDate;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }

    return streak;
  };

  const streakDays = calculateStreak();

  // Toast notifier triggers
  const triggerUndoToast = (type: any, data: any) => {
    setLastDeletedItem({ type, data });
    setShowUndoToast(true);
    setTimeout(() => {
      setShowUndoToast(false);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedItem) return;

    if (lastDeletedItem.type === 'log') {
      setLogs(prev => [...prev, lastDeletedItem.data]);
    } else if (lastDeletedItem.type === 'task') {
      setTasks(prev => [...prev, lastDeletedItem.data]);
    } else if (lastDeletedItem.type === 'test') {
      setTests(prev => [...prev, lastDeletedItem.data]);
    } else if (lastDeletedItem.type === 'goal') {
      setGoals(prev => [...prev, lastDeletedItem.data]);
    } else if (lastDeletedItem.type === 'subject') {
      setSubjects(prev => [...prev, lastDeletedItem.data]);
    } else if (lastDeletedItem.type === 'note' as any) {
      setNotes(prev => [...prev, lastDeletedItem.data]);
    }

    setLastDeletedItem(null);
    setShowUndoToast(false);
    triggerConfetti();
  };

  // State modification callbacks
  const handleAddLog = (newLog: Omit<StudyLog, 'id'>) => {
    const logId = `log-${Date.now()}`;
    const logItem: StudyLog = {
      ...newLog,
      id: logId
    };
    setLogs(prev => [...prev, logItem]);

    // Phase 2 Integration: Also record as a StudySession with source: 'manual'
    // so dashboard total hours, streak, heatmap, and study logs graph all update immediately!
    const durationMin = Math.round(newLog.hours * 60);
    const sessionObj: TimerSession = {
      id: `sess-${logId}`,
      date: newLog.date,
      startTime: `${newLog.date}T12:00:00.000Z`,
      durationMin: Math.max(1, durationMin),
      duration: Math.max(1, durationMin) * 60,
      subjectId: newLog.subjectId,
      source: 'manual',
      type: 'focus',
      notes: newLog.notes
    };
    addSession(sessionObj);
    setSessions(prev => [sessionObj, ...prev]);

    triggerConfetti();
  };

  const handleDeleteLog = (id: string) => {
    const item = logs.find(l => l.id === id);
    if (item) {
      setLogs(prev => prev.filter(l => l.id !== id));
      deleteSession(`sess-${id}`);
      deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== `sess-${id}` && s.id !== id));
      triggerUndoToast('log', item);
    }
  };

  const handleAddSession = (sessionItem: TimerSession) => {
    addSession({
      durationMin: sessionItem.durationMin || (sessionItem.duration ? Math.round(sessionItem.duration / 60) : 0),
      duration: sessionItem.duration,
      date: (sessionItem.date || new Date().toISOString()).slice(0, 10),
      startTime: sessionItem.date || new Date().toISOString(),
      subjectId: sessionItem.subjectId,
      chapterId: sessionItem.chapterId,
      source: 'timer',
      type: 'focus'
    });
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === sessionItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = sessionItem;
        return next;
      }
      return [...prev, sessionItem];
    });
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed' | 'order'>) => {
    const taskItem: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      completed: false,
      order: tasks.length
    };
    setTasks(prev => [...prev, taskItem]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    const item = tasks.find(t => t.id === id);
    if (item) {
      setTasks(prev => prev.filter(t => t.id !== id));
      triggerUndoToast('task', item);
    }
  };

  const handleEditTask = (id: string, updated: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const handleAddSubject = (newSub: Omit<Subject, 'id'>) => {
    const subItem: Subject = {
      ...newSub,
      id: `sub-${Date.now()}`
    };
    setSubjects(prev => [...prev, subItem]);
  };

  const handleDeleteSubject = (id: string) => {
    const item = subjects.find(s => s.id === id);
    if (item) {
      setSubjects(prev => prev.filter(s => s.id !== id));
      triggerUndoToast('subject', item);
    }
  };

  const handleAddTest = (newTest: Omit<TestMark, 'id'>) => {
    const testItem: TestMark = {
      ...newTest,
      id: `test-${Date.now()}`
    };
    setTests(prev => [...prev, testItem]);
  };

  const handleDeleteTest = (id: string) => {
    const item = tests.find(t => t.id === id);
    if (item) {
      setTests(prev => prev.filter(t => t.id !== id));
      triggerUndoToast('test', item);
    }
  };

  const handleEditTest = (id: string, updated: Partial<TestMark>) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const handleAddNote = (newNote: Omit<CalendarNote, 'id'>) => {
    const noteItem: CalendarNote = {
      ...newNote,
      id: `note-${Date.now()}`
    };
    setNotes(prev => [...prev, noteItem]);
  };

  const handleDeleteNote = (id: string) => {
    const item = notes.find(n => n.id === id);
    if (item) {
      setNotes(prev => prev.filter(n => n.id !== id));
      triggerUndoToast('note' as any, item);
    }
  };

  const handleEditNote = (id: string, updated: Partial<CalendarNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n));
  };

  const handleAddGoal = (newGoal: Omit<Goal, 'id' | 'completed'>) => {
    const goalItem: Goal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      completed: false
    };
    setGoals(prev => [...prev, goalItem]);
  };

  const handleUpdateGoalProgress = (id: string, value: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentValue: value, completed: value >= g.targetValue } : g));
  };

  const handleDeleteGoal = (id: string) => {
    const item = goals.find(g => g.id === id);
    if (item) {
      setGoals(prev => prev.filter(g => g.id !== id));
      triggerUndoToast('goal', item);
    }
  };

  const handleUnlockAchievement = (id: string) => {
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, unlockedAt: new Date().toISOString() } : a));
  };

  const handleImportData = (imported: any) => {
    if (imported.subjects) setSubjects(imported.subjects);
    if (imported.logs) setLogs(imported.logs);
    if (imported.tasks) setTasks(imported.tasks);
    if (imported.tests) setTests(imported.tests);
    if (imported.goals) setGoals(imported.goals);
    if (imported.sessions) setSessions(imported.sessions);
    if (imported.settings) setSettings(imported.settings);
    if (imported.notes) setNotes(imported.notes);
  };

  const handleClearAllData = () => {
    setSubjects([]);
    setLogs([]);
    setTasks([]);
    setTests([]);
    setGoals([]);
    setSessions([]);
    setNotes([]);
    localStorage.clear();
  };

  // Compile search indexes
  const getSearchResults = () => {
    if (!globalSearchQuery.trim()) return [];
    const query = globalSearchQuery.toLowerCase();
    const results: any[] = [];

    // Search tasks
    tasks.forEach(t => {
      if (t.title.toLowerCase().includes(query)) {
        results.push({ id: t.id, title: t.title, type: 'Backlog Task', view: 'todo' });
      }
    });

    // Search logs
    logs.forEach(l => {
      if (l.notes.toLowerCase().includes(query)) {
        results.push({ id: l.id, title: l.notes, type: 'Study Log Note', view: 'logs' });
      }
    });

    // Search subjects
    subjects.forEach(s => {
      if (s.name.toLowerCase().includes(query)) {
        results.push({ id: s.id, title: s.name, type: 'Course Subject', view: 'subjects' });
      }
    });

    return results;
  };

  const searchResults = getSearchResults();

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col items-center justify-center gap-4 font-sans">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[10px] tracking-widest text-zinc-500 uppercase font-bold font-mono">
          {isDataLoading ? 'Syncing Cloud Data...' : 'Loading StudyX Desk...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        id="app-root-container"
        className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-yellow-400 selection:text-black"
      >
        <div className="py-8 md:py-16 flex items-center justify-center min-h-screen">
          {authView === 'login' ? (
            <Login
              onSuccess={handleLoginSuccess}
              onNavigateToSignup={() => setAuthView('signup')}
            />
          ) : (
            <Signup
              onSuccess={handleLoginSuccess}
              onNavigateToLogin={() => setAuthView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="app-root-container"
      className={`min-h-screen text-white font-sans selection:bg-yellow-400 selection:text-black transition-colors duration-500 ${settings.theme === 'light'
          ? 'bg-[#FCFBF9] text-[#1A1A1C]'
          : settings.theme === 'amoled'
            ? 'bg-black text-white'
            : 'bg-[#050505] text-zinc-100'
        }`}
    >
      <Confetti />

      {/* Undo Delete overlay popup */}
      {showUndoToast && lastDeletedItem && (
        <div
          id="undo-toast-overlay"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 px-5 py-3 rounded-xl flex items-center justify-between gap-4 shadow-2xl z-50 animate-bounce min-w-[280px]"
        >
          <span>Deleted {lastDeletedItem.type} backlog entry.</span>
          <button
            onClick={handleUndoDelete}
            className="text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-1 active:scale-95 transition"
          >
            <Undo2 size={12} strokeWidth={2.5} />
            Undo Delete
          </button>
        </div>
      )}

      {/* Primary Layout structure */}
      <div className="flex min-h-screen relative">

        {/* Navigation Sidebar Panel */}
        <aside
          id="primary-sidebar-nav"
          className={`w-64 border-r hidden md:flex flex-col justify-between p-5 sticky top-0 h-screen ${settings.theme === 'light'
              ? 'bg-[#FFFFFF] border-zinc-200'
              : 'bg-[#050505] border-zinc-800/80'
            }`}
        >
          <div className="space-y-6">
            {/* Logo area */}
            <div className="px-1.5 py-1">
              <StudyXLogo />
            </div>

            {/* Quick search button shortcut link */}
            <button
              onClick={() => setShowSearchModal(true)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition border ${settings.theme === 'light'
                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                  : 'bg-zinc-950 border-zinc-900/60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Search size={13} />
                <span>Search Hub...</span>
              </div>
              <div className="flex items-center gap-0.5 opacity-80">
                <Command size={10} />
                <span>K</span>
              </div>
            </button>

            {/* Nav List links */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'timer', label: 'Focus Timer', icon: TimerIcon },
                { id: 'logs', label: 'Study Logs', icon: BookOpen },
                { id: 'todo', label: 'To-Do Backlog', icon: CheckSquare },
                { id: 'subjects', label: 'Subjects Tracker', icon: FileText },
                { id: 'tests', label: 'Test Marks', icon: Award },
                { id: 'calendar', label: 'Calendar Planner', icon: CalendarIcon },
                { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                { id: 'analytics', label: 'Insight Analytics', icon: TrendingUp },
                { id: 'goals', label: 'Goals & Badges', icon: Award },
                { id: 'settings', label: 'Settings Panel', icon: SettingsIcon },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${isActive
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/15'
                        : settings.theme === 'light'
                          ? 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-950/40'
                      }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer details */}
          <div className="space-y-3.5 border-t border-zinc-900/80 pt-4">
            <div className="flex items-center gap-2 px-1.5">
              <Flame size={15} className="text-yellow-500" />
              <div className="text-xs">
                <p className="font-semibold">{streak} Day Streak</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Consecutive Study (&gt;60m)</p>
              </div>
            </div>

            <p className="text-[10px] text-zinc-600 pl-1.5">
              Shorcut: Press keys D, T, L, S to route
            </p>

            {/* User Profile / Logout block */}
            <div className={`flex items-center justify-between border-t pt-3.5 mt-2.5 px-1.5 ${settings.theme === 'light' ? 'border-zinc-150' : 'border-zinc-900/80'
              }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-850/60 flex items-center justify-center shrink-0">
                  <User size={13} className="text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold truncate ${settings.theme === 'light' ? 'text-zinc-800' : 'text-zinc-200'
                    }`}>{user.username}</p>
                  <p className="text-[9px] text-zinc-500 truncate font-mono">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout Desk Session"
                className="p-2 rounded-xl bg-zinc-950/40 hover:bg-red-500/10 border border-zinc-900 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition shrink-0 cursor-pointer active:scale-95"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* Primary Main workspace container */}
        <div className="flex-grow flex flex-col min-w-0">

          {/* Header Bar */}
          <header
            id="workspace-header-bar"
            className={`h-16 border-b flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-md ${settings.theme === 'light'
                ? 'bg-[#FCFBF9]/80 border-zinc-200'
                : 'bg-[#050505]/80 border-zinc-800/80'
              }`}
          >
            {/* View indicators */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Cabin</span>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">
                {view}
              </span>
            </div>

            {/* Utility status pills */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-900 px-3 py-1.5 rounded-full text-[11px] text-zinc-400 font-medium">
                <Clock size={12} />
                <span>Today: {todayTotalHours.decimal}h</span>
              </div>

              <div className="flex md:hidden bg-yellow-500 text-black px-2.5 py-1.5 rounded-full text-xs font-bold items-center gap-1 shadow-md shadow-yellow-500/10 animate-fade-in">
                <Flame size={12} />
                <span>{streak}d</span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout Desk Session"
                className="md:hidden flex p-2.5 rounded-full bg-zinc-950 hover:bg-red-500/10 border border-zinc-900 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition active:scale-95 cursor-pointer"
              >
                <LogOut size={12} />
              </button>
            </div>
          </header>

          {/* Primary View content body layout */}
          <main id="view-content-canvas" className="p-6 md:p-8 flex-grow">
            {view === 'dashboard' && (
              <Dashboard setView={setView} />
            )}
            {view === 'timer' && (
              <div className="space-y-6">
                <Timer
                  subjects={studySubjects}
                  settings={settings}
                  onAddSession={handleAddSession}
                  sessions={sessions}
                />
              </div>
            )}

            {view === 'logs' && (
              <StudyLogs
                subjects={subjects}
                logs={logs}
                sessions={sessions}
                onAddLog={handleAddLog}
                onDeleteLog={handleDeleteLog}
              />
            )}
            {view === 'todo' && (
              <TodoList
                subjects={subjects}
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
              />
            )}
            {view === 'subjects' && (
              <Subjects />
            )}
            {view === 'tests' && (
              <TestMarks
                subjects={subjects}
                tests={tests}
                onAddTest={handleAddTest}
                onDeleteTest={handleDeleteTest}
              />
            )}
            {view === 'calendar' && (
              <CalendarView
                subjects={subjects}
                logs={logs}
                tasks={tasks}
                tests={tests}
                sessions={sessions}
                notes={notes}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onAddTest={handleAddTest}
                onEditTest={handleEditTest}
                onDeleteTest={handleDeleteTest}
                onAddNote={handleAddNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
              />
            )}
            {view === 'leaderboard' && (
              <Leaderboard currentUser={user} settings={settings} />
            )}
            {view === 'analytics' && (
              <Analytics
                subjects={subjects}
                logs={logs}
                tasks={tasks}
                tests={tests}
                sessions={sessions}
                streakDays={streakDays}
              />
            )}
            {view === 'goals' && (
              <GoalsAchievements
                goals={goals}
                achievements={achievements}
                subjects={subjects}
                logs={logs}
                tests={tests}
                sessions={sessions}
                streakDays={streakDays}
                onAddGoal={handleAddGoal}
                onUpdateGoalProgress={handleUpdateGoalProgress}
                onDeleteGoal={handleDeleteGoal}
                onUnlockAchievement={handleUnlockAchievement}
              />
            )}
            {view === 'settings' && (
              <Settings
                settings={settings}
                onUpdateSettings={setSettings}
                subjects={subjects}
                logs={logs}
                tasks={tasks}
                tests={tests}
                goals={goals}
                sessions={sessions}
                onImportData={handleImportData}
                onClearAllData={handleClearAllData}
              />
            )}
          </main>

          {/* Quick Mobile footer tabs layout */}
          <footer
            id="mobile-navigation-tabs"
            className={`md:hidden h-16 border-t flex items-center justify-around sticky bottom-0 z-40 backdrop-blur-md ${settings.theme === 'light'
                ? 'bg-[#FCFBF9]/95 border-zinc-200'
                : 'bg-[#050505]/95 border-zinc-800/80'
              }`}
          >
            {[
              { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
              { id: 'timer', label: 'Timer', icon: TimerIcon },
              { id: 'logs', label: 'Logs', icon: BookOpen },
              { id: 'todo', label: 'Tasks', icon: CheckSquare },
              { id: 'settings', label: 'Setup', icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex flex-col items-center justify-center p-2 text-center select-none ${isActive ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <Icon size={16} />
                  <span className="text-[9px] uppercase tracking-wider mt-1 font-medium">{item.label}</span>
                </button>
              );
            })}
          </footer>
        </div>
      </div>

      {/* Global Command CMD+K Search Modal overlay */}
      {showSearchModal && (
        <div
          id="cmd-k-search-modal"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 z-50 px-4 animate-fade-in"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900">
              <Search size={15} className="text-zinc-500" />
              <input
                type="text"
                placeholder="Search catalog tasks, logs notes, subjects..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none border-none text-xs text-zinc-200"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setGlobalSearchQuery('');
                }}
                className="text-[10px] text-zinc-600 hover:text-zinc-300 transition"
              >
                ESC
              </button>
            </div>

            {/* Results display */}
            <div className="max-h-64 overflow-y-auto p-2">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setView(res.view);
                    setShowSearchModal(false);
                    setGlobalSearchQuery('');
                  }}
                  className="w-full flex justify-between items-center px-3 py-2 rounded-xl text-left hover:bg-zinc-900 transition text-xs group"
                >
                  <span className="text-zinc-300 group-hover:text-white font-medium truncate max-w-[70%]">{res.title}</span>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.2 rounded font-semibold">{res.type}</span>
                </button>
              ))}

              {globalSearchQuery && searchResults.length === 0 && (
                <p className="text-xs text-zinc-600 p-4 text-center">No search matches found.</p>
              )}

              {!globalSearchQuery && (
                <p className="text-[10px] text-zinc-500 p-3 text-center">Type search queries above (e.g. Practise, scheduling)</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
