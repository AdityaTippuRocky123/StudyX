import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Award, 
  Flame, 
  CheckCircle2, 
  Activity, 
  BookOpen, 
  ArrowUpRight, 
  AlertCircle 
} from 'lucide-react';
import { Subject, TestMark } from '../types';

interface TestMarksProps {
  subjects: Subject[];
  tests: TestMark[];
  onAddTest: (test: Omit<TestMark, 'id'>) => void;
  onDeleteTest: (id: string) => void;
}

export default function TestMarks({
  subjects,
  tests,
  onAddTest,
  onDeleteTest
}: TestMarksProps) {
  // New test form state
  const [subjectId, setSubjectId] = useState('');
  const [testName, setTestName] = useState('');
  const [marks, setMarks] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !testName.trim() || !marks || !maxMarks) return;

    const numMarks = parseFloat(marks);
    const numMax = parseFloat(maxMarks);
    if (isNaN(numMarks) || isNaN(numMax) || numMax <= 0 || numMarks < 0 || numMarks > numMax) return;

    onAddTest({
      subjectId,
      testName: testName.trim(),
      marks: numMarks,
      maxMarks: numMax,
      date
    });

    setTestName('');
    setMarks('');
    setMaxMarks('');
  };

  // Calculations
  const completedTests = tests.filter(t => t.marks !== undefined && t.maxMarks !== undefined) as (TestMark & { marks: number, maxMarks: number })[];

  const calculatedTestStats = () => {
    if (completedTests.length === 0) return { avgMarks: 0, avgMax: 0, maxTest: null, minTest: null, total: 0 };
    
    let sumMarks = 0;
    let sumMax = 0;
    let maxTest = completedTests[0];
    let minTest = completedTests[0];

    completedTests.forEach(t => {
      sumMarks += t.marks;
      sumMax += t.maxMarks;
      
      const pct = t.marks / t.maxMarks;
      if (pct > (maxTest.marks / maxTest.maxMarks)) maxTest = t;
      if (pct < (minTest.marks / minTest.maxMarks)) minTest = t;
    });

    const avgMarks = Math.round(sumMarks / completedTests.length);
    const avgMax = Math.round(sumMax / completedTests.length);

    return { avgMarks, avgMax, maxTest, minTest, total: completedTests.length };
  };

  const { avgMarks, avgMax, maxTest, minTest, total } = calculatedTestStats();

  // Sort tests by date for charts
  const sortedTests = [...completedTests].sort((a, b) => a.date.localeCompare(b.date));

  // Chart 1: Trend line over time
  const trendData = sortedTests.map(t => {
    const sub = subjects.find(s => s.id === t.subjectId);
    return {
      date: t.date,
      name: t.testName,
      subject: sub ? sub.name : 'Other',
      marks: t.marks,
      maxMarks: t.maxMarks,
      percentage: Math.round((t.marks / t.maxMarks) * 100)
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#09090b] border border-[#27272a] rounded-[12px] p-3 shadow-xl">
          <p className="text-zinc-200 font-semibold mb-1 text-xs">{data.name}</p>
          <p className="text-yellow-400 font-mono text-[11px] mb-0.5">Marks: {data.marks} / {data.maxMarks}</p>
          <p className="text-zinc-400 font-mono text-[11px] mb-0.5">Percentage: {data.percentage}%</p>
          <p className="text-zinc-500 font-mono text-[10px]">Date: {data.date}</p>
        </div>
      );
    }
    return null;
  };

  // Chart 2: Average score by subject compared
  const getSubjectAveragesData = () => {
    return subjects.map(sub => {
      const subTests = completedTests.filter(t => t.subjectId === sub.id);
      if (subTests.length === 0) return null;
      
      const totalPct = subTests.reduce((sum, t) => sum + (t.marks / t.maxMarks) * 100, 0);
      return {
        subject: sub.name,
        average: Math.round(totalPct / subTests.length),
        color: sub.color
      };
    }).filter(item => item !== null) as any[];
  };

  const subjectAveragesData = getSubjectAveragesData();

  return (
    <div id="test-marks-tab-content" className="space-y-6">
      
      {/* Test Grade Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Average Score</span>
          <p className="text-2xl md:text-3xl font-bold text-white font-mono mt-2">{total > 0 ? `${avgMarks} / ${avgMax}` : 'N/A'}</p>
          <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <Activity size={10} className="text-yellow-500" /> Across {total} tests
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Best Score</span>
          <p className="text-2xl md:text-3xl font-bold text-yellow-400 font-mono mt-2">{maxTest ? `${maxTest.marks} / ${maxTest.maxMarks}` : 'N/A'}</p>
          <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <Award size={10} className="text-yellow-400" /> Highest marks achieved
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Lowest Score</span>
          <p className="text-2xl md:text-3xl font-bold text-zinc-300 font-mono mt-2">{minTest ? `${minTest.marks} / ${minTest.maxMarks}` : 'N/A'}</p>
          <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <AlertCircle size={10} className="text-zinc-500" /> Needs improvement
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-5 rounded-[24px] backdrop-blur-md shadow-lg shadow-black/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Graded Exams</span>
          <p className="text-2xl md:text-3xl font-bold text-white font-mono mt-2">{total}</p>
          <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <CheckCircle2 size={10} className="text-yellow-500/80" /> Recorded tests
          </p>
        </div>
      </div>

      {/* Analytics Visual Charts Row */}
      {completedTests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart over time */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Score Trend Progression</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis dataKey="marks" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="marks" stroke="#EAB308" strokeWidth={2} dot={{ fill: '#EAB308', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Comparisons Bar Chart */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Course Average Comparison</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAveragesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="subject" stroke="#52525b" fontSize={9} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#facc15', fontSize: '11px' }}
                  />
                  <Bar dataKey="average" fill="#EAB308" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Entry Form and Table Logs split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Creation Form */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 h-fit space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <h3 className="text-sm font-semibold text-zinc-100">Log Test Score</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">Course</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50"
              >
                <option value="">Select Course...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">Test / Assignment Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Midterm 1, Essay, Quiz A"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            {/* Score row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">Marks Scored</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="e.g. 18.5"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">Max Marks Possible</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  placeholder="e.g. 20"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">Exam Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/10 transition active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              Save Test Score
            </button>
          </form>
        </div>

        {/* Results table */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 xl:col-span-2 space-y-4 flex flex-col justify-between min-h-[400px] backdrop-blur-md shadow-xl shadow-black/10">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-400" />
              Graded History Records
            </h3>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Marks</th>
                    <th className="py-2.5 px-3">Percentage</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-xs">
                  {sortedTests.reverse().map((test) => {
                    const sub = subjects.find(s => s.id === test.subjectId);
                    const pct = Math.round((test.marks / test.maxMarks) * 100);

                    return (
                      <tr key={test.id} className="hover:bg-zinc-950/40 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub?.color || '#52525b' }} />
                            <span className="text-xs text-zinc-300 font-medium">{sub ? sub.name : 'Other'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-zinc-200 font-medium">{test.testName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-400">
                          {test.marks} / {test.maxMarks}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold">
                          <span className={pct >= 85 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-500">
                          {test.date}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onDeleteTest(test.id)}
                            className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete exam mark"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {completedTests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-600">
                        No graded exam records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 border-t border-zinc-900 pt-3">
            Showing {completedTests.length} recorded exam grades
          </div>
        </div>
      </div>
    </div>
  );
}
