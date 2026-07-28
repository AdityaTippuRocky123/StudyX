import React, { useState } from 'react';
import { 
  Flame, 
  BookOpen, 
  CheckSquare, 
  Award, 
  Calendar, 
  TrendingUp, 
  Quote, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';
import { Subject, StudyLog, Task, TestMark, Goal, TimerSession, CalendarNote } from '../types';

interface DashboardProps {
  subjects: Subject[];
  logs: StudyLog[];
  tasks: Task[];
  tests: TestMark[];
  goals: Goal[];
  sessions: TimerSession[];
  streakDays: number;
  notes: CalendarNote[];
  setView: (view: string) => void;
}

const QUOTES = [
  { text: "Today a reader, tomorrow a leader.", author: "Margaret Fuller" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" }
];

export default function Dashboard({
  subjects,
  logs,
  tasks,
  tests,
  goals,
  sessions,
  streakDays,
  notes,
  setView
}: DashboardProps) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const changeQuote = () => {
    let nextIdx = Math.floor(Math.random() * QUOTES.length);
    if (nextIdx === quoteIndex) {
      nextIdx = (nextIdx + 1) % QUOTES.length;
    }
    setQuoteIndex(nextIdx);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // Today's study hours calculation (logs + timer sessions today)
  const todayLogsHours = logs
    .filter(log => log.date === todayStr)
    .reduce((sum, log) => sum + log.hours, 0);

  const todaySessionsHours = sessions
    .filter(s => s.date.startsWith(todayStr) && s.type === 'focus')
    .reduce((sum, s) => sum + s.duration / 3600, 0);

  // Total study hours
  const totalLogsHours = logs.reduce((sum, log) => sum + log.hours, 0);
  const totalSessionsHours = sessions
    .filter(s => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration / 3600, 0);

  // Format fractional hours into { hrs, mins }
  const formatHoursAndMinutes = (hoursDecimal: number) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return { hrs, mins };
  };

  const todayTime = formatHoursAndMinutes(todayLogsHours + todaySessionsHours);
  const totalTimeCombined = formatHoursAndMinutes(totalLogsHours + totalSessionsHours);

  // Completed tasks counts
  const completedTasksCount = tasks.filter(t => t.completed).length;

  // Average test score calculation
  const averageTestScore = (() => {
    if (tests.length === 0) return { marks: 0, maxMarks: 0 };
    const sumMarks = tests.reduce((total, t) => total + t.marks, 0);
    const sumMax = tests.reduce((total, t) => total + t.maxMarks, 0);
    return {
      marks: Math.round(sumMarks / tests.length),
      maxMarks: Math.round(sumMax / tests.length)
    };
  })();

  // Filter future tests
  const upcomingTests = tests
    .filter(t => (t.status === 'upcoming' || (!t.status && t.date >= todayStr)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Active Goals
  const activeGoals = goals.slice(0, 3);

  // Productivity Score Calculation (Today)
  const dLogs = logs.filter(s => s.date === todayStr);
  const dTasks = tasks.filter(t => t.dueDate === todayStr && t.completed);
  const dTests = tests.filter(t => t.date === todayStr && t.status === 'completed');
  const dPomodoros = sessions.filter(s => s.date.startsWith(todayStr) && s.type === 'focus');

  const minutesStudied = dLogs.reduce((acc, l) => acc + (l.hours * 60), 0);
  let productivityScore = Math.floor(minutesStudied / 10) * 1;
  productivityScore += dTasks.length * 5;
  productivityScore += dTests.length * 20;
  productivityScore += dPomodoros.length * 5;

  const productivityLabel = productivityScore >= 100 ? 'Incredible Day' : productivityScore > 50 ? 'Excellent Day' : productivityScore > 20 ? 'Good Start' : 'Needs Focus';

  return (
    <div id="dashboard-tab-content" className="space-y-6">
      {/* Metrics Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div 
          onClick={() => setView('logs')}
          className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-4 md:p-5 hover:border-yellow-400/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur-md shadow-xl shadow-black/10"
        >
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-yellow-400/5 blur-2xl rounded-full pointer-events-none group-hover:bg-yellow-400/10 transition-all duration-500" />
          <div className="flex justify-between items-start text-zinc-400 relative z-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Today's Focus</span>
            <BookOpen size={16} className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-0.5 relative z-10">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">{todayTime.hrs}</span>
            <span className="text-xs text-zinc-500 font-medium mr-1">h</span>
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">{todayTime.mins}</span>
            <span className="text-xs text-zinc-500 font-medium">m</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 relative z-10">
            <span>Log session or run timer</span>
            <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Metric 2: Productivity Score */}
        <div 
          onClick={() => setView('calendar')}
          className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-4 md:p-5 hover:border-yellow-400/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur-md shadow-xl shadow-black/10"
        >
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-yellow-400/5 blur-2xl rounded-full pointer-events-none group-hover:bg-yellow-400/10 transition-all duration-500" />
          <div className="flex justify-between items-start text-zinc-400 relative z-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Productivity</span>
            <TrendingUp size={16} className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-1 relative z-10">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">{productivityScore}</span>
            <span className="text-xs text-zinc-500 font-medium">pts</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 relative z-10">
            <span className="text-yellow-500 font-medium">{productivityLabel}</span>
            <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => setView('goals')}
          className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-4 md:p-5 hover:border-yellow-400/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur-md shadow-xl shadow-black/10"
        >
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-yellow-400/5 blur-2xl rounded-full pointer-events-none group-hover:bg-yellow-400/10 transition-all duration-500" />
          <div className="flex justify-between items-start text-zinc-400 relative z-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Study Streak</span>
            <Flame size={16} className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5 relative z-10">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-yellow-400 font-mono">{streakDays}</span>
            <span className="text-xs text-zinc-500 font-medium">days</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 relative z-10">
            <span>Keep it up to unlock badges!</span>
            <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => setView('tests')}
          className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-4 md:p-5 hover:border-yellow-400/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur-md shadow-xl shadow-black/10"
        >
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-yellow-400/5 blur-2xl rounded-full pointer-events-none group-hover:bg-yellow-400/10 transition-all duration-500" />
          <div className="flex justify-between items-start text-zinc-400 relative z-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Average Score</span>
            <Award size={16} className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-1 relative z-10">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">
              {tests.length > 0 ? `${averageTestScore.marks} / ${averageTestScore.maxMarks}` : 'N/A'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 relative z-10">
            <span>Based on {tests.length} tests</span>
            <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>
      </div>

      {/* Primary Panels: Main Tasks + Goals + Tests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Quick Todo Overview */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 lg:col-span-2 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <CheckSquare size={16} className="text-yellow-400" />
              Focus Backlog ({tasks.filter(t => !t.completed).length})
            </h3>
            <button 
              onClick={() => setView('todo')} 
              className="text-[11px] text-zinc-400 hover:text-yellow-400 font-medium transition"
            >
              Manage Tasks
            </button>
          </div>

          <div className="space-y-2">
            {tasks.filter(t => !t.completed).slice(0, 4).map((task) => {
              const sub = subjects.find(s => s.id === task.subjectId);
              return (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0`}
                      style={{ backgroundColor: sub?.color || '#3f3f46' }}
                    />
                    <p className="text-xs text-zinc-300 font-medium truncate">{task.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.priority === 'high' && (
                      <span className="text-[9px] font-semibold bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">High</span>
                    )}
                    {task.dueDate && (
                      <span className="text-[10px] font-mono text-zinc-500">{task.dueDate}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {tasks.filter(t => !t.completed).length === 0 && (
              <div className="p-8 text-center bg-zinc-950 rounded-xl border border-dashed border-zinc-900 space-y-1">
                <p className="text-xs text-zinc-400 font-medium">All caught up!</p>
                <p className="text-[10px] text-zinc-500">Add key study tasks in the To-Do list to stay organized.</p>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Widget & Active Goals */}
        <div className="space-y-6">
          {/* Quote Panel */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 relative overflow-hidden group backdrop-blur-md shadow-xl shadow-black/10">
            <div className="absolute top-0 right-0 p-3 text-zinc-900/40 group-hover:text-yellow-400/10 transition-colors pointer-events-none">
              <Quote size={80} strokeWidth={1.5} />
            </div>

            <div className="relative space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-500 flex items-center gap-1">
                  <Sparkles size={11} />
                  Mindset
                </span>
                <button 
                  onClick={changeQuote}
                  className="p-1 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition"
                  title="Next Quote"
                >
                  <ArrowUpRight size={13} />
                </button>
              </div>
              <p className="text-xs md:text-sm text-zinc-200 leading-relaxed italic font-medium">
                "{QUOTES[quoteIndex].text}"
              </p>
              <p className="text-[11px] text-zinc-500 text-right">— {QUOTES[quoteIndex].author}</p>
            </div>
          </div>

          {/* Goal Highlights */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Target Goals</h4>
              <button 
                onClick={() => setView('goals')}
                className="text-[11px] text-zinc-500 hover:text-yellow-400 transition"
              >
                View Goals
              </button>
            </div>

            <div className="space-y-3">
              {activeGoals.map((g) => {
                const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                return (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium truncate max-w-[70%]">{g.title}</span>
                      <span className="text-zinc-500 font-mono">{g.currentValue}/{g.targetValue} {g.unit}</span>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/60">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {activeGoals.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">No goals defined yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Tests & Subject list row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming tests block */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Calendar size={16} className="text-yellow-400" />
              Upcoming Tests
            </h3>
            <button 
              onClick={() => setView('tests')}
              className="text-[11px] text-zinc-400 hover:text-yellow-400 font-medium transition"
            >
              Log Tests
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingTests.map((test) => {
              const sub = subjects.find(s => s.id === test.subjectId);
              
              const todayTime = new Date(todayStr).getTime();
              const testTime = new Date(test.date).getTime();
              const daysLeft = Math.ceil((testTime - todayTime) / (1000 * 3600 * 24));
              
              let badgeText = '';
              let badgeIcon = '';
              
              if (daysLeft === 0) {
                badgeText = 'Today';
                badgeIcon = '🔥';
              } else if (daysLeft === 1) {
                badgeText = 'Tomorrow';
                badgeIcon = '🔥';
              } else if (daysLeft <= 3) {
                badgeText = `${daysLeft} days left`;
                badgeIcon = '⏳';
              } else {
                badgeText = `${daysLeft} days left`;
                badgeIcon = '📘';
              }

              return (
                <div 
                  key={test.id}
                  className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-zinc-800 transition"
                >
                  <div>
                    <h4 className="text-sm text-zinc-100 font-semibold truncate flex items-center gap-1.5">
                      <span>{badgeIcon}</span> {test.testName}
                    </h4>
                  </div>
                  <div className="text-xs font-mono text-yellow-500 font-medium">{badgeText}</div>
                </div>
              );
            })}

            {upcomingTests.length === 0 && (
              <div className="col-span-3 py-6 text-center text-zinc-500 text-xs bg-zinc-950 rounded-xl border border-zinc-900">
                No upcoming exams found.
              </div>
            )}
          </div>
        </div>

        {/* Subjects list */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <BookOpen size={16} className="text-yellow-400" />
              Syllabus Coverage
            </h3>
            <button 
              onClick={() => setView('subjects')}
              className="text-[11px] text-zinc-400 hover:text-yellow-400 font-medium transition"
            >
              Manage Subjects
            </button>
          </div>

          <div className="space-y-2.5">
            {subjects.slice(0, 3).map((sub) => {
              // Calculate hours studied for this subject
              const subLogsHours = logs
                .filter(l => l.subjectId === sub.id)
                .reduce((sum, l) => sum + l.hours, 0);
              const subSessionsHours = sessions
                .filter(s => s.subjectId === sub.id && s.type === 'focus')
                .reduce((sum, s) => sum + s.duration / 3600, 0);
              const totalSubHours = Number((subLogsHours + subSessionsHours).toFixed(1));
              const percentage = sub.targetHours > 0 ? Math.min(100, Math.round((totalSubHours / sub.targetHours) * 100)) : 0;

              return (
                <div key={sub.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-[30%]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                    <span className="text-xs text-zinc-300 font-medium truncate">{sub.name}</span>
                  </div>
                  <div className="flex-grow">
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%`, backgroundColor: sub.color }}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 min-w-[50px] text-right">
                    {totalSubHours}/{sub.targetHours}h
                  </div>
                </div>
              );
            })}

            {subjects.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-xs bg-zinc-950 rounded-xl border border-zinc-900">
                Create subjects to organize study track!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
