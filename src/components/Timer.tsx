import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Brain, 
  Coffee, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Sparkles, 
  Sliders, 
  Check, 
  X, 
  ArrowRight, 
  Award, 
  Bell, 
  BookOpen,
  Timer as TimerIcon 
} from 'lucide-react';
import { Subject, TimerSession, AppSettings } from '../types';
import { triggerConfetti } from './Confetti';
import { useStudyData, getLocalDateKey } from '../context/useStudyData';
import { SEED_SUBJECTS } from '../data/seedData';

interface TimerProps {
  subjects: Subject[];
  settings: AppSettings;
  onAddSession: (session: TimerSession) => void;
  sessions: TimerSession[];
}

type ActiveMode = 'custom' | 'flow';
type CustomPhase = 'focus' | 'break';
type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

// Flow milestones and psychological stage definitions
const getFlowMilestone = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  if (mins < 15) {
    return {
      title: 'Entering Focus',
      description: 'Settling in & warming up your concentration',
      badge: '🌱 Warm Up',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      ringColor: '#10B981',
      stage: 1,
      minMinutes: 0,
      nextMilestoneMinutes: 15,
      progress: Math.min(100, (mins / 15) * 100)
    };
  } else if (mins < 45) {
    return {
      title: 'Flow State Active',
      description: 'Optimal immersion & uninterrupted rhythm',
      badge: '⚡ In The Zone',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      ringColor: '#F59E0B',
      stage: 2,
      minMinutes: 15,
      nextMilestoneMinutes: 45,
      progress: Math.min(100, ((mins - 15) / 30) * 100)
    };
  } else if (mins < 90) {
    return {
      title: 'Deep Flow',
      description: 'Peak mental acuity & creative absorption',
      badge: '🔥 Deep Flow',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      ringColor: '#F97316',
      stage: 3,
      minMinutes: 45,
      nextMilestoneMinutes: 90,
      progress: Math.min(100, ((mins - 45) / 45) * 100)
    };
  } else {
    return {
      title: 'Hyper Focus',
      description: 'Mastery state & supreme mental endurance',
      badge: '💎 Hyper Focus',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      ringColor: '#EAB308',
      stage: 4,
      minMinutes: 90,
      nextMilestoneMinutes: 120,
      progress: 100
    };
  }
};

