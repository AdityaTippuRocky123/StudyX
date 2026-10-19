import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Layers, 
  Check, 
  AlertCircle,
  FileText,
  Sliders,
  Filter
} from 'lucide-react';
import { useStudyData } from '../context/useStudyData';
import { Chapter, ChemistryGroup } from '../types';

export default function Subjects() {
  const { 
    subjects, 
    chapters, 
    progress, 
    updateChapterProgress, 
    isChapterCompleted, 
    getChapterUnmetReason,
    chapterHours,
    subjectStats 
  } = useStudyData();

  // Active Subject Tab: 'physics' | 'chemistry' | 'maths'
  const [activeSubjectId, setActiveSubjectId] = useState<'physics' | 'chemistry' | 'maths'>('physics');

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'in_progress'>('all');

  // Expanded Chapter Detail (expand row accordion)
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // Local draft notes for debounced autosaving
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];
  const activeStats = subjectStats[activeSubjectId] || { completedChapters: 0, totalChapters: 0, avgPercentDone: 0, totalHours: 0 };

  // Filter chapters for current subject
  const subjectChapters = chapters.filter(c => c.subjectId === activeSubjectId);

  // Apply search and filter
  const applyFilters = (chapterList: Chapter[]) => {
    return chapterList.filter(c => {
      const cp = progress[c.id];
      const completed = isChapterCompleted(c.id);

      if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filterMode === 'completed' && !completed) return false;
      if (filterMode === 'in_progress' && completed) return false;

      return true;
    });
  };

  const handleNotesChange = (chapterId: string, text: string) => {
    setDraftNotes(prev => ({ ...prev, [chapterId]: text }));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateChapterProgress(chapterId, { notes: text });
    }, 500);
  };

  const handleTogglePyqYear = (chapterId: string, year: 2022 | 2023 | 2024 | 2025 | 2026) => {
    const cp = progress[chapterId] || {
      chapterId,
      percentDone: 0,
      pyq: { 2022: false, 2023: false, 2024: false, 2025: false, 2026: false },
      notes: ''
    };

    const currentPyq = cp.pyq || { 2022: false, 2023: false, 2024: false, 2025: false, 2026: false };
    const nextPyq = {
      ...currentPyq,
      [year]: !currentPyq[year]
    };

    updateChapterProgress(chapterId, { pyq: nextPyq });
  };

  const handlePercentChange = (chapterId: string, percent: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    updateChapterProgress(chapterId, { percentDone: clamped });
  };

  // Render Chapter Row & Expandable Detail
  const renderChapterRow = (chapter: Chapter) => {
    const cp = progress[chapter.id] || {
      chapterId: chapter.id,
      percentDone: 0,
      pyq: { 2022: false, 2023: false, 2024: false, 2025: false, 2026: false },
      notes: ''
    };

    const isCompleted = isChapterCompleted(chapter.id);
    const unmetReason = getChapterUnmetReason(chapter.id);
    const isExpanded = expandedChapterId === chapter.id;

    // Count PYQs checked (x/5)
    const pyqTickedCount = cp.pyq ? Object.values(cp.pyq).filter(Boolean).length : 0;
    const hours = chapterHours[chapter.id] || 0;
    const currentNotes = draftNotes[chapter.id] !== undefined ? draftNotes[chapter.id] : (cp.notes || '');

    return (
      <div 
        key={chapter.id}
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          isExpanded 
            ? 'bg-zinc-950 border-zinc-700/80 shadow-2xl' 
            : 'bg-zinc-950/70 border-zinc-900 hover:border-zinc-800'
        }`}
      >
        {/* Main Row Bar */}
        <div 
          onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
        >
          {/* Chapter Order & Name */}
          <div className="flex items-center gap-3 min-w-0 md:w-1/3">
            <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-mono font-bold text-zinc-400 shrink-0">
              {chapter.order}
            </span>
            <div className="min-w-0">
              <h4 className={`text-xs md:text-sm font-semibold truncate ${
                isCompleted ? 'text-zinc-100 font-bold' : 'text-zinc-200'
              }`}>
                {chapter.name}
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">
                {hours > 0 ? `${hours}h logged` : 'No study time logged yet'}
              </span>
            </div>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="flex items-center gap-3 md:w-1/4">
            <div className="flex-grow h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${cp.percentDone}%`,
                  backgroundColor: isCompleted ? '#10B981' : (activeSubject.color || '#EAB308')
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-zinc-300 w-10 text-right">
              {cp.percentDone}%
            </span>
          </div>

          {/* PYQ Count Badge & Completion Badge */}
          <div className="flex items-center justify-between md:justify-end gap-3 md:w-1/3">
            {/* PYQ count (x/5) */}
            <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
              pyqTickedCount > 0 
                ? 'bg-zinc-900 text-zinc-300 border-zinc-800' 
                : 'bg-zinc-950 text-zinc-600 border-zinc-900'
            }`}>
              PYQs: <strong>{pyqTickedCount}/5</strong>
            </span>

            {/* Completed badge or unmet condition pill */}
            {isCompleted ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Completed</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                {unmetReason || 'In Progress'}
              </span>
            )}

            <button 
              className="text-zinc-500 hover:text-zinc-200 transition p-1"
              aria-label="Expand chapter details"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Expandable Chapter Detail (Slider, 5 PYQ checkboxes, Debounced Notes) */}
        {isExpanded && (
          <div className="px-5 pb-5 pt-3 border-t border-zinc-900/80 bg-zinc-900/30 space-y-5 animate-in fade-in">
            {/* Live completion feedback banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              isCompleted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {isCompleted ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>
                  {isCompleted
                    ? 'All completion requirements fulfilled! (Progress ≥ 90% and at least 1 PYQ year solved).'
                    : unmetReason 
                      ? `Requirement unmet: ${unmetReason}.` 
                      : 'Complete at least 90% and solve at least 1 PYQ year to mark complete.'}
                </span>
              </div>
            </div>

            {/* Progress Slider & Input */}
            <div className="space-y-2 bg-zinc-950/80 p-4 rounded-xl border border-zinc-900">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sliders size={14} className="text-yellow-400" />
                  Syllabus Progress (% Done)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cp.percentDone}
                    onChange={(e) => handlePercentChange(chapter.id, Number(e.target.value))}
                    className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-yellow-500"
                  />
                  <span className="text-xs text-zinc-500">%</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={cp.percentDone}
                onChange={(e) => handlePercentChange(chapter.id, Number(e.target.value))}
                className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 25, 50, 75, 90, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePercentChange(chapter.id, p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      cp.percentDone === p
                        ? 'bg-yellow-500 text-black font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Five PYQ Checkboxes: 2022, 2023, 2024, 2025, 2026 */}
            <div className="space-y-2 bg-zinc-950/80 p-4 rounded-xl border border-zinc-900">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-300">Previous Years Question (PYQ) Solved</span>
                <span className="text-[11px] font-mono text-zinc-500">{pyqTickedCount}/5 years</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {([2022, 2023, 2024, 2025, 2026] as const).map((year) => {
                  const isChecked = !!cp.pyq?.[year];
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleTogglePyqYear(chapter.id, year)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isChecked
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-zinc-700'
                      }`}>
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span>{year} PYQ</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Short Notes Textarea (Autosaved with Debounce) */}
            <div className="space-y-1.5 bg-zinc-950/80 p-4 rounded-xl border border-zinc-900">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText size={13} className="text-yellow-400" />
                  Chapter Notes & Key Formulas
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Autosaved</span>
              </div>
              <textarea
                rows={3}
                placeholder="Write quick notes, formula reminders, or mistake analysis for this chapter..."
                value={currentNotes}
                onChange={(e) => handleNotesChange(chapter.id, e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 transition resize-y"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="subjects-tracker-tab-content" className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP HEADER: 3 SUBJECT TABS */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Three Subject Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner w-full sm:w-auto">
          {subjects.map((sub) => {
            const isTabActive = activeSubjectId === sub.id;
            const stats = subjectStats[sub.id] || { completedChapters: 0, totalChapters: 0 };
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveSubjectId(sub.id as any);
                  setExpandedChapterId(null);
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isTabActive
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: isTabActive ? '#000' : (sub.color || '#EAB308') }} 
                />
                <span>{sub.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isTabActive ? 'bg-black/20 text-black font-extrabold' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {stats.totalChapters}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search chapter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/60 transition"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUBJECT HEADER OVERVIEW (COMPLETED / TOTAL & AVG % DONE) */}
      {/* ========================================================= */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-6 backdrop-blur-md shadow-xl shadow-black/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSubject.color }} />
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {activeSubject.name} Curriculum
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              ({activeStats.totalChapters} Chapters)
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Track syllabus progress, previous years question solving, and revision notes.
          </p>
        </div>

        {/* Stats Pills in Header */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Completed Count Pill */}
          <div className="bg-zinc-950 border border-zinc-850 px-4 py-2.5 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">Completed</span>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {activeStats.completedChapters} / {activeStats.totalChapters} <span className="text-xs text-zinc-500 font-normal">chapters</span>
            </div>
          </div>

          {/* Average % Done Pill */}
          <div className="bg-zinc-950 border border-zinc-850 px-4 py-2.5 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">Avg Completion</span>
            <div className="text-sm font-bold font-mono text-yellow-400">
              {activeStats.avgPercentDone}% <span className="text-xs text-zinc-500 font-normal">overall</span>
            </div>
          </div>

          {/* Total Time Studied Pill */}
          <div className="bg-zinc-950 border border-zinc-850 px-4 py-2.5 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">Time Studied</span>
            <div className="text-sm font-bold font-mono text-zinc-200">
              {activeStats.totalHours}h <span className="text-xs text-zinc-500 font-normal">total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs (All / In Progress / Completed) */}
      <div className="flex items-center gap-2 text-xs">
        {(['all', 'in_progress', 'completed'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer capitalize ${
              filterMode === mode
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {mode.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 3. CHAPTERS LIST (WITH SPECIAL CHEMISTRY GROUPING) */}
      {/* ========================================================= */}
      <div className="space-y-6">
        {activeSubjectId === 'chemistry' ? (
          // Chemistry is grouped under Physical / Inorganic / Organic headers
          (['Physical', 'Inorganic', 'Organic'] as ChemistryGroup[]).map((groupName) => {
            const groupChapters = subjectChapters.filter(c => c.group === groupName);
            const filteredGroupChapters = applyFilters(groupChapters);
            const completedInGroup = groupChapters.filter(c => isChapterCompleted(c.id)).length;

            return (
              <div key={groupName} className="space-y-3">
                {/* Group Header */}
                <div className="flex items-center justify-between px-2 pt-2 border-b border-zinc-850 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-zinc-100">
                      {groupName} Chemistry
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono">
                      ({groupChapters.length} Chapters)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {completedInGroup} / {groupChapters.length} completed
                  </span>
                </div>

                {/* Group Chapter Rows */}
                <div className="space-y-2">
                  {filteredGroupChapters.map(renderChapterRow)}
                  {filteredGroupChapters.length === 0 && (
                    <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-900">
                      No chapters match filter in {groupName} Chemistry.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          // Physics and Mathematics: Direct ordered list
          <div className="space-y-2">
            {applyFilters(subjectChapters).map(renderChapterRow)}
            {applyFilters(subjectChapters).length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-900">
                No chapters match the selected search or filter.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
