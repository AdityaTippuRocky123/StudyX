import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Award, 
  TrendingUp, 
  Clock, 
  Flame, 
  BookOpen, 
  CheckSquare, 
  BarChart2, 
  Percent, 
  Smile, 
  ChevronDown 
} from 'lucide-react';
import { Subject, StudyLog, Task, TestMark, TimerSession } from '../types';

interface AnalyticsProps {
  subjects: Subject[];
  logs: StudyLog[];
  tasks: Task[];
  tests: TestMark[];
  sessions: TimerSession[];
  streakDays: number;
}

export default function Analytics({
  subjects,
  logs,
  tasks,
  tests,
  sessions,
  streakDays
}: AnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'7days' | '30days'>('7days');

  // Combine logs and completed sessions
  const combinedLogs = [
    ...logs.map(l => ({ date: l.date, hours: l.hours, subjectId: l.subjectId })),
    ...sessions.filter(s => s.type === 'focus').map(s => ({
      date: s.date.slice(0, 10),
      hours: s.duration / 3600,
      subjectId: s.subjectId
    }))
  ];

  // Helper calculations
  const totalStudyHours = combinedLogs.reduce((sum, l) => sum + l.hours, 0);
  
  const totalTasksCompleted = tasks.filter(t => t.completed).length;

  // Best & Worst Subjects
  const getSubjectPerf = () => {
    const grades = subjects.map(sub => {
      const subTests = tests.filter(t => t.subjectId === sub.id);
      if (subTests.length === 0) return { id: sub.id, name: sub.name, avg: null, color: sub.color };
      const avg = subTests.reduce((sum, t) => sum + (t.marks / t.maxMarks) * 100, 0) / subTests.length;
      return { id: sub.id, name: sub.name, avg: Math.round(avg), color: sub.color };
    }).filter(s => s.avg !== null) as { id: string; name: string; avg: number; color: string }[];

    if (grades.length === 0) return { best: 'No tests logged', worst: 'No tests logged' };

    const sorted = [...grades].sort((a, b) => b.avg - a.avg);
    return {
      best: `${sorted[0].name} (${sorted[0].avg}%)`,
      worst: `${sorted[sorted.length - 1].name} (${sorted[sorted.length - 1].avg}%)`
    };
  };

  const { best, worst } = getSubjectPerf();

  // Most Studied Subject
  const getMostStudiedSubject = () => {
    if (subjects.length === 0 || combinedLogs.length === 0) return 'None';
    
    const totals = subjects.map(sub => {
      const hours = combinedLogs.filter(l => l.subjectId === sub.id).reduce((sum, l) => sum + l.hours, 0);
      return { name: sub.name, hours };
    });

    const sorted = totals.sort((a, b) => b.hours - a.hours);
    return sorted[0].hours > 0 ? `${sorted[0].name} (${sorted[0].hours.toFixed(1)}h)` : 'None';
  };

  const mostStudied = getMostStudiedSubject();

  // Data processing: Study Hours Trend over last 7 or 30 days
  const getTrendData = () => {
    const limit = timeframe === '7days' ? 7 : 30;
    const list = [];
    const today = new Date();

    for (let i = limit - 1; i >= 0; i--) {
      const cursor = new Date();
      cursor.setDate(today.getDate() - i);
      const dateStr = cursor.toISOString().slice(0, 10);

      const dayHours = combinedLogs
        .filter(l => l.date === dateStr)
        .reduce((sum, l) => sum + l.hours, 0);

      const label = cursor.toLocaleDateString(undefined, { 
        month: timeframe === '7days' ? 'short' : 'numeric', 
        day: 'numeric' 
      });

      list.push({
        name: label,
        hours: Number(dayHours.toFixed(1))
      });
    }
    return list;
  };

  const trendData = getTrendData();

  // Data processing: Weekday Distribution analysis (e.g. Mon, Tue)
  const getWeekdayLoadData = () => {
    const weekdayHours = Array(7).fill(0);
    const weekdayCount = Array(7).fill(0);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    combinedLogs.forEach(log => {
      const d = new Date(log.date + 'T00:00:00');
      const dayIdx = d.getDay();
      if (!isNaN(dayIdx)) {
        weekdayHours[dayIdx] += log.hours;
        weekdayCount[dayIdx] += 1;
      }
    });

    return dayNames.map((name, idx) => ({
      name,
      hours: Number(weekdayHours[idx].toFixed(1)),
      average: weekdayCount[idx] > 0 ? Number((weekdayHours[idx] / weekdayCount[idx]).toFixed(1)) : 0
    }));
  };

  const weekdayLoadData = getWeekdayLoadData();

  // Data processing: Subject comparison pie chart
  const getSubjectShares = () => {
    return subjects.map(sub => {
      const hours = combinedLogs.filter(l => l.subjectId === sub.id).reduce((sum, l) => sum + l.hours, 0);
      return {
        name: sub.name,
        value: Number(hours.toFixed(1)),
        color: sub.color
      };
    }).filter(d => d.value > 0);
  };

  const subjectSharesData = getSubjectShares();

  return (
    <div id="analytics-tab-content" className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <div className="flex justify-between text-zinc-500">
            <span className="text-[10px] uppercase font-semibold">Total Study Hours</span>
            <Clock size={14} className="text-yellow-500" />
          </div>
          <h4 className="text-2xl md:text-3xl font-bold font-mono mt-2 text-white">
            {totalStudyHours.toFixed(1)} <span className="text-xs text-zinc-500">hrs</span>
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1.5">Across logged times & timers</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <div className="flex justify-between text-zinc-500">
            <span className="text-[10px] uppercase font-semibold">Study Streak</span>
            <Flame size={14} className="text-yellow-400" />
          </div>
          <h4 className="text-2xl md:text-3xl font-bold font-mono mt-2 text-yellow-400">
            {streakDays} <span className="text-xs text-zinc-500">days</span>
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1.5">Keep learning daily to progress</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <div className="flex justify-between text-zinc-500">
            <span className="text-[10px] uppercase font-semibold">Assignments Solved</span>
            <CheckSquare size={14} className="text-emerald-500" />
          </div>
          <h4 className="text-2xl md:text-3xl font-bold font-mono mt-2 text-white">
            {totalTasksCompleted}
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1.5">Completed backlogs cleared</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <div className="flex justify-between text-zinc-500">
            <span className="text-[10px] uppercase font-semibold">Most Studied</span>
            <BookOpen size={14} className="text-blue-400" />
          </div>
          <h4 className="text-sm font-semibold truncate mt-3 text-white">
            {mostStudied}
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1.5">Primary course focus share</p>
        </div>

      </div>

      {/* Advanced performance highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between backdrop-blur-md">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase text-zinc-500 font-semibold tracking-wider">Top Performing Subject</span>
            <p className="text-xs font-semibold text-zinc-200">{best}</p>
          </div>
          <Award size={20} className="text-yellow-400" />
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between backdrop-blur-md">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase text-zinc-500 font-semibold tracking-wider">Subject Needing Work</span>
            <p className="text-xs font-semibold text-zinc-200">{worst}</p>
          </div>
          <Award size={20} className="text-zinc-500" />
        </div>
      </div>

      {/* Analytics Visual Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main trend area chart */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 lg:col-span-2 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BarChart2 size={13} className="text-yellow-400" /> Study Hours Volume
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Track cumulative study activity time</p>
            </div>

            <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
              <button
                onClick={() => setTimeframe('7days')}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold transition ${
                  timeframe === '7days' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                7d
              </button>
              <button
                onClick={() => setTimeframe('30days')}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold transition ${
                  timeframe === '30days' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                30d
              </button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#facc15', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#colorStudy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course distribution shares pie chart */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 flex flex-col justify-between backdrop-blur-md shadow-xl shadow-black/10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Subject Time Breakdown</h3>
            <p className="text-[10px] text-zinc-500">Distribution of hours across curriculum</p>
          </div>

          {subjectSharesData.length > 0 ? (
            <div className="h-44 w-full flex items-center justify-center relative mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectSharesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectSharesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Inner overlay details */}
              <div className="absolute inset-0 m-auto flex flex-col justify-center items-center pointer-events-none">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Total</span>
                <span className="text-sm font-semibold text-white font-mono">{totalStudyHours.toFixed(1)}h</span>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center py-10">
              <p className="text-xs text-zinc-600 italic text-center">No study distribution loaded.</p>
            </div>
          )}

          {/* Miniature index/keys */}
          <div className="space-y-1 mt-4">
            {subjectSharesData.slice(0, 4).map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] text-zinc-400">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate">{entry.name}</span>
                </div>
                <span className="font-mono text-zinc-300 font-medium">{entry.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekday load pattern Analysis row */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Weekday Focus Intensity</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Analyses daily load habits to optimize study schedule</p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayLoadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                itemStyle={{ color: '#eab308', fontSize: '11px' }}
              />
              <Bar dataKey="hours" fill="#EAB308" radius={[4, 4, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
