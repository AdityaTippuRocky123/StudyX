import React, { useState, useEffect, useRef } from 'react';
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
  History, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { Subject, TimerSession, AppSettings } from '../types';
import { triggerConfetti } from './Confetti';

interface TimerProps {
  subjects: Subject[];
  settings: AppSettings;
  onAddSession: (session: TimerSession) => void;
  sessions: TimerSession[];
}

export default function Timer({ subjects, settings, onAddSession, sessions }: TimerProps) {
  // Timer states
  const [getSavedTimerState] = useState(() => {
    try {
      const saved = localStorage.getItem('studyx_timer_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [mode, setMode] = useState<'focus' | 'break'>(() => {
    const saved = getSavedTimerState;
    return saved?.mode || 'focus';
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = getSavedTimerState;
    if (saved?.isRunning && saved?.mode === 'focus') {
      return settings.pomodoroFocus * 60;
    }
    return saved?.timeLeft !== undefined ? saved.timeLeft : settings.pomodoroFocus * 60;
  });

  const [totalDuration, setTotalDuration] = useState<number>(() => {
    const saved = getSavedTimerState;
    if (saved?.isRunning && saved?.mode === 'focus') {
      return settings.pomodoroFocus * 60;
    }
    return saved?.totalDuration !== undefined ? saved.totalDuration : settings.pomodoroFocus * 60;
  });

  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>(() => {
    const saved = getSavedTimerState;
    if (saved?.timerStatus) return saved.timerStatus;
    return saved?.isRunning ? 'running' : 'idle';
  });
  const isRunning = timerStatus === 'running';
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    const saved = getSavedTimerState;
    return saved?.selectedSubjectId || subjects[0]?.id || '';
  });
  const [isRepeat, setIsRepeat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Session tracking states
  const [sessionId, setSessionId] = useState<string>(() => {
    const saved = getSavedTimerState;
    return saved?.sessionId || `sess-${Date.now()}`;
  });

  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(() => {
    const saved = getSavedTimerState;
    if (saved?.isRunning && saved?.mode === 'focus') {
      return 0; // Fresh state since it was logged on crash/reload
    }
    return saved?.accumulatedSeconds || 0;
  });

  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);

  // Audio mute
  const [isMuted, setIsMuted] = useState(false);

  // References
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync with settings when they change (if not running)
  useEffect(() => {
    if (timerStatus === 'idle') {
      const targetMin = mode === 'focus' ? settings.pomodoroFocus : settings.pomodoroShortBreak;
      const targetSec = targetMin * 60;
      if (totalDuration === targetSec || !getSavedTimerState) {
        setTimeLeft(targetSec);
        setTotalDuration(targetSec);
      }
    }
  }, [settings, mode, timerStatus]);

  // Persist timer state to LocalStorage
  const saveTimerState = (statusOverwrite?: 'idle' | 'running' | 'paused' | 'finished', currentLeft?: number) => {
    const activeStatus = statusOverwrite !== undefined ? statusOverwrite : timerStatus;
    const activeTimeLeft = currentLeft !== undefined ? currentLeft : timeLeft;

    const stateObj = {
      sessionId,
      mode,
      timerStatus: activeStatus,
      isRunning: activeStatus === 'running', // Keep for backward compatibility
      timeLeft: activeTimeLeft,
      totalDuration,
      selectedSubjectId,
      startTimestamp,
      accumulatedSeconds,
      lastSavedTimestamp: Date.now()
    };
    localStorage.setItem('studyx_timer_state', JSON.stringify(stateObj));

    const token = localStorage.getItem('studyx_auth_token');
    if (token) {
      fetch('/api/user/data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timerState: stateObj })
      }).catch(() => {});
    }
  };

  // Sync state to LocalStorage whenever key states change
  useEffect(() => {
    saveTimerState();
  }, [mode, timerStatus, timeLeft, totalDuration, selectedSubjectId, startTimestamp, accumulatedSeconds, sessionId]);

  // Handle countdown
  useEffect(() => {
    if (isRunning && startTimestamp) {
      intervalRef.current = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        const totalElapsed = accumulatedSeconds + currentElapsed;
        const nextVal = Math.max(0, totalDuration - totalElapsed);
        
        setTimeLeft(nextVal);
        
        if (nextVal <= 0) {
          clearInterval(intervalRef.current!);
          setTimerStatus('finished');
          handleTimerComplete();
        } else {
          saveTimerState('running', nextVal);
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
  }, [isRunning, startTimestamp, accumulatedSeconds, totalDuration]);

  // Log on unload/close/refresh
  useEffect(() => {
    const handleUnload = () => {
      if (isRunning && mode === 'focus') {
        const currentElapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;
        const totalElapsed = accumulatedSeconds + currentElapsed;

        if (totalElapsed > 0) {
          const savedSessions = localStorage.getItem('study_sessions');
          const currentSessions = savedSessions ? JSON.parse(savedSessions) : [];

          const exists = currentSessions.some((s: any) => s.id === sessionId);
          if (!exists) {
            const unloadSession = {
              id: sessionId,
              duration: totalElapsed,
              date: new Date().toISOString(),
              subjectId: selectedSubjectId || 'other',
              type: 'focus'
            };
            currentSessions.push(unloadSession);
            localStorage.setItem('study_sessions', JSON.stringify(currentSessions));

            // Prevent double recovery logging on load
            const stateStr = localStorage.getItem('studyx_timer_state');
            if (stateStr) {
              const stateObj = JSON.parse(stateStr);
              stateObj.isRunning = false;
              stateObj.accumulatedSeconds = 0;
              localStorage.setItem('studyx_timer_state', JSON.stringify(stateObj));
            }
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isRunning, mode, startTimestamp, accumulatedSeconds, selectedSubjectId, sessionId]);

  // Handle native audio synthesis for notification chime
  const playChime = () => {
    if (isMuted || settings.alarmSound === 'off') return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (settings.alarmSound === 'zen' || settings.alarmSound === 'bell') {
        // Beautiful decaying warm bell
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        // Base frequency for warm tone (A4 = 440, C5 = 523.25)
        osc.frequency.setValueAtTime(523.25, now);
        
        // Add metallic harmonics
        const osc2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now); // G5 (fifth harmonic)
        
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        
        gainNode2.gain.setValueAtTime(0.15, now);
        gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc2.connect(gainNode2);
        gainNode2.connect(ctx.destination);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 2.5);
        osc2.stop(now + 2.5);
      } else {
        // Electronic high-fidelity digital chime beep sequence
        const now = ctx.currentTime;
        const notes = [587.33, 659.25, 880.00]; // D5, E5, A5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          
          gainNode.gain.setValueAtTime(0.15, now + idx * 0.15);
          gainNode.gain.setValueAtTime(0.15, now + idx * 0.15 + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.12);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.2);
        });
      }
    } catch (e) {
      console.warn("Audio Context blocked or failed to load:", e);
    }
  };

  const handleTimerComplete = () => {
    // Play sound and trigger visual celebration
    playChime();
    triggerConfetti();

    // Browser Notification support
    if (settings.notificationsEnabled && Notification.permission === 'granted') {
      const title = mode === 'focus' ? 'Focus Session Completed!' : 'Break Finished!';
      const body = mode === 'focus' ? 'Incredible focus! Time to rest.' : 'Ready to start studying again?';
      new Notification(title, { body, icon: '/favicon.ico' });
    }

    // Save actual completed session
    if (mode === 'focus') {
      const currentElapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;
      const totalElapsed = accumulatedSeconds + currentElapsed;
      let logDuration = totalElapsed > 0 ? totalElapsed : totalDuration;
      if (logDuration > totalDuration) {
        logDuration = totalDuration;
      }

      onAddSession({
        id: sessionId,
        duration: logDuration,
        date: new Date().toISOString(),
        subjectId: selectedSubjectId || 'other',
        type: 'focus'
      });
    }

    setAccumulatedSeconds(0);
    setStartTimestamp(null);

    // Handle repeat or toggle mode
    if (isRepeat) {
      // Restart current mode
      setTimeLeft(totalDuration);
      setSessionId(`sess-${Date.now()}`);
      setStartTimestamp(Date.now());
      setTimerStatus('running');
    } else {
      // Toggle to other mode
      const nextMode = mode === 'focus' ? 'break' : 'focus';
      setMode(nextMode);
      const targetMin = nextMode === 'focus' ? settings.pomodoroFocus : settings.pomodoroShortBreak;
      setTimeLeft(targetMin * 60);
      setTotalDuration(targetMin * 60);
      setTimerStatus('idle');
      setSessionId(`sess-${Date.now()}`);
    }
  };

  // Start the timer
  const handleStart = () => {
    if (accumulatedSeconds === 0 && mode === 'focus' && timeLeft === totalDuration) {
      setSessionId(`sess-${Date.now()}`);
    }
    
    const expectedAccumulated = totalDuration - Math.max(0, timeLeft);
    if (accumulatedSeconds !== expectedAccumulated) {
      setAccumulatedSeconds(expectedAccumulated);
    }
    
    setStartTimestamp(Date.now());
    setTimerStatus('running');
  };

  // Pause the timer
  const handlePause = () => {
    if (timerStatus === 'running') {
      const currentElapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;
      const totalElapsed = accumulatedSeconds + currentElapsed;
      setAccumulatedSeconds(totalElapsed);
      setStartTimestamp(null);
      setTimerStatus('paused');

      if (mode === 'focus' && totalElapsed > 0) {
        let logDuration = totalElapsed > totalDuration ? totalDuration : totalElapsed;
        onAddSession({
          id: sessionId,
          duration: logDuration,
          date: new Date().toISOString(),
          subjectId: selectedSubjectId || 'other',
          type: 'focus'
        });
      }
    }
  };

  // Reset the timer
  const handleReset = () => {
    if (mode === 'focus' && (timerStatus === 'running' || timerStatus === 'paused')) {
      const currentElapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;
      const totalElapsed = accumulatedSeconds + currentElapsed;
      if (totalElapsed > 0) {
        let logDuration = totalElapsed > totalDuration ? totalDuration : totalElapsed;
        onAddSession({
          id: sessionId,
          duration: logDuration,
          date: new Date().toISOString(),
          subjectId: selectedSubjectId || 'other',
          type: 'focus'
        });
      }
    }
    setTimerStatus('idle');
    setStartTimestamp(null);
    setAccumulatedSeconds(0);
    const targetMin = mode === 'focus' ? settings.pomodoroFocus : settings.pomodoroShortBreak;
    setTimeLeft(targetMin * 60);
    setTotalDuration(targetMin * 60);
    setSessionId(`sess-${Date.now()}`);
  };

  // Switch modes gracefully
  const handleSwitchMode = (targetMode: 'focus' | 'break') => {
    if (mode === targetMode) return;

    if (mode === 'focus' && (timerStatus === 'running' || timerStatus === 'paused')) {
      const currentElapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;
      const totalElapsed = accumulatedSeconds + currentElapsed;
      if (totalElapsed > 0) {
        let logDuration = totalElapsed > totalDuration ? totalDuration : totalElapsed;
        onAddSession({
          id: sessionId,
          duration: logDuration,
          date: new Date().toISOString(),
          subjectId: selectedSubjectId || 'other',
          type: 'focus'
        });
      }
    }

    setMode(targetMode);
    const targetMin = targetMode === 'focus' ? settings.pomodoroFocus : settings.pomodoroShortBreak;
    setTimeLeft(targetMin * 60);
    setTotalDuration(targetMin * 60);
    setTimerStatus('idle');
    setStartTimestamp(null);
    setAccumulatedSeconds(0);
    setSessionId(`sess-${Date.now()}`);
  };

  // Adjust time (+ / - mins)
  const adjustTime = (amountSeconds: number) => {
    setTimeLeft((prev) => {
      const newVal = Math.max(0, prev + amountSeconds);
      if (!isRunning) {
        setTotalDuration(newVal);
      } else {
        setTotalDuration(d => Math.max(0, d + amountSeconds));
      }
      return newVal;
    });
  };

  // Format helper (mm:ss or hh:mm:ss)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const pad = (num: number) => String(num).padStart(2, '0');
    
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

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

  // Listen to escape or exit fullscreen manually via browser UI
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div 
      ref={containerRef}
      id="study-timer-container"
      className={`flex flex-col items-center justify-center transition-all duration-500 rounded-[24px] ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-black text-white p-6 md:p-12 w-screen h-screen select-none' 
          : 'bg-zinc-900/50 border border-zinc-800/80 p-6 md:p-8 text-white shadow-2xl relative overflow-hidden h-full min-h-[460px] flex flex-col justify-between backdrop-blur-md'
      }`}
    >
      {/* Header Controls */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSwitchMode('focus')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
              mode === 'focus' 
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/40'
            }`}
          >
            <Brain size={13} />
            Focus
          </button>
          <button
            onClick={() => handleSwitchMode('break')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
              mode === 'break' 
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/40'
            }`}
          >
            <Coffee size={13} />
            Break
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute alarm" : "Mute alarm"}
            className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-800/40"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            onClick={() => setIsRepeat(!isRepeat)}
            title={isRepeat ? "Loop mode active" : "Enable loop mode"}
            className={`p-2 rounded-xl transition border ${
              isRepeat 
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800/40'
            }`}
          >
            <Repeat size={15} />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Focus"}
            className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-800/40"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main Clock Face & Subject allocation */}
      <div className="flex flex-col items-center justify-center flex-grow py-8 z-10 w-full">
        {/* Subject Indicator Pill */}
        {mode === 'focus' && (
          <div className="relative mb-3">
            <button
              onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-700 transition"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-inner animate-pulse" 
                style={{ backgroundColor: currentSubject?.color || '#71717a' }}
              />
              <span>{currentSubject ? currentSubject.name : 'Choose Subject'}</span>
              <ChevronDown size={12} className="text-zinc-500" />
            </button>

            {showSubjectDropdown && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 max-h-56 overflow-y-auto bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-2xl z-30 p-1">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      if (selectedSubjectId !== sub.id && mode === 'focus') {
                        const currentElapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;
                        const totalElapsed = accumulatedSeconds + currentElapsed;
                        if (totalElapsed > 0) {
                          let logDuration = totalElapsed > totalDuration ? totalDuration : totalElapsed;
                          onAddSession({
                            id: sessionId,
                            duration: logDuration,
                            date: new Date().toISOString(),
                            subjectId: selectedSubjectId || 'other',
                            type: 'focus'
                          });
                        }
                        setAccumulatedSeconds(0);
                        setStartTimestamp(isRunning ? Date.now() : null);
                        setSessionId(`sess-${Date.now()}`);
                      }
                      setSelectedSubjectId(sub.id);
                      setShowSubjectDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-zinc-300 hover:bg-zinc-900 transition ${
                      selectedSubjectId === sub.id ? 'bg-zinc-900/80 font-medium' : ''
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
                {subjects.length === 0 && (
                  <p className="p-3 text-center text-zinc-500 text-[11px]">No subjects loaded.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic circular track behind large digits */}
        <div className="relative flex items-center justify-center w-full max-w-[280px] md:max-w-[340px] aspect-square">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle 
              cx="50" 
              cy="50" 
              r="44" 
              className="stroke-zinc-900" 
              strokeWidth="2.5" 
              fill="transparent" 
            />
            {/* Active Progress */}
            <circle 
              cx="50" 
              cy="50" 
              r="44" 
              className="stroke-yellow-500 transition-all duration-300" 
              strokeWidth="2.5" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)}
              strokeLinecap="round"
            />
          </svg>

          {/* Large digits */}
          <div className="text-center flex flex-col justify-center items-center z-10">
            <span 
              className={`font-mono leading-none tracking-tight text-white transition-all font-semibold ${
                isFullscreen 
                  ? 'text-8xl md:text-[10rem]' 
                  : 'text-5xl md:text-6xl'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500 mt-2 font-medium">
              {mode === 'focus' ? 'Study Focus Session' : 'Rest Break'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons Group */}
      <div className="w-full flex flex-col items-center gap-4 z-10">
        <div className="flex items-center justify-between w-full max-w-[280px] md:max-w-[340px]">
          {/* Start / Pause Controls on Left */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-500/20 active:scale-95 transition-all duration-300"
              >
                <Pause size={18} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-500/20 active:scale-95 transition-all duration-300"
              >
                <Play size={18} fill="currentColor" className="ml-1" />
              </button>
            )}

            <button
              onClick={handleReset}
              title="Reset Timer"
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition active:scale-95"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Quick Increment/Decrement Controls on Right */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustTime(-60)}
              title="-1 minute"
              className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition"
            >
              <Minus size={13} />
            </button>
            <span className="text-[11px] font-mono text-zinc-500 px-1">Adjust</span>
            <button
              onClick={() => adjustTime(60)}
              title="+1 minute"
              className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => adjustTime(300)}
              title="+5 minutes"
              className="w-10 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-[11px] font-medium transition ml-1"
            >
              +5m
            </button>
          </div>
        </div>

        {/* Small Session Info footer */}
        {!isFullscreen && (
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              Session Goal: {formatTime(totalDuration)}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-yellow-500/80" />
              Today: {sessions.filter(s => s.date.startsWith(new Date().toISOString().slice(0, 10))).length} focused
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