// ─── Heatmap Component ────────────────────────────────────────────────────────
function StudyHeatmap({ dailyMinutes }: { dailyMinutes: Record<string, number> }) {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; minutes: number; x: number; y: number } | null>(null);

  const cells = React.useMemo(() => {
    const result: { date: string; minutes: number; col: number; row: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 90 days total (today + 89 prior)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 89);

    // Align start to Sunday of that week
    const startDow = startDate.getDay(); // 0=Sun
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - startDow);

    const cur = new Date(gridStart);
    let dayIndex = 0;
    while (cur <= today) {
      const col = Math.floor(dayIndex / 7);
      const row = cur.getDay(); // 0=Sun
      const dateKey = getLocalDateKey(cur);

      if (cur >= startDate && cur <= today) {
        result.push({ date: dateKey, minutes: dailyMinutes[dateKey] || 0, col, row });
      }
      dayIndex++;
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [dailyMinutes]);

  const totalCols = React.useMemo(() => {
    return cells.reduce((m, c) => Math.max(m, c.col), 0) + 1;
  }, [cells]);

  const totalMinutes90 = React.useMemo(() => {
    return cells.reduce((sum, c) => sum + c.minutes, 0);
  }, [cells]);

  const activeDays90 = React.useMemo(() => {
    return cells.filter(c => c.minutes > 0).length;
  }, [cells]);

  // Responsive full-width layout parameters
  const LABEL_W = 32;
  const CELL_W = 50;
  const GAP_X = 6;
  const CELL_H = 12;
  const GAP_Y = 3.5;
  const HEADER_H = 18;

  const svgWidth = LABEL_W + totalCols * (CELL_W + GAP_X);
  const svgHeight = HEADER_H + 7 * (CELL_H + GAP_Y);

  const getColor = (minutes: number) => {
    if (minutes === 0) return '#18181b';          // empty
    if (minutes < 30) return '#713f12';           // level 1
    if (minutes < 90) return '#a16207';           // level 2
    if (minutes < 180) return '#ca8a04';          // level 3
    return '#eab308';                             // level 4 (180+ min)
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const rowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels: { label: string; col: number }[] = [];
  const seenMonths = new Set<string>();
  cells.forEach(c => {
    const d = new Date(c.date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!seenMonths.has(key)) {
      seenMonths.add(key);
      monthLabels.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), col: c.col });
    }
  });

  return (
    <div className="w-full select-none">
      {/* Header with Metrics and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            90-Day Study Activity
          </span>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-950 border border-zinc-800">
              <strong className="text-yellow-400 font-semibold">{activeDays90}</strong> / 90 days active
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-950 border border-zinc-800">
              <strong className="text-yellow-400 font-semibold">{Math.floor(totalMinutes90 / 60)}h {totalMinutes90 % 60}m</strong> total
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
          <span>Less</span>
          {['#18181b', '#713f12', '#a16207', '#ca8a04', '#eab308'].map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-sm border border-zinc-800/80 shadow-sm" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Responsive Full-Width SVG Heatmap */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px] block"
          style={{ fontFamily: 'monospace' }}
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={LABEL_W + m.col * (CELL_W + GAP_X)}
              y={12}
              fontSize={9}
              fontWeight="600"
              fill="#71717a"
            >
              {m.label}
            </text>
          ))}

          {/* Row (day) labels */}
          {rowLabels.map((label, i) => (
            (i % 2 === 1) && (
              <text
                key={i}
                x={0}
                y={HEADER_H + i * (CELL_H + GAP_Y) + CELL_H * 0.78}
                fontSize={8}
                fill="#52525b"
                fontWeight="500"
              >
                {label.slice(0, 3)}
              </text>
            )
          ))}

          {/* Cells */}
          {cells.map((cell) => {
            const isHovered = hoveredCell?.date === cell.date;
            return (
              <rect
                key={cell.date}
                x={LABEL_W + cell.col * (CELL_W + GAP_X)}
                y={HEADER_H + cell.row * (CELL_H + GAP_Y)}
                width={CELL_W}
                height={CELL_H}
                rx={3}
                fill={getColor(cell.minutes)}
                stroke={isHovered ? '#fef08a' : (cell.minutes > 0 ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255, 255, 255, 0.04)')}
                strokeWidth={isHovered ? 1.5 : 1}
                className="cursor-pointer transition-all duration-150 hover:opacity-90"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  setHoveredCell({ date: cell.date, minutes: cell.minutes, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  setHoveredCell((prev) => 
                    prev?.date === cell.date ? null : { date: cell.date, minutes: cell.minutes, x: rect.left, y: rect.top }
                  );
                }}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredCell && (
          <div
            className="fixed z-50 pointer-events-none bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-[11px] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95"
            style={{ left: Math.min(window.innerWidth - 180, hoveredCell.x + 16), top: Math.max(10, hoveredCell.y - 58) }}
          >
            <p className="font-semibold text-zinc-100">{formatDate(hoveredCell.date)}</p>
            <p className="text-zinc-400 mt-0.5 font-mono">
              {hoveredCell.minutes === 0 ? (
                <span className="text-zinc-500">No study recorded</span>
              ) : (
                <span className="text-yellow-400 font-medium">
                  {Math.floor(hoveredCell.minutes / 60)}h {hoveredCell.minutes % 60}m studied
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Timer({ subjects: propSubjects, settings, onAddSession, sessions }: TimerProps) {
  const { subjects: contextSubjects, chapters, dailyMinutes } = useStudyData();

  const subjects = useMemo(() => {
    if (contextSubjects && contextSubjects.length > 0) return contextSubjects;
    if (propSubjects && propSubjects.length > 0) return propSubjects;
    return SEED_SUBJECTS;
  }, [contextSubjects, propSubjects]);

  // Read saved state once on mount
  const savedState = useRef<any>(null);
  if (savedState.current === null) {
    try {
      const saved = localStorage.getItem('studyx_timer_state');
      if (saved) {
        savedState.current = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading saved timer state:', e);
    }
  }

  // Primary mode state: 'custom' | 'flow'
  const [activeMode, setActiveMode] = useState<ActiveMode>(() => {
    return savedState.current?.activeMode || 'custom';
  });

  // Selected subject & chapter (validate against subjects)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    const saved = savedState.current?.selectedSubjectId;
    if (saved && subjects.some(s => s.id === saved)) {
      return saved;
    }
    return subjects[0]?.id || 'physics';
  });
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    return savedState.current?.selectedChapterId || '';
  });
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);

  // Auto-correct selectedSubjectId if saved ID is invalid
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
      setSelectedChapterId('');
    }
  }, [subjects, selectedSubjectId]);

  // Common UI states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => savedState.current?.isMuted ?? false);

  // -------------------------------------------------------------
  // 1. CUSTOM TIMER MODE STATES
  // -------------------------------------------------------------
  const [customPhase, setCustomPhase] = useState<CustomPhase>(() => {
    return savedState.current?.customPhase || 'focus';
  });

  const [customTotalDuration, setCustomTotalDuration] = useState<number>(() => {
    if (savedState.current?.customTotalDuration) {
      return savedState.current.customTotalDuration;
    }
    return (settings.pomodoroFocus || 25) * 60;
  });

  const [customTimeLeft, setCustomTimeLeft] = useState<number>(() => {
    const s = savedState.current;
    if (!s) return (settings.pomodoroFocus || 25) * 60;
    
    // If running when refreshed/unmounted, compute real remaining seconds
    if (s.customStatus === 'running' && s.customStartTimestamp) {
      const elapsed = Math.floor((Date.now() - s.customStartTimestamp) / 1000);
      const remaining = s.customTotalDuration - ((s.customAccumulatedSeconds || 0) + elapsed);
      return Math.max(0, remaining);
    }
    return s.customTimeLeft !== undefined ? s.customTimeLeft : (settings.pomodoroFocus || 25) * 60;
  });

  const [customStatus, setCustomStatus] = useState<TimerStatus>(() => {
    const s = savedState.current;
    if (s?.customStatus === 'running' && s.customStartTimestamp) {
      const elapsed = Math.floor((Date.now() - s.customStartTimestamp) / 1000);
      const remaining = s.customTotalDuration - ((s.customAccumulatedSeconds || 0) + elapsed);
      if (remaining <= 0) return 'finished';
      return 'running';
    }
    return s?.customStatus || 'idle';
  });

  const [customStartTimestamp, setCustomStartTimestamp] = useState<number | null>(() => {
    const s = savedState.current;
    if (s?.customStatus === 'running' && s.customStartTimestamp) {
      return s.customStartTimestamp;
    }
    return null;
  });

  const [customAccumulatedSeconds, setCustomAccumulatedSeconds] = useState<number>(() => {
    return savedState.current?.customAccumulatedSeconds || 0;
  });

  const [isRepeat, setIsRepeat] = useState<boolean>(() => {
    return savedState.current?.isRepeat ?? false;
  });

  const [customSessionId, setCustomSessionId] = useState<string>(() => {
    return savedState.current?.customSessionId || `sess-${Date.now()}`;
  });

  // Custom modal for setting exact duration
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('25');

  // -------------------------------------------------------------
  // 2. FLOW STATE MODE STATES
  // -------------------------------------------------------------
  const [flowStatus, setFlowStatus] = useState<TimerStatus>(() => {
    return savedState.current?.flowStatus || 'idle';
  });

  const [flowStartTimestamp, setFlowStartTimestamp] = useState<number | null>(() => {
    const s = savedState.current;
    if (s?.flowStatus === 'running' && s.flowStartTimestamp) {
      return s.flowStartTimestamp;
    }
    return null;
  });

  const [flowAccumulatedSeconds, setFlowAccumulatedSeconds] = useState<number>(() => {
    return savedState.current?.flowAccumulatedSeconds || 0;
  });

  const [flowElapsedSeconds, setFlowElapsedSeconds] = useState<number>(() => {
    const s = savedState.current;
    if (s?.flowStatus === 'running' && s.flowStartTimestamp) {
      const elapsed = Math.floor((Date.now() - s.flowStartTimestamp) / 1000);
      return (s.flowAccumulatedSeconds || 0) + elapsed;
    }
    return s?.flowElapsedSeconds || s?.flowAccumulatedSeconds || 0;
  });

  const [flowSessionId, setFlowSessionId] = useState<string>(() => {
    return savedState.current?.flowSessionId || `flow-${Date.now()}`;
  });

  const [milestoneAlertEnabled, setMilestoneAlertEnabled] = useState<boolean>(() => {
    return savedState.current?.milestoneAlertEnabled ?? true;
  });

  // Completion summary dialog for Flow Mode
  const [completedFlowSummary, setCompletedFlowSummary] = useState<{
    duration: number;
    subjectName: string;
    badge: string;
    recommendedBreak: number;
  } | null>(null);

  // References
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastMilestoneAnnounced = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Play synthesized audio tone
  const playSound = (type: 'alarm' | 'milestone') => {
    if (isMuted || settings.alarmSound === 'off') return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'milestone') {
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0.2, now + idx * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.65);
        });
        return;
      }

      if (settings.alarmSound === 'zen' || settings.alarmSound === 'bell') {
        const baseFreq = settings.alarmSound === 'zen' ? 440 : 523.25;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
        gain2.gain.setValueAtTime(0.18, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.8);
        osc2.stop(now + 2.8);
      } else {
        [587.33, 739.99, 880.00].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.22, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.25);
        });
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  // Persist State
  const persistState = () => {
    try {
      const stateObj = {
        activeMode,
        selectedSubjectId,
        selectedChapterId,
        isMuted,
        isRepeat,
        // Custom
        customPhase,
        customTotalDuration,
        customTimeLeft,
        customStatus,
        customStartTimestamp,
        customAccumulatedSeconds,
        customSessionId,
        // Flow
        flowStatus,
        flowStartTimestamp,
        flowAccumulatedSeconds,
        flowElapsedSeconds,
        flowSessionId,
        milestoneAlertEnabled,
        lastSaved: Date.now()
      };
      localStorage.setItem('studyx_timer_state', JSON.stringify(stateObj));
    } catch (e) {
      console.error('Failed saving timer state:', e);
    }
  };

  useEffect(() => {
    persistState();
  }, [
    activeMode,
    selectedSubjectId,
    selectedChapterId,
    isMuted,
    isRepeat,
    customPhase,
    customTotalDuration,
    customTimeLeft,
    customStatus,
    customStartTimestamp,
    customAccumulatedSeconds,
    customSessionId,
    flowStatus,
    flowStartTimestamp,
    flowAccumulatedSeconds,
    flowElapsedSeconds,
    flowSessionId,
    milestoneAlertEnabled
  ]);

  // Sync settings if timer is idle in Custom Mode
  useEffect(() => {
    if (activeMode === 'custom' && customStatus === 'idle') {
      const defaultDuration = (customPhase === 'focus' ? settings.pomodoroFocus : settings.pomodoroShortBreak) * 60;
      if (!savedState.current) {
        setCustomTotalDuration(defaultDuration);
        setCustomTimeLeft(defaultDuration);
      }
    }
  }, [settings.pomodoroFocus, settings.pomodoroShortBreak]);

  // Ensure selectedSubjectId is valid
  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Timer Tick Engine
  useEffect(() => {
    const isCustomRunning = activeMode === 'custom' && customStatus === 'running';
    const isFlowRunning = activeMode === 'flow' && flowStatus === 'running';

    if (isCustomRunning || isFlowRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();

        // Tick Custom Countdown
        if (isCustomRunning && customStartTimestamp) {
          const currentElapsed = Math.floor((now - customStartTimestamp) / 1000);
          const totalSpent = customAccumulatedSeconds + currentElapsed;
          const nextRemaining = Math.max(0, customTotalDuration - totalSpent);

          setCustomTimeLeft(nextRemaining);

          if (nextRemaining <= 0) {
            handleCustomComplete();
          }
        }

        // Tick Flow Count-Up
        if (isFlowRunning && flowStartTimestamp) {
          const currentElapsed = Math.floor((now - flowStartTimestamp) / 1000);
          const totalFlowSeconds = flowAccumulatedSeconds + currentElapsed;
          setFlowElapsedSeconds(totalFlowSeconds);

          if (milestoneAlertEnabled) {
            const currentMins = Math.floor(totalFlowSeconds / 60);
            if (currentMins > 0 && currentMins % 25 === 0 && lastMilestoneAnnounced.current !== currentMins) {
              lastMilestoneAnnounced.current = currentMins;
              playSound('milestone');
              if (settings.notificationsEnabled && Notification.permission === 'granted') {
                new Notification('Flow Milestone Achieved! ⚡', {
                  body: `Outstanding focus! You've been deeply in the zone for ${currentMins} minutes.`,
                  icon: '/favicon.ico'
                });
              }
            }
          }
        }
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    activeMode,
    customStatus,
    customStartTimestamp,
    customAccumulatedSeconds,
    customTotalDuration,
    flowStatus,
    flowStartTimestamp,
    flowAccumulatedSeconds,
    milestoneAlertEnabled,
    settings.notificationsEnabled
  ]);

  // Browser Title Update
  useEffect(() => {
    const formatTitleTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (activeMode === 'custom') {
      if (customStatus === 'running') {
        const sub = subjects.find(s => s.id === selectedSubjectId)?.name || 'Study';
        document.title = `(${formatTitleTime(customTimeLeft)}) ${customPhase === 'focus' ? sub : 'Break'} • StudyX`;
      } else if (customStatus === 'paused') {
        document.title = `(Paused) StudyX Focus`;
      } else {
        document.title = 'StudyX - Ultimate Student Workspace';
      }
    } else {
      if (flowStatus === 'running') {
        const sub = subjects.find(s => s.id === selectedSubjectId)?.name || 'Flow';
        document.title = `(${formatTitleTime(flowElapsedSeconds)}) ${sub} [Flow] • StudyX`;
      } else if (flowStatus === 'paused') {
        document.title = `(Paused) StudyX Flow`;
      } else {
        document.title = 'StudyX - Ultimate Student Workspace';
      }
    }

    return () => {
      document.title = 'StudyX - Ultimate Student Workspace';
    };
  }, [activeMode, customStatus, customTimeLeft, customPhase, flowStatus, flowElapsedSeconds, selectedSubjectId, subjects]);

  // Handle Session Recording
  const recordSession = (durationSec: number) => {
    const durationMin = Math.round(durationSec / 60);
    if (durationMin < 1 && durationSec < 30) return; // ignore accidental taps under 30s
    const actualMin = Math.max(1, durationMin);

    const sessionData = {
      duration: durationSec,
      durationMin: actualMin,
      date: getLocalDateKey(),
      startTime: new Date().toISOString(),
      subjectId: selectedSubjectId || 'physics',
      chapterId: selectedChapterId || undefined,
      source: 'timer' as const,
      type: 'focus' as const
    };

    onAddSession({
      id: `sess-${Date.now()}`,
      ...sessionData
    });
  };

  // Custom Handlers
  const handleCustomStart = () => {
    getAudioContext();
    const now = Date.now();
    if (customStatus === 'idle' || customStatus === 'finished') {
      setCustomSessionId(`sess-${now}`);
      setCustomAccumulatedSeconds(0);
    }
    setCustomStartTimestamp(now);
    setCustomStatus('running');
  };

  const handleCustomPause = () => {
    if (customStatus === 'running') {
      const elapsed = customStartTimestamp ? Math.floor((Date.now() - customStartTimestamp) / 1000) : 0;
      const total = customAccumulatedSeconds + elapsed;
      setCustomAccumulatedSeconds(total);
      setCustomStartTimestamp(null);
      setCustomStatus('paused');
    }
  };

  const handleCustomFinishAndSave = () => {
    const elapsed = customStartTimestamp ? Math.floor((Date.now() - customStartTimestamp) / 1000) : 0;
    const total = customAccumulatedSeconds + elapsed;

    if (customPhase === 'focus' && total >= 30) {
      recordSession(total);
      playSound('alarm');
      triggerConfetti();
    }

    setCustomStatus('idle');
    setCustomStartTimestamp(null);
    setCustomAccumulatedSeconds(0);
    setCustomTimeLeft(customTotalDuration);
    setCustomSessionId(`sess-${Date.now()}`);
  };

  const handleCustomReset = () => {
    setCustomStatus('idle');
    setCustomStartTimestamp(null);
    setCustomAccumulatedSeconds(0);
    setCustomTimeLeft(customTotalDuration);
    setCustomSessionId(`sess-${Date.now()}`);
  };

  const handleCustomComplete = () => {
    playSound('alarm');
    triggerConfetti();

    if (settings.notificationsEnabled && Notification.permission === 'granted') {
      const title = customPhase === 'focus' ? 'Focus Session Completed! 🏆' : 'Break Finished! 🔔';
      const body = customPhase === 'focus' 
        ? 'Outstanding discipline! Time to recharge with a rest break.' 
        : 'Break is up. Ready to crush your next study session?';
      new Notification(title, { body, icon: '/favicon.ico' });
    }

    if (customPhase === 'focus') {
      recordSession(customTotalDuration);
    }

    setCustomStartTimestamp(null);
    setCustomAccumulatedSeconds(0);

    if (isRepeat) {
      const nextPhase: CustomPhase = customPhase === 'focus' ? 'break' : 'focus';
      setCustomPhase(nextPhase);
      const nextDuration = (nextPhase === 'focus' ? settings.pomodoroFocus : settings.pomodoroShortBreak) * 60;
      setCustomTotalDuration(nextDuration);
      setCustomTimeLeft(nextDuration);
      setCustomSessionId(`sess-${Date.now()}`);
      setCustomStartTimestamp(Date.now());
      setCustomStatus('running');
    } else {
      setCustomStatus('finished');
      setCustomTimeLeft(0);
    }
  };

  const handleSetCustomDuration = (minutes: number) => {
    const seconds = Math.max(60, minutes * 60);
    setCustomTotalDuration(seconds);
    setCustomTimeLeft(seconds);
    setCustomStatus('idle');
    setCustomStartTimestamp(null);
    setCustomAccumulatedSeconds(0);
    setCustomSessionId(`sess-${Date.now()}`);
  };

  const handleAdjustCustomTime = (deltaSeconds: number) => {
    setCustomTimeLeft(prev => {
      const next = Math.max(0, prev + deltaSeconds);
      if (customStatus === 'idle') {
        setCustomTotalDuration(next);
      } else {
        setCustomTotalDuration(d => Math.max(0, d + deltaSeconds));
      }
      return next;
    });
  };

  const handleSwitchCustomPhase = (targetPhase: CustomPhase) => {
    if (customPhase === targetPhase) return;

    if (customPhase === 'focus' && (customStatus === 'running' || customStatus === 'paused')) {
      const elapsed = customStartTimestamp ? Math.floor((Date.now() - customStartTimestamp) / 1000) : 0;
      const total = customAccumulatedSeconds + elapsed;
      if (total >= 60) {
        recordSession(total);
      }
    }

    setCustomPhase(targetPhase);
    const targetMin = targetPhase === 'focus' ? settings.pomodoroFocus : settings.pomodoroShortBreak;
    const targetSec = targetMin * 60;
    setCustomTotalDuration(targetSec);
    setCustomTimeLeft(targetSec);
    setCustomStatus('idle');
    setCustomStartTimestamp(null);
    setCustomAccumulatedSeconds(0);
    setCustomSessionId(`sess-${Date.now()}`);
  };

  // Flow State Handlers
  const handleFlowStart = () => {
    getAudioContext();
    const now = Date.now();
    if (flowStatus === 'idle') {
      setFlowSessionId(`flow-${now}`);
      setFlowAccumulatedSeconds(0);
      setFlowElapsedSeconds(0);
      lastMilestoneAnnounced.current = 0;
    }
    setFlowStartTimestamp(now);
    setFlowStatus('running');
  };

  const handleFlowPause = () => {
    if (flowStatus === 'running') {
      const elapsed = flowStartTimestamp ? Math.floor((Date.now() - flowStartTimestamp) / 1000) : 0;
      const total = flowAccumulatedSeconds + elapsed;
      setFlowAccumulatedSeconds(total);
      setFlowElapsedSeconds(total);
      setFlowStartTimestamp(null);
      setFlowStatus('paused');
    }
  };

  const handleFlowFinishAndSave = () => {
    const elapsed = flowStartTimestamp ? Math.floor((Date.now() - flowStartTimestamp) / 1000) : 0;
    const total = flowAccumulatedSeconds + elapsed;

    if (total >= 30) {
      recordSession(total);
      playSound('alarm');
      triggerConfetti();

      const milestone = getFlowMilestone(total);
      const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Study Focus';
      const recommendedBreak = Math.max(5, Math.min(30, Math.round((total / 60) * 0.2)));

      setCompletedFlowSummary({
        duration: total,
        subjectName,
        badge: milestone.badge,
        recommendedBreak
      });
    }

    setFlowStatus('idle');
    setFlowStartTimestamp(null);
    setFlowAccumulatedSeconds(0);
    setFlowElapsedSeconds(0);
    setFlowSessionId(`flow-${Date.now()}`);
    lastMilestoneAnnounced.current = 0;
  };

  const handleFlowReset = () => {
    setFlowStatus('idle');
    setFlowStartTimestamp(null);
    setFlowAccumulatedSeconds(0);
    setFlowElapsedSeconds(0);
    setFlowSessionId(`flow-${Date.now()}`);
    lastMilestoneAnnounced.current = 0;
  };

  const handleSwitchActiveMode = (nextMode: ActiveMode) => {
    if (activeMode === nextMode) return;
    setActiveMode(nextMode);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (activeMode === 'custom') {
          if (customStatus === 'running') handleCustomPause();
          else handleCustomStart();
        } else {
          if (flowStatus === 'running') handleFlowPause();
          else handleFlowStart();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (activeMode === 'custom') handleCustomReset();
        else handleFlowReset();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, customStatus, flowStatus, customTimeLeft, flowElapsedSeconds]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentChapter = chapters.find(c => c.id === selectedChapterId);
  const currentFlowMilestone = getFlowMilestone(flowElapsedSeconds);
  const customProgressPercent = customTotalDuration > 0 
    ? Math.min(100, Math.max(0, ((customTotalDuration - customTimeLeft) / customTotalDuration) * 100))
    : 0;

  return (
    <>
    <div 
      ref={containerRef}
      id="focus-timer-workspace"
      className={`flex flex-col items-center justify-between transition-all duration-500 rounded-[24px] ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-[#09090b] text-white p-6 md:p-12 w-screen h-screen select-none overflow-y-auto' 
          : 'bg-zinc-900/50 border border-zinc-800/80 p-5 md:p-8 text-white shadow-2xl relative overflow-hidden h-full min-h-[540px] backdrop-blur-md'
      }`}
    >

      {/* Background ambient lighting glow */}
      <div 
        className="absolute pointer-events-none transition-all duration-1000 -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] opacity-20"
        style={{
          backgroundColor: activeMode === 'flow' ? currentFlowMilestone.ringColor : '#EAB308'
        }}
      />
      <div 
        className="absolute pointer-events-none transition-all duration-1000 -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-15"
        style={{
          backgroundColor: activeMode === 'flow' ? currentFlowMilestone.ringColor : '#EAB308'
        }}
      />

      {/* 1. TOP HEADER: MODE TOGGLE & CONTROLS */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-10 pb-2">
        {/* Segmented Mode Switch */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-inner">
          <button
            onClick={() => handleSwitchActiveMode('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              activeMode === 'custom'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Clock size={14} />
            <span>Custom Timer</span>
          </button>

          <button
            onClick={() => handleSwitchActiveMode('flow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              activeMode === 'flow'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Zap size={14} />
            <span>Flow State</span>
          </button>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white transition cursor-pointer active:scale-95"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {activeMode === 'custom' && (
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              title={isRepeat ? 'Auto-repeat enabled' : 'Enable auto-repeat cycle'}
              className={`p-2.5 rounded-xl transition border cursor-pointer active:scale-95 ${
                isRepeat
                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40'
                  : 'bg-zinc-950/70 hover:bg-zinc-800 border-zinc-850 text-zinc-400 hover:text-white'
              }`}
            >
              <Repeat size={15} />
            </button>
          )}

          {activeMode === 'flow' && (
            <button
              onClick={() => setMilestoneAlertEnabled(!milestoneAlertEnabled)}
              title={milestoneAlertEnabled ? 'Milestone chimes active (every 25m)' : 'Milestone chimes muted'}
              className={`p-2.5 rounded-xl transition border cursor-pointer active:scale-95 ${
                milestoneAlertEnabled
                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40'
                  : 'bg-zinc-950/70 hover:bg-zinc-800 border-zinc-850 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Bell size={15} />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Focus'}
            className="p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white transition cursor-pointer active:scale-95"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 2. SUB-HEADER: SUBJECT SELECTION & OPTIONAL CHAPTER TAG */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2.5 relative z-40 pt-2 pb-1">
        {/* Subject Pill Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSubjectDropdown(!showSubjectDropdown);
              setShowChapterDropdown(false);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 hover:border-zinc-700 transition cursor-pointer shadow-sm active:scale-95"
          >
            <div 
              className="w-2.5 h-2.5 rounded-full shadow-inner animate-pulse shrink-0"
              style={{ backgroundColor: currentSubject?.color || '#EAB308' }}
            />
            <span className="font-medium max-w-[120px] truncate">
              {currentSubject ? currentSubject.name : 'Select Subject'}
            </span>
            <ChevronDown size={13} className="text-zinc-500" />
          </button>

          {showSubjectDropdown && (
            <>
              {/* Invisible full-screen backdrop to handle click-outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubjectDropdown(false);
                }} 
              />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 max-h-60 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSubjectId(sub.id);
                      setSelectedChapterId('');
                      setShowSubjectDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                      selectedSubjectId === sub.id
                        ? 'bg-zinc-900 text-yellow-400 font-semibold'
                        : 'text-zinc-300 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Optional Chapter Pill Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowChapterDropdown(!showChapterDropdown);
              setShowSubjectDropdown(false);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 hover:border-zinc-700 transition cursor-pointer shadow-sm active:scale-95"
          >
            <BookOpen size={12} className="text-zinc-500 shrink-0" />
            <span className="font-medium max-w-[140px] truncate">
              {currentChapter ? currentChapter.name : 'No Chapter Tag'}
            </span>
            <ChevronDown size={13} className="text-zinc-500" />
          </button>

          {showChapterDropdown && (
            <>
              {/* Invisible full-screen backdrop to handle click-outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChapterDropdown(false);
                }} 
              />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 max-h-64 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedChapterId('');
                    setShowChapterDropdown(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white transition cursor-pointer mb-1"
                >
                  No Chapter (General)
                </button>
                {chapters
                  .filter(c => !selectedSubjectId || c.subjectId === selectedSubjectId)
                  .map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedChapterId(ch.id);
                        setShowChapterDropdown(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs transition truncate cursor-pointer ${
                        selectedChapterId === ch.id
                          ? 'bg-zinc-900 text-yellow-400 font-semibold'
                          : 'text-zinc-300 hover:bg-zinc-900/60'
                      }`}
                    >
                      {ch.order}. {ch.name}
                    </button>
                  ))}
                {chapters.filter(c => !selectedSubjectId || c.subjectId === selectedSubjectId).length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-zinc-500 italic">
                    No chapters available for this subject
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Custom Timer Sub-Phase Toggle */}
        {activeMode === 'custom' && (
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-full border border-zinc-800/70 text-xs">
            <button
              onClick={() => handleSwitchCustomPhase('focus')}
              className={`px-3 py-1 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 ${
                customPhase === 'focus'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Brain size={12} className={customPhase === 'focus' ? 'text-yellow-400' : ''} />
              Focus Sprint
            </button>
            <button
              onClick={() => handleSwitchCustomPhase('break')}
              className={`px-3 py-1 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 ${
                customPhase === 'break'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Coffee size={12} className={customPhase === 'break' ? 'text-cyan-400' : ''} />
              Rest Break
            </button>
          </div>
        )}

        {/* Flow State Milestone Badge */}
        {activeMode === 'flow' && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium animate-fade-in ${currentFlowMilestone.bgColor} ${currentFlowMilestone.borderColor} ${currentFlowMilestone.color}`}>
            <span>{currentFlowMilestone.badge}</span>
            <span className="text-[10px] opacity-75 font-mono">Stage {currentFlowMilestone.stage}/4</span>
          </div>
        )}
      </div>

      {/* 3. CENTER DISPLAY: CLOCK FACE & VISUAL RING */}
      <div className="flex flex-col items-center justify-center flex-grow py-6 z-10 w-full">
        <div className="relative flex items-center justify-center w-full max-w-[290px] md:max-w-[350px] aspect-square">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="44" 
              className="stroke-zinc-900" 
              strokeWidth="2.8" 
              fill="transparent" 
            />

            {activeMode === 'custom' && (
              <circle 
                cx="50" 
                cy="50" 
                r="44" 
                stroke={customPhase === 'focus' ? '#EAB308' : '#38BDF8'}
                strokeWidth="2.8" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - customProgressPercent / 100)}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            )}

            {activeMode === 'flow' && (
              <circle 
                cx="50" 
                cy="50" 
                r="44" 
                stroke={currentFlowMilestone.ringColor}
                strokeWidth="2.8" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - currentFlowMilestone.progress / 100)}
                strokeLinecap="round"
                className={`transition-all duration-500 ${flowStatus === 'running' ? 'opacity-100' : 'opacity-60'}`}
              />
            )}
          </svg>

          <div className="text-center flex flex-col justify-center items-center z-10 px-4">
            {activeMode === 'custom' ? (
              <>
                <span 
                  className={`font-mono leading-none tracking-tight text-white transition-all font-bold ${
                    isFullscreen 
                      ? 'text-7xl md:text-9xl' 
                      : 'text-5xl md:text-6xl'
                  }`}
                >
                  {formatTime(customTimeLeft)}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-zinc-400 mt-2 font-medium">
                  {customPhase === 'focus' ? 'Focus Countdown' : 'Break Time'}
                </span>
              </>
            ) : (
              <>
                <span 
                  className={`font-mono leading-none tracking-tight text-white transition-all font-bold ${
                    isFullscreen 
                      ? 'text-7xl md:text-9xl' 
                      : 'text-5xl md:text-6xl'
                  }`}
                >
                  {formatTime(flowElapsedSeconds)}
                </span>
                <div className="flex flex-col items-center mt-2">
                  <span className={`text-xs font-semibold ${currentFlowMilestone.color}`}>
                    {currentFlowMilestone.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    {flowStatus === 'running' ? 'Focusing uninterrupted' : flowStatus === 'paused' ? 'Flow paused' : 'Ready to start flow'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Custom Presets */}
        {activeMode === 'custom' && !isFullscreen && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-md">
            {[15, 25, 45, 60, 90].map((mins) => {
              const isSelected = customTotalDuration === mins * 60;
              return (
                <button
                  key={mins}
                  onClick={() => handleSetCustomDuration(mins)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isSelected 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-semibold' 
                      : 'bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {mins}m
                </button>
              );
            })}
            <button
              onClick={() => {
                setCustomMinutesInput(String(Math.floor(customTotalDuration / 60)));
                setShowDurationModal(true);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center gap-1 transition cursor-pointer"
            >
              <Sliders size={12} />
              <span>Custom...</span>
            </button>
          </div>
        )}

        {/* Flow Milestone Bar */}
        {activeMode === 'flow' && !isFullscreen && (
          <div className="w-full max-w-sm mt-4 px-4">
            <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1 font-mono">
              <span>{currentFlowMilestone.badge}</span>
              <span>Next: {currentFlowMilestone.nextMilestoneMinutes}m</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/60">
              <div 
                className="h-full transition-all duration-500 rounded-full"
                style={{ 
                  width: `${currentFlowMilestone.progress}%`,
                  backgroundColor: currentFlowMilestone.ringColor 
                }}
              />
            </div>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              {currentFlowMilestone.description}
            </p>
          </div>
        )}
      </div>

      {/* 4. BOTTOM CONTROLS */}
      <div className="w-full flex flex-col items-center gap-4 z-10 pt-2">
        <div className="flex items-center justify-between w-full max-w-[310px] md:max-w-[360px]">
          <div className="flex items-center gap-2.5">
            {activeMode === 'custom' ? (
              <>
                {customStatus === 'running' ? (
                  <button
                    onClick={handleCustomPause}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Pause size={20} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={handleCustomStart}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </button>
                )}

                <button
                  onClick={handleCustomReset}
                  title="Reset Timer (R)"
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw size={15} />
                </button>

                {(customStatus === 'running' || customStatus === 'paused') && (customTotalDuration - customTimeLeft >= 30 || customAccumulatedSeconds >= 30) && (
                  <button
                    onClick={handleCustomFinishAndSave}
                    title="Finish & Save Session"
                    className="px-3 py-2.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check size={14} />
                    <span className="hidden sm:inline">Finish & Save</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {flowStatus === 'running' ? (
                  <button
                    onClick={handleFlowPause}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Pause size={20} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={handleFlowStart}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </button>
                )}

                <button
                  onClick={handleFlowFinishAndSave}
                  title="Finish & Log Flow Session"
                  disabled={flowElapsedSeconds < 10}
                  className={`px-3 py-2.5 rounded-full text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                    flowElapsedSeconds >= 10
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Check size={14} />
                  <span>Finish & Save</span>
                </button>

                <button
                  onClick={handleFlowReset}
                  title="Reset Flow (R)"
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw size={15} />
                </button>
              </>
            )}
          </div>

          {activeMode === 'custom' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAdjustCustomTime(-60)}
                title="-1 minute"
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition cursor-pointer"
              >
                <Minus size={13} />
              </button>
              <span className="text-[10px] font-mono text-zinc-500 px-0.5">Adjust</span>
              <button
                onClick={() => handleAdjustCustomTime(60)}
                title="+1 minute"
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition cursor-pointer"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => handleAdjustCustomTime(300)}
                title="+5 minutes"
                className="px-2 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-[11px] font-medium transition ml-1 cursor-pointer"
              >
                +5m
              </button>
            </div>
          )}

          {activeMode === 'flow' && (
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono block">Mode</span>
              <span className="text-xs text-amber-400 font-medium">Flowtime</span>
            </div>
          )}
        </div>

        {!isFullscreen && (
          <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {activeMode === 'custom' 
                ? `Target: ${formatTime(customTotalDuration)}` 
                : `Active Flow: ${Math.floor(flowElapsedSeconds / 60)}m`}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-yellow-500/80" />
              Today: {sessions.filter(s => s.date.startsWith(new Date().toISOString().slice(0, 10)) && s.type === 'focus').length} focus logged
            </span>
          </div>
        )}
      </div>

      {/* 5. CUSTOM DURATION MODAL */}
      {showDurationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDurationModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" />
              Custom Timer Duration
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              Enter target focus or break duration in minutes.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const mins = parseInt(customMinutesInput, 10);
                if (!isNaN(mins) && mins > 0) {
                  handleSetCustomDuration(mins);
                  setShowDurationModal(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Minutes</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={customMinutesInput}
                  onChange={(e) => setCustomMinutesInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-lg focus:outline-none focus:border-yellow-500 transition"
                  autoFocus
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 45, 60, 90, 120].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCustomMinutesInput(String(m))}
                    className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowDurationModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 transition cursor-pointer"
                >
                  Apply Duration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. FLOW COMPLETION CELEBRATION SUMMARY MODAL */}
      {completedFlowSummary && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4 text-yellow-500">
              <Award size={32} />
            </div>

            <h3 className="text-xl font-bold text-white">Flow Session Completed! 🎉</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Outstanding work! Your deep focus session has been saved to your study log.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-850 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Subject</span>
                <span className="font-semibold text-zinc-200">{completedFlowSummary.subjectName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Duration</span>
                <span className="font-mono font-bold text-yellow-400">
                  {Math.floor(completedFlowSummary.duration / 60)} mins ({formatTime(completedFlowSummary.duration)})
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Milestone Reached</span>
                <span className="font-semibold text-emerald-400">{completedFlowSummary.badge}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              💡 Recommended recharge break based on your flow duration: <strong className="text-cyan-400">{completedFlowSummary.recommendedBreak} minutes</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  const breakMinutes = completedFlowSummary.recommendedBreak;
                  setCompletedFlowSummary(null);
                  setActiveMode('custom');
                  setCustomPhase('break');
                  handleSetCustomDuration(breakMinutes);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Coffee size={14} />
                <span>Take {completedFlowSummary.recommendedBreak}m Break</span>
              </button>

              <button
                onClick={() => setCompletedFlowSummary(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
              >
                Close &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* 7. STUDY HEATMAP (90 days, shown below timer card when not fullscreen) */}
    {!isFullscreen && (
      <div className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 backdrop-blur-md shadow-xl shadow-black/10 mt-0">
        <StudyHeatmap dailyMinutes={dailyMinutes} />
      </div>
    )}
    </>
  );
}


