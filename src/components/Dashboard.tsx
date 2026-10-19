import React, { useState } from 'react';
import { 
  Flame, 
  Clock, 
  CheckSquare, 
  Plus, 
  Trash2, 
  BookOpen, 
  ArrowUpRight, 
  ChevronRight,
  Play,
  Sparkles,
  Layers,
  Tag
} from 'lucide-react';
import { useStudyData } from '../context/useStudyData';

interface DashboardProps {
  setView: (view: string) => void;
}

export default function Dashboard({ setView }: DashboardProps) {
  const { 
    subjects, 
    chapters, 
    todayTotalHours, 
    streak, 
    todos, 
    addTodo, 
    toggleTodo, 
    deleteTodo,
    subjectStats,
    sessions 
  } = useStudyData();

  // Todo input state
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [todoFilter, setTodoFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    let subId: string | undefined;
    if (selectedChapterId) {
      const ch = chapters.find(c => c.id === selectedChapterId);
      subId = ch?.subjectId;
    }

    addTodo({
      text: newTodoText.trim(),
      chapterId: selectedChapterId || undefined,
      subjectId: subId
    });

    setNewTodoText('');
    setSelectedChapterId('');
  };

  const filteredTodos = todos.filter(t => {
    if (todoFilter === 'active') return !t.done;
    if (todoFilter === 'completed') return t.done;
    return true;
  });

  return (
    <div id="dashboard-tab-content" className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP ROW: TODAY'S STUDY HOURS + STREAK PILL */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Study Hours Banner with Fire-Emoji Streak Pill */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-6 relative overflow-hidden backdrop-blur-md shadow-xl shadow-black/10 flex flex-col justify-between">
          {/* Subtle warm backdrop glow */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-yellow-500/10 blur-3xl rounded-full pointer-events-none" />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Clock size={14} className="text-yellow-400" />
                Today's Study Hours
              </span>

              {/* Small fire-emoji streak pill (display-only) beside it */}
              <div 
                title={`Consecutive days with study time > 0 minutes`}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200 shadow-sm"
              >
                <span className="text-sm">🔥</span>
                <span className="text-yellow-400 font-mono font-bold">{streak}</span>
                <span className="text-zinc-400 text-[11px] font-normal">{streak === 1 ? 'day streak' : 'days streak'}</span>
              </div>
            </div>

            {/* Large Hours Display */}
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono">
                {todayTotalHours.hrs}
              </span>
              <span className="text-lg text-zinc-500 font-medium mr-2">h</span>
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono">
                {todayTotalHours.mins}
              </span>
              <span className="text-lg text-zinc-500 font-medium">m</span>
            </div>

            <p className="text-xs text-zinc-400 mt-2">
              {streak > 0 
                ? '🔥 Great momentum! Keep studying daily to maintain your active streak.'
                : 'Complete a focus session today to build your consecutive daily streak.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">
              Ready for your next study block?
            </span>
            <button
              onClick={() => setView('timer')}
              className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-yellow-500/20 cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>Launch Focus Timer</span>
            </button>
          </div>
        </div>

        {/* Quick Subject Syllabus Status Card */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-6 space-y-4 backdrop-blur-md shadow-xl shadow-black/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <BookOpen size={14} className="text-yellow-400" />
                Syllabus Tracker
              </h3>
              <button
                onClick={() => setView('subjects')}
                className="text-xs text-yellow-500 hover:text-yellow-400 font-medium flex items-center gap-0.5 transition cursor-pointer"
              >
                <span>View All</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {subjects.map((sub) => {
                const stats = subjectStats[sub.id] || { completedChapters: 0, totalChapters: 0, avgPercentDone: 0 };
                return (
                  <div key={sub.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                        <span className="font-semibold text-zinc-200">{sub.name}</span>
                      </div>
                      <span className="font-mono text-zinc-400 text-[11px]">
                        {stats.completedChapters}/{stats.totalChapters} <span className="text-zinc-600">done</span>
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${stats.avgPercentDone}%`,
                          backgroundColor: sub.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-zinc-500">
            Chapters complete when progress ≥ 90% and ≥ 1 PYQ year is solved.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TO-DO BACKLOG CARD (SORTED INCOMPLETE FIRST, THEN NEWEST) */}
      {/* ========================================================= */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-6 backdrop-blur-md shadow-xl shadow-black/10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckSquare size={18} className="text-yellow-400" />
            <h3 className="text-sm font-bold text-zinc-100">Study To-Dos</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono">
              {todos.filter(t => !t.done).length} active
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {(['all', 'active', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTodoFilter(tab)}
                className={`px-3 py-1 rounded-lg font-medium transition capitalize cursor-pointer ${
                  todoFilter === tab 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Add Input Form with optional Chapter Tag */}
        <form onSubmit={handleAddTodo} className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="What do you need to study next? (e.g. Solve 20 Rotational Motion problems)"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/60 transition"
            />

            {/* Optional Chapter Tag Selector */}
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/60 max-w-xs transition"
            >
              <option value="">No Chapter Tag (General)</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subjectId})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!newTodoText.trim()}
              className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:hover:bg-yellow-500 text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-yellow-500/10 shrink-0"
            >
              <Plus size={15} />
              <span>Add Task</span>
            </button>
          </div>
          <span className="text-[11px] text-zinc-500 block">
            💡 Tip: Tagging a task with a chapter will auto-complete it when you finish that chapter!
          </span>
        </form>

        {/* To-Do Items List (Incomplete first, then newest) */}
        <div className="space-y-2 pt-1">
          {filteredTodos.map((todo) => {
            const linkedChapter = chapters.find(c => c.id === todo.chapterId);
            const linkedSubject = subjects.find(s => s.id === todo.subjectId || s.id === linkedChapter?.subjectId);

            return (
              <div
                key={todo.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  todo.done 
                    ? 'bg-zinc-950/40 border-zinc-900/60 opacity-60' 
                    : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-grow pr-2">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      todo.done
                        ? 'bg-emerald-500 border-emerald-500 text-black'
                        : 'border-zinc-700 hover:border-yellow-500 bg-transparent'
                    }`}
                  >
                    {todo.done && <CheckSquare size={13} strokeWidth={3} />}
                  </button>

                  <span className={`text-xs font-medium truncate ${
                    todo.done ? 'line-through text-zinc-500' : 'text-zinc-200'
                  }`}>
                    {todo.text}
                  </span>

                  {/* Optional Chapter Tag */}
                  {linkedChapter && (
                    <span 
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0"
                      style={{
                        backgroundColor: `${linkedSubject?.color || '#EAB308'}15`,
                        borderColor: `${linkedSubject?.color || '#EAB308'}40`,
                        color: linkedSubject?.color || '#EAB308'
                      }}
                    >
                      <Tag size={10} />
                      <span className="truncate max-w-[150px]">{linkedChapter.name}</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  title="Delete task"
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition cursor-pointer shrink-0 rounded-lg hover:bg-zinc-900"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {filteredTodos.length === 0 && (
            <div className="p-8 text-center bg-zinc-950/60 rounded-xl border border-dashed border-zinc-900 space-y-1">
              <p className="text-xs text-zinc-400 font-medium">No tasks found</p>
              <p className="text-[11px] text-zinc-500">
                {todoFilter === 'completed' ? 'No completed tasks yet.' : 'All caught up! Add a new task above.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
