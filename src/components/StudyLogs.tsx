import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  BookOpen, 
  Sparkles,
  Download
} from 'lucide-react';
import { Subject, StudyLog, TimerSession } from '../types';

interface StudyLogsProps {
  subjects: Subject[];
  logs: StudyLog[];
  sessions: TimerSession[];
  onAddLog: (log: Omit<StudyLog, 'id'>) => void;
  onDeleteLog: (id: string) => void;
}

export default function StudyLogs({
  subjects,
  logs,
  sessions,
  onAddLog,
  onDeleteLog
}: StudyLogsProps) {
  // Form state
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  
  // Filtering & searching
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterSubject, setSelectedFilterSubject] = useState('all');

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !hours || isNaN(Number(hours)) || Number(hours) <= 0) return;

    onAddLog({
      subjectId,
      date,
      hours: parseFloat(hours),
      notes: notes.trim()
    });

    setHours('');
    setNotes('');
  };

  // Combine logs and completed timer sessions to represent comprehensive study times
  const formattedSessionsAsLogs = sessions
    .filter(s => s.type === 'focus')
    .map(s => ({
      id: `session-${s.id}`,
      subjectId: s.subjectId,
      date: s.date.slice(0, 10),
      hours: Number((s.duration / 3600).toFixed(2)),
      notes: 'Focused timer session completed'
    }));

  const allEntriesCombined = [...logs, ...formattedSessionsAsLogs].sort((a, b) => b.date.localeCompare(a.date));

  // Compute stats for charts over the last 7 days
  const getChartData = () => {
    const days = [];
    const dateCursor = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(dateCursor.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      // Calculate total hours on this date
      const dateHours = allEntriesCombined
        .filter(entry => entry.date === dateStr)
        .reduce((sum, entry) => sum + entry.hours, 0);

      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      days.push({
        name: dayLabel,
        hours: Number(dateHours.toFixed(1)),
        dateStr
      });
    }
    return days;
  };

  const chartData = getChartData();

  // Subject hours breakdown for Distribution Chart
  const getSubjectDistributionData = () => {
    return subjects.map(sub => {
      const subHours = allEntriesCombined
        .filter(entry => entry.subjectId === sub.id)
        .reduce((sum, entry) => sum + entry.hours, 0);
      
      return {
        name: sub.name,
        hours: Number(subHours.toFixed(1)),
        color: sub.color
      };
    }).filter(d => d.hours > 0);
  };

  const distributionData = getSubjectDistributionData();

  // Filter logs for table
  const filteredEntries = allEntriesCombined.filter(entry => {
    const subject = subjects.find(s => s.id === entry.subjectId);
    const subjectName = subject ? subject.name.toLowerCase() : 'other';
    const matchesSearch = entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          subjectName.includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilterSubject === 'all' || entry.subjectId === selectedFilterSubject;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div id="study-logs-tab-content" className="space-y-6">
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Study Time Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 lg:col-span-2 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Daily Study Activity</h3>
              <p className="text-[11px] text-zinc-500">Track logged hours over the last 7 days</p>
            </div>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-mono">
              Live Feed
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}
                  itemStyle={{ color: '#facc15', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Distribution */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 flex flex-col justify-between backdrop-blur-md shadow-xl shadow-black/10">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Subject Distribution</h3>
            <p className="text-[11px] text-zinc-500 mb-4">Total study allocation by course</p>
          </div>

          {distributionData.length > 0 ? (
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" horizontal={false} />
                  <XAxis type="number" stroke="#52525b" fontSize={9} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} width={65} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="hours" fill="#CA8A04" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center py-8">
              <p className="text-xs text-zinc-500 italic text-center">No hours allocated yet.</p>
            </div>
          )}

          <div className="border-t border-zinc-900 pt-3 mt-3 flex justify-between items-center text-[11px] text-zinc-500">
            <span>Cumulative hours</span>
            <span className="font-mono text-white font-medium">
              {allEntriesCombined.reduce((sum, e) => sum + e.hours, 0).toFixed(1)} hrs
            </span>
          </div>
        </div>
      </div>

      {/* Main Study Log Entry Form & History Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 h-fit space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Quick Study Logger
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Subject</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50"
              >
                <option value="">Select a subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Date and Hours row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Study Duration</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="24"
                    required
                    placeholder="e.g. 1.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500">hrs</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Session Notes / Topics Covered</label>
              <textarea
                placeholder="Detail key chapters, equations studied..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/10 active:scale-95 transition"
            >
              <Plus size={14} strokeWidth={2.5} />
              Submit Study Log
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 xl:col-span-2 space-y-4 flex flex-col justify-between min-h-[400px] backdrop-blur-md shadow-xl shadow-black/10">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <FileText size={16} className="text-yellow-400" />
              Comprehensive Study History
            </h3>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search input */}
              <div className="relative flex-grow md:flex-grow-0">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 w-full md:w-44"
                />
              </div>

              {/* Filter dropdown */}
              <div className="relative">
                <select
                  value={selectedFilterSubject}
                  onChange={(e) => setSelectedFilterSubject(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                >
                  <option value="all">All Courses</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-grow overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time Spent</th>
                  <th className="py-2.5 px-3">Study Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {filteredEntries.map((entry) => {
                  const subject = subjects.find(s => s.id === entry.subjectId);
                  const isTimerSession = entry.id.startsWith('session-');
                  
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-950/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject?.color || '#52525b' }} />
                          <span className="text-xs text-zinc-300 font-medium">{subject ? subject.name : 'Other'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-mono text-zinc-400">{entry.date}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-semibold text-zinc-200 font-mono flex items-center gap-1.5">
                          {entry.hours} hrs
                          {isTimerSession && (
                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.2 rounded font-sans">Timer</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <p className="text-xs text-zinc-400 truncate" title={entry.notes}>
                          {entry.notes || <span className="italic text-zinc-600">No notes written.</span>}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isTimerSession ? (
                          <button
                            onClick={() => onDeleteLog(entry.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                            title="Delete log"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-600 italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-600 text-xs">
                      No matching log entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-4 border-t border-zinc-900 pt-3">
            <span>Showing {filteredEntries.length} log entry records</span>
            <span>Total effort: {filteredEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
