import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle2, 
  FolderPlus,
  HelpCircle
} from 'lucide-react';
import { Subject, StudyLog, TestMark, TimerSession } from '../types';

interface SubjectsProps {
  subjects: Subject[];
  logs: StudyLog[];
  tests: TestMark[];
  sessions: TimerSession[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onDeleteSubject: (id: string) => void;
}

const PALETTE = [
  '#EAB308', // Yellow
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EF4444', // Red
];

export default function Subjects({
  subjects,
  logs,
  tests,
  sessions,
  onAddSubject,
  onDeleteSubject
}: SubjectsProps) {
  // Add Subject Form
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [targetHours, setTargetHours] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddSubject({
      name: name.trim(),
      color,
      targetHours: targetHours ? parseFloat(targetHours) : 20
    });

    setName('');
    setTargetHours('');
  };

  return (
    <div id="subjects-tab-content" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Subject Panel */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 h-fit space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <FolderPlus size={16} className="text-yellow-400" />
            Add New Course
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Course Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Advanced Calculus"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Target Study Time (Hours)</label>
              <input
                type="number"
                min="1"
                max="500"
                placeholder="e.g. 40"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
              />
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Accent Color</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    className={`w-6 h-6 rounded-full border transition-all duration-300 relative ${
                      color === hex 
                        ? 'border-white scale-110 shadow-lg' 
                        : 'border-transparent hover:scale-105 hover:border-zinc-700'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {color === hex && (
                      <span className="absolute inset-0 m-auto w-1 h-1 bg-black rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/10 transition active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              Register Course
            </button>
          </form>
        </div>

        {/* Subjects list feed Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <BookOpen size={14} />
              Active Subjects ({subjects.length})
            </h3>
            <span className="text-[10px] text-zinc-500">Click card trash to remove</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub) => {
              // Calculate statistics for this subject
              const subLogs = logs.filter(l => l.subjectId === sub.id);
              const subSessions = sessions.filter(s => s.subjectId === sub.id && s.type === 'focus');
              
              const loggedHours = subLogs.reduce((sum, l) => sum + l.hours, 0);
              const timerHours = subSessions.reduce((sum, s) => sum + s.duration / 3600, 0);
              const totalHours = Number((loggedHours + timerHours).toFixed(1));
              const percentage = sub.targetHours > 0 ? Math.min(100, Math.round((totalHours / sub.targetHours) * 100)) : 0;

              // Calculate marks average
              const subTests = tests.filter(t => t.subjectId === sub.id);
              const avgMark = subTests.length > 0 
                ? Math.round(subTests.reduce((sum, t) => sum + (t.marks / t.maxMarks) * 100, 0) / subTests.length)
                : null;

              return (
                <div 
                  key={sub.id}
                  className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 hover:border-yellow-400/40 transition-all duration-300 relative group flex flex-col justify-between space-y-4 backdrop-blur-md shadow-xl shadow-black/10"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-inner" 
                        style={{ backgroundColor: sub.color }} 
                      />
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">{sub.name}</h4>
                    </div>

                    <button
                      onClick={() => onDeleteSubject(sub.id)}
                      className="p-1 rounded bg-zinc-950 border border-zinc-900 text-zinc-600 hover:text-red-400 hover:border-red-500/20 transition opacity-0 group-hover:opacity-100"
                      title="Delete Course"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-950 border border-zinc-900/60 p-2.5 rounded-xl">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Clock size={10} />
                        Study Time
                      </span>
                      <p className="text-sm font-semibold text-white font-mono mt-1">{totalHours} hrs</p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-900/60 p-2.5 rounded-xl">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Award size={10} />
                        Avg Grades
                      </span>
                      <p className="text-sm font-semibold text-white font-mono mt-1">
                        {avgMark !== null ? `${avgMark}%` : 'No tests'}
                      </p>
                    </div>
                  </div>

                  {/* Syllabus / Study Hour target percentage */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Goal: {sub.targetHours} Hours</span>
                      <span className="font-mono text-zinc-300 font-semibold">{percentage}% Completed</span>
                    </div>
                    {/* Linear dynamic color bar */}
                    <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%`, backgroundColor: sub.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {subjects.length === 0 && (
              <div className="col-span-2 py-16 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/40 flex flex-col items-center">
                <BookOpen size={30} className="text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Your course list is empty</p>
                <p className="text-[10px] text-zinc-500 mt-1">Add your study syllabus subjects on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
