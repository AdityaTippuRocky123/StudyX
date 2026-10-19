import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Plus,
  Trash2,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
  BarChart2,
  Clock,
} from "lucide-react";
import { Subject, StudyLog, TimerSession } from "../types";
import { getLocalDateKey } from "../context/useStudyData";

interface StudyLogsProps {
  subjects: Subject[];
  logs: StudyLog[];
  sessions: TimerSession[];
  onAddLog: (log: Omit<StudyLog, "id">) => void;
  onDeleteLog: (id: string) => void;
}

type RangeType = "weekly" | "monthly" | "alltime";

export default function StudyLogs({ subjects, logs, sessions, onAddLog, onDeleteLog }: StudyLogsProps) {
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(() => getLocalDateKey());
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilterSubject, setSelectedFilterSubject] = useState("all");
  const [range, setRange] = useState<RangeType>("weekly");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !hours || isNaN(Number(hours)) || Number(hours) <= 0) return;
    onAddLog({ subjectId, date, hours: parseFloat(hours), notes: notes.trim() });
    setHours("");
    setNotes("");
  };

  const formattedSessionsAsLogs = useMemo(() =>
    sessions
      .filter((s) => s.type === "focus" || !s.type)
      .map((s) => ({
        id: s.id.startsWith("sess-") ? s.id : `session-${s.id}`,
        subjectId: s.subjectId,
        date: (s.date || "").slice(0, 10),
        hours: Number(((s.durationMin || Math.round((s.duration || 0) / 60)) / 60).toFixed(2)),
        notes: s.notes || (s.source === "manual" ? "Manual study entry" : "Focus timer session"),
        source: s.source || "timer",
      })),
    [sessions]
  );

  const allEntriesCombined = useMemo(() => {
    // Prevent duplicate entries if a manual log is recorded in both logs and sessions
    const sessionIds = new Set(sessions.map((s) => s.id));
    const uniqueLogs = logs.filter((l) => !sessionIds.has(`sess-${l.id}`) && !sessionIds.has(l.id));
    return [...uniqueLogs, ...formattedSessionsAsLogs].sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, formattedSessionsAsLogs, sessions]);

  const buildDailyBySubject = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    allEntriesCombined.forEach((e) => {
      if (!map[e.date]) map[e.date] = {};
      map[e.date][e.subjectId] = (map[e.date][e.subjectId] || 0) + e.hours;
    });
    return map;
  }, [allEntriesCombined]);

  const getChartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const makeBar = (label: string, dateKeys: string[]) => {
      const bar: Record<string, any> = { name: label, _total: 0 };
      subjects.forEach((sub) => {
        const h = dateKeys.reduce((sum, dk) => sum + ((buildDailyBySubject[dk]?.[sub.id]) || 0), 0);
        bar[sub.id] = Number(h.toFixed(2));
        bar._total += h;
      });
      bar._total = Number(bar._total.toFixed(2));
      return bar;
    };

    if (range === "weekly") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const dk = getLocalDateKey(d);
        const label = d.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" });
        return makeBar(label, [dk]);
      });
    }

    if (range === "monthly") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return makeBar(String(i + 1), [getLocalDateKey(d)]);
      });
    }

    const allDates = Object.keys(buildDailyBySubject).sort();
    if (allDates.length === 0) {
      // Empty data handling: display 4 empty weekly placeholder bars
      return Array.from({ length: 4 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (3 - i) * 7);
        const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return makeBar(label, []);
      });
    }

    const firstDate = new Date(allDates[0] + "T00:00:00");
    const spanDays = Math.ceil((today.getTime() - firstDate.getTime()) / 86400000) + 1;

    if (spanDays <= 90) {
      const weeks: { label: string; dateKeys: string[] }[] = [];
      const cursor = new Date(firstDate);
      const dow = cursor.getDay();
      cursor.setDate(cursor.getDate() - (dow === 0 ? 6 : dow - 1));
      while (cursor <= today) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const label = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const dateKeys: string[] = [];
        for (const d = new Date(weekStart); d <= weekEnd && d <= today; d.setDate(d.getDate() + 1)) {
          dateKeys.push(getLocalDateKey(d));
        }
        weeks.push({ label, dateKeys });
        cursor.setDate(cursor.getDate() + 7);
      }
      return weeks.map((w) => makeBar(w.label, w.dateKeys));
    } else {
      const months: { label: string; dateKeys: string[] }[] = [];
      let cy = firstDate.getFullYear();
      let cm = firstDate.getMonth();
      while (cy < today.getFullYear() || (cy === today.getFullYear() && cm <= today.getMonth())) {
        const label = new Date(cy, cm, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
        const daysInM = new Date(cy, cm + 1, 0).getDate();
        const dateKeys = Array.from({ length: daysInM }, (_, i) =>
          getLocalDateKey(new Date(cy, cm, i + 1))
        );
        months.push({ label, dateKeys });
        cm++;
        if (cm > 11) { cm = 0; cy++; }
      }
      return months.map((m) => makeBar(m.label, m.dateKeys));
    }
  }, [range, buildDailyBySubject, subjects]);

  const summaryStats = useMemo(() => {
    const totals = getChartData.map((d) => d._total as number);
    const total = totals.reduce((s, v) => s + v, 0);
    const avg = totals.length > 0 ? total / totals.length : 0;
    const best = totals.length > 0 ? Math.max(0, ...totals) : 0;
    return { total: Number(total.toFixed(1)), avg: Number(avg.toFixed(1)), best: Number(best.toFixed(1)) };
  }, [getChartData]);

  const distributionData = useMemo(() =>
    subjects
      .map((sub) => ({
        name: sub.name,
        hours: Number(allEntriesCombined.filter((e) => e.subjectId === sub.id).reduce((s, e) => s + e.hours, 0).toFixed(1)),
        color: sub.color,
      }))
      .filter((d) => d.hours > 0),
    [subjects, allEntriesCombined]
  );

  const filteredEntries = useMemo(() =>
    allEntriesCombined.filter((entry) => {
      const subject = subjects.find((s) => s.id === entry.subjectId);
      const subjectName = subject ? subject.name.toLowerCase() : "other";
      const matchesSearch =
        entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subjectName.includes(searchTerm.toLowerCase());
      const matchesFilter = selectedFilterSubject === "all" || entry.subjectId === selectedFilterSubject;
      return matchesSearch && matchesFilter;
    }),
    [allEntriesCombined, subjects, searchTerm, selectedFilterSubject]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl min-w-[140px]">
        <p className="text-[11px] font-semibold text-zinc-400 mb-2">{label}</p>
        {[...payload].reverse().map((p: any) =>
          p.value > 0 ? (
            <div key={p.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.fill }} />
                <span className="text-zinc-400 truncate max-w-[80px]">{p.name}</span>
              </div>
              <span className="font-mono text-zinc-200">{Number(p.value).toFixed(1)}h</span>
            </div>
          ) : null
        )}
        <div className="border-t border-zinc-800 mt-2 pt-2 flex justify-between text-[11px]">
          <span className="text-zinc-500">Total</span>
          <span className="font-mono font-bold text-yellow-400">{total.toFixed(1)}h</span>
        </div>
      </div>
    );
  };

  const rangeLabels: Record<RangeType, string> = {
    weekly: "Last 7 Days",
    monthly: "This Month",
    alltime: "All Time",
  };

  return (
    <div id="study-logs-tab-content" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stacked Bar Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 lg:col-span-2 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <BarChart2 size={14} className="text-yellow-400" />
                Daily Study Activity
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Stacked by subject � {rangeLabels[range]}</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
              {(["weekly", "monthly", "alltime"] as RangeType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                    range === r ? "bg-yellow-500 text-black shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {r === "weekly" ? "Week" : r === "monthly" ? "Month" : "All"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: `${summaryStats.total}h`, Icon: Clock },
              { label: "Daily Avg", value: `${summaryStats.avg}h`, Icon: TrendingUp },
              { label: "Best Day", value: `${summaryStats.best}h`, Icon: Sparkles },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Icon size={11} className="text-yellow-500/70" />
                  {label}
                </p>
                <p className="text-base font-bold font-mono text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getChartData}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                barCategoryGap={range === "monthly" ? "8%" : "20%"}
                barGap={0}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#52525b"
                  fontSize={range === "monthly" ? 7 : 9}
                  tickLine={false}
                  interval={range === "monthly" ? 4 : 0}
                />
                <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                {subjects.map((sub, idx) => (
                  <Bar
                    key={sub.id}
                    dataKey={sub.id}
                    name={sub.name}
                    stackId="a"
                    fill={sub.color || "#EAB308"}
                    radius={idx === subjects.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                    maxBarSize={range === "monthly" ? 18 : 36}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {subjects.map((sub) => (
              <div key={sub.id} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: sub.color }} />
                <span>{sub.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 flex flex-col justify-between backdrop-blur-md shadow-xl shadow-black/10">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Subject Distribution</h3>
            <p className="text-[11px] text-zinc-500 mb-4">Total study allocation by course</p>
          </div>

          {distributionData.length > 0 ? (
            <div className="flex-grow space-y-3">
              {distributionData.map((d) => {
                const totalH = distributionData.reduce((s, x) => s + x.hours, 0);
                const pct = totalH > 0 ? (d.hours / totalH) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-mono text-zinc-300">{d.hours}h</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                );
              })}
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

      {/* Form + History Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 h-fit space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Quick Study Logger
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Subject</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50"
              >
                <option value="">Select a subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

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
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Duration</label>
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Notes</label>
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
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <FileText size={16} className="text-yellow-400" />
              Comprehensive Study History
            </h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
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
              <select
                value={selectedFilterSubject}
                onChange={(e) => setSelectedFilterSubject(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
              >
                <option value="all">All Courses</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

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
                  const subject = subjects.find((s) => s.id === entry.subjectId);
                  const isTimerSession = (entry as any).source === 'timer' || (entry.id.startsWith("session-") && (entry as any).source !== 'manual');
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-950/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject?.color || "#52525b" }} />
                          <span className="text-xs text-zinc-300 font-medium">{subject ? subject.name : "Other"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-mono text-zinc-400">{entry.date}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-semibold text-zinc-200 font-mono flex items-center gap-1.5">
                          {entry.hours} hrs
                          {isTimerSession ? (
                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-sans">Timer</span>
                          ) : (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-sans">Manual</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <p className="text-xs text-zinc-400 truncate" title={entry.notes}>
                          {entry.notes || <span className="italic text-zinc-600">No notes written.</span>}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onDeleteLog(entry.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
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
