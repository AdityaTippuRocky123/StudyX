import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Award, 
  Lock, 
  Unlock, 
  Flame, 
  Target, 
  Compass, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Goal, Achievement, Subject, StudyLog, TestMark, TimerSession } from '../types';
import { triggerConfetti } from './Confetti';

interface GoalsAchievementsProps {
  goals: Goal[];
  achievements: Achievement[];
  subjects: Subject[];
  logs: StudyLog[];
  tests: TestMark[];
  sessions: TimerSession[];
  streakDays: number;
  onAddGoal: (goal: Omit<Goal, 'id' | 'completed'>) => void;
  onUpdateGoalProgress: (id: string, value: number) => void;
  onDeleteGoal: (id: string) => void;
  onUnlockAchievement: (id: string) => void;
}

export default function GoalsAchievements({
  goals,
  achievements,
  subjects,
  logs,
  tests,
  sessions,
  streakDays,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
  onUnlockAchievement
}: GoalsAchievementsProps) {
  // Goal Insertion Form
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('hours');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  // Goal increment progress state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [incrementVal, setIncrementVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue || isNaN(Number(targetValue))) return;

    onAddGoal({
      title: title.trim(),
      targetValue: parseFloat(targetValue),
      currentValue: 0,
      unit,
      dueDate
    });

    setTitle('');
    setTargetValue('');
  };

  const handleUpdateProgress = (id: string, currentVal: number, targetVal: number) => {
    const val = parseFloat(incrementVal);
    if (isNaN(val) || val < 0) return;

    const newVal = Math.min(targetVal, currentVal + val);
    onUpdateGoalProgress(id, newVal);

    if (newVal >= targetVal) {
      triggerConfetti();
    }

    setEditingGoalId(null);
    setIncrementVal('');
  };

  return (
    <div id="goals-tab-content" className="space-y-6">
      
      {/* Dynamic Milestones Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Goal Form */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 h-fit space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Target size={16} className="text-yellow-400" />
            Set Study Goal
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Goal Objective</label>
              <input
                type="text"
                required
                placeholder="e.g. Prep calculus essays, Review biology"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Target Volume</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 10"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                >
                  <option value="hours">Hours</option>
                  <option value="sessions">Sessions</option>
                  <option value="pages">Pages</option>
                  <option value="chapters">Chapters</option>
                  <option value="tests">Exams</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/10 transition active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              Publish Goal
            </button>
          </form>
        </div>

        {/* Goals List Display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Compass size={14} />
              Current Study Goals ({goals.length})
            </h3>
            <span className="text-[10px] text-zinc-500">Log progress increments</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => {
              const percent = Math.round((g.currentValue / g.targetValue) * 100);
              const isGoalCompleted = g.currentValue >= g.targetValue;

              return (
                <div 
                  key={g.id}
                  className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 flex flex-col justify-between space-y-4 hover:border-yellow-400/40 transition backdrop-blur-md shadow-xl shadow-black/10"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        {isGoalCompleted && <CheckCircle2 size={14} className="text-yellow-500" />}
                        {g.title}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500">Due: {g.dueDate}</p>
                    </div>

                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Remove Goal"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Progress values display */}
                  <div className="flex items-end justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono">Progression</span>
                      <p className="text-sm font-bold text-white font-mono">
                        {g.currentValue} / {g.targetValue} <span className="text-xs text-zinc-500 font-normal">{g.unit}</span>
                      </p>
                    </div>
                    
                    {/* Tiny gauge percentage display */}
                    <span className="text-xl font-bold text-yellow-500 font-mono">{percent}%</span>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/60">
                    <div 
                      className="h-full bg-yellow-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  {/* Progress update inline toggle form */}
                  {!isGoalCompleted && (
                    <div className="pt-2 border-t border-zinc-900/80">
                      {editingGoalId === g.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="Add amount"
                            value={incrementVal}
                            onChange={(e) => setIncrementVal(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none w-28 font-mono"
                          />
                          <button
                            onClick={() => handleUpdateProgress(g.id, g.currentValue, g.targetValue)}
                            className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded-lg transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingGoalId(null)}
                            className="px-2.5 py-1 text-zinc-500 hover:text-zinc-300 text-xs transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingGoalId(g.id)}
                          className="text-[11px] text-yellow-500 hover:text-yellow-400 font-semibold flex items-center gap-1.5 transition"
                        >
                          + Log progress increment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {goals.length === 0 && (
              <div className="col-span-2 py-16 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/40 flex flex-col items-center justify-center">
                <Target size={30} className="text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Your goal board is empty</p>
                <p className="text-[10px] text-zinc-500 mt-1">Configure study goals on the left to measure progression.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Merit Board */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Award size={14} className="text-yellow-400" />
              Focus Achievements Merit Board
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Unlocks automatically as study metrics grow</p>
          </div>

          <span className="text-[10px] font-mono text-zinc-400 font-semibold">
            Unlocked: {achievements.filter(a => a.unlockedAt !== null).length} / {achievements.length}
          </span>
        </div>

        {/* Badges grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((ach) => {
            const isUnlocked = ach.unlockedAt !== null;

            return (
              <div 
                key={ach.id}
                className={`p-4 rounded-xl border flex flex-col items-center justify-between space-y-3 transition-all duration-300 relative overflow-hidden group ${
                  isUnlocked 
                    ? 'bg-zinc-950 border-yellow-500/25 text-white shadow-lg' 
                    : 'bg-zinc-950/45 border-zinc-900 text-zinc-500 opacity-60'
                }`}
              >
                {/* Status lock top right badge icon */}
                <div className="absolute top-2.5 right-2.5">
                  {isUnlocked ? (
                    <Unlock size={10} className="text-yellow-500/80" />
                  ) : (
                    <Lock size={10} className="text-zinc-700" />
                  )}
                </div>

                {/* Big decorative badge */}
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isUnlocked 
                      ? 'bg-yellow-500/10 text-yellow-400 ring-4 ring-yellow-500/5 group-hover:scale-110' 
                      : 'bg-zinc-900 text-zinc-700'
                  }`}
                >
                  {/* Map icon names */}
                  {ach.icon === 'first_step' && <Sparkles size={20} />}
                  {ach.icon === 'deep_focus' && <Target size={20} />}
                  {ach.icon === 'dedicated' && <Flame size={20} />}
                  {ach.icon === 'grade_peak' && <Award size={20} />}
                  {ach.icon === 'goal_crusher' && <CheckCircle2 size={20} />}
                  {ach.icon === 'omniscient' && <BookOpen size={20} />}
                </div>

                <div className="text-center space-y-0.5">
                  <h4 className={`text-xs font-bold ${isUnlocked ? 'text-zinc-100' : 'text-zinc-600'}`}>
                    {ach.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-snug">{ach.description}</p>
                </div>

                {isUnlocked && ach.unlockedAt && (
                  <span className="text-[8px] font-mono text-zinc-600">
                    Unlocked: {ach.unlockedAt.slice(0, 10)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
