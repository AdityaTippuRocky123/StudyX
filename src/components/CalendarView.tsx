import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  BookOpen, 
  CheckSquare, 
  Award,
  Sparkles,
  Plus,
  X,
  FileText,
  Trash2,
  Clock,
  Flame
} from 'lucide-react';
import { Subject, StudyLog, Task, TestMark, TimerSession, CalendarNote } from '../types';

interface CalendarViewProps {
  subjects: Subject[];
  logs: StudyLog[];
  tasks: Task[];
  tests: TestMark[];
  sessions: TimerSession[];
  notes: CalendarNote[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'order'>) => void;
  onEditTask: (id: string, updated: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddTest: (test: Omit<TestMark, 'id'>) => void;
  onEditTest: (id: string, updated: Partial<TestMark>) => void;
  onDeleteTest: (id: string) => void;
  onAddNote: (note: Omit<CalendarNote, 'id'>) => void;
  onEditNote: (id: string, updated: Partial<CalendarNote>) => void;
  onDeleteNote: (id: string) => void;
}

export default function CalendarView({
  subjects,
  logs,
  tasks,
  tests,
  sessions,
  notes,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAddTest,
  onEditTest,
  onDeleteTest,
  onAddNote,
  onEditNote,
  onDeleteNote
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'task' | 'exam' | 'note'>('task');
  
  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [formEstDuration, setFormEstDuration] = useState('');
  const [formNotesText, setFormNotesText] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Combine logs and completed timer sessions
  const combinedStudySessions = [
    ...logs.map(l => ({ date: l.date, hours: l.hours, note: l.notes, type: 'manual', subjectId: l.subjectId })),
    ...sessions.filter(s => s.type === 'focus').map(s => ({
      date: s.date.slice(0, 10),
      hours: s.duration / 3600,
      note: 'Timer focus session',
      type: 'timer',
      subjectId: s.subjectId
    }))
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const pad = (num: number) => String(num).padStart(2, '0');
    calendarCells.push({ day, dateStr: `${year}-${pad(month + 1)}-${pad(day)}`, dayOfWeek: new Date(year, month, day).getDay() });
  }

  const selectedDayLogs = combinedStudySessions.filter(s => s.date === selectedDateStr);
  const selectedDayTasks = tasks.filter(t => t.dueDate === selectedDateStr);
  const selectedDayTests = tests.filter(t => t.date === selectedDateStr);
  const selectedDayNotes = notes.filter(n => n.date === selectedDateStr);

  const todayStr = new Date().toISOString().slice(0, 10);

  const calculateProductivityScore = (dateStr: string) => {
    const dLogs = combinedStudySessions.filter(s => s.date === dateStr);
    const dTasks = tasks.filter(t => t.dueDate === dateStr && t.completed);
    const dTests = tests.filter(t => t.date === dateStr && (t.status === 'completed' || (!t.status && dateStr < todayStr)));
    const dPomodoros = sessions.filter(s => s.date.startsWith(dateStr) && s.type === 'focus');

    const minutesStudied = dLogs.reduce((acc, l) => acc + (l.hours * 60), 0);
    let score = Math.floor(minutesStudied / 10) * 1; // 1 pt per 10 mins
    score += dTasks.length * 5; // 5 pts per completed task
    score += dTests.length * 20; // 20 pts per completed exam
    score += dPomodoros.length * 5; // 5 extra pts per pomodoro session
    return score;
  };

  const openAddModal = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setFormTitle('');
    setFormSubjectId(subjects[0]?.id || '');
    setFormPriority('medium');
    setFormEstDuration('');
    setFormNotesText('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalTab === 'task') {
      if (!formTitle) return;
      onAddTask({
        title: formTitle,
        subjectId: formSubjectId,
        priority: formPriority,
        dueDate: selectedDateStr,
        estimatedDuration: formEstDuration ? parseInt(formEstDuration) : undefined
      });
    } else if (modalTab === 'exam') {
      if (!formTitle) return;
      onAddTest({
        testName: formTitle,
        subjectId: formSubjectId,
        date: selectedDateStr,
        notes: formNotesText,
        status: new Date(selectedDateStr) < new Date(todayStr) ? 'completed' : 'upcoming'
      });
    } else if (modalTab === 'note') {
      if (!formNotesText) return;
      onAddNote({
        text: formNotesText,
        date: selectedDateStr,
        subjectId: formSubjectId || undefined
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div id="calendar-tab-content" className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
      
      {/* Calendar Month Grid Card */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 xl:col-span-2 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
        
        {/* Navigation bar Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-yellow-500" />
            <h3 className="text-sm font-semibold text-zinc-100 font-sans uppercase tracking-wider">
              {monthName} {year}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white transition">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-900 text-[10px] uppercase font-semibold text-zinc-400 hover:text-white transition">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Days of week titles */}
        <div className="grid grid-cols-7 gap-1 text-center border-b border-zinc-900/60 pb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <span key={d} className={`text-[10px] font-semibold uppercase tracking-widest ${i === 0 || i === 6 ? 'text-zinc-600' : 'text-zinc-500'}`}>{d}</span>
          ))}
        </div>

        {/* Month grid body */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg" />;
            }

            const { day, dateStr, dayOfWeek } = cell;
            const isSelected = selectedDateStr === dateStr;
            const isToday = todayStr === dateStr;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const cTasks = tasks.filter(t => t.dueDate === dateStr);
            const cTests = tests.filter(t => t.date === dateStr);
            const cLogs = combinedStudySessions.filter(s => s.date === dateStr);
            const cNotes = notes.filter(n => n.date === dateStr);

            // Indicators
            // Planned Study Task (Yellow), Upcoming Exam (Blue), Study Session Logged (Green), Overdue Task (Red), Completed Exam (Purple)
            const hasStudySession = cLogs.length > 0;
            const hasPlannedTask = cTasks.some(t => !t.completed && dateStr >= todayStr);
            const hasOverdueTask = cTasks.some(t => !t.completed && dateStr < todayStr);
            const hasUpcomingExam = cTests.some(t => (t.status === 'upcoming' || t.status === undefined) && dateStr >= todayStr);
            const hasCompletedExam = cTests.some(t => t.status === 'completed' || (t.status === undefined && dateStr < todayStr));

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                onDoubleClick={() => openAddModal(dateStr)}
                onMouseEnter={() => setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`aspect-square p-1.5 rounded-xl border flex flex-col justify-between items-center transition relative group ${
                  isSelected 
                    ? 'bg-zinc-800 text-white border-zinc-500 shadow-lg' 
                    : isToday
                      ? 'bg-zinc-950 border-yellow-500 text-yellow-500 font-bold'
                      : isWeekend
                        ? 'bg-zinc-950/40 border-zinc-900/50 hover:border-zinc-800 text-zinc-600 hover:text-zinc-400'
                        : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-mono font-semibold">{day}</span>
                
                {/* Event Countdown Badge for Future Exam */}
                {hasUpcomingExam && dateStr > todayStr && (
                   <span className="absolute -top-1 -right-1 bg-blue-500 text-black text-[9px] font-bold px-1 rounded-sm shadow-md">
                     {Math.ceil((new Date(dateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24))}d
                   </span>
                )}

                {/* Event tags bar */}
                <div className="flex gap-1 flex-wrap justify-center items-center mt-1 w-full px-1">
                  {hasPlannedTask && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                  {hasUpcomingExam && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  {hasStudySession && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                  {hasOverdueTask && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                  {hasCompletedExam && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </div>

                {/* Hover Tooltip */}
                {hoveredDate === dateStr && (cTasks.length > 0 || cTests.length > 0 || cLogs.length > 0 || cNotes.length > 0) && (
                  <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg p-2 shadow-2xl pointer-events-none">
                    <p className="font-bold border-b border-zinc-800 pb-1 mb-1 text-yellow-500">{dateStr}</p>
                    {cTasks.length > 0 && <p><span className="text-yellow-400">{cTasks.length}</span> tasks</p>}
                    {cTests.length > 0 && <p><span className="text-blue-400">{cTests.length}</span> exams</p>}
                    {cNotes.length > 0 && <p><span className="text-zinc-400">{cNotes.length}</span> notes</p>}
                    {cLogs.length > 0 && <p><span className="text-green-400">{cLogs.reduce((acc,l)=>acc+l.hours,0).toFixed(1)}</span> hrs studied</p>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date detail sidebar panel */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-5 flex flex-col justify-between backdrop-blur-md shadow-xl shadow-black/10">
        <div className="space-y-4">
          <div className="border-b border-zinc-900 pb-3 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-semibold text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> Agenda Details
              </span>
              <h4 className="text-sm font-semibold text-white font-mono mt-1">{selectedDateStr}</h4>
            </div>
            <button onClick={() => openAddModal(selectedDateStr)} className="bg-yellow-500 hover:bg-yellow-400 text-black p-1.5 rounded-lg transition active:scale-95 shadow-lg shadow-yellow-500/20">
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-5 max-h-[460px] overflow-y-auto pr-1">
            
            {/* Tasks */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <CheckSquare size={11} /> Today's Tasks ({selectedDayTasks.length})
              </h5>
              <div className="space-y-1.5">
                {selectedDayTasks.map((task) => {
                  const sub = subjects.find(s => s.id === task.subjectId);
                  return (
                    <div key={task.id} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 text-xs flex justify-between items-center group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button 
                          onClick={() => onEditTask(task.id, { completed: !task.completed })}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${task.completed ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-zinc-700 text-transparent'}`}
                        >
                          <CheckSquare size={10} />
                        </button>
                        <div className="flex flex-col min-w-0">
                           <span className={`truncate text-zinc-300 ${task.completed ? 'line-through text-zinc-600' : ''}`}>{task.title}</span>
                           <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                             {sub && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: sub.color}}/>{sub.name}</span>}
                             {task.estimatedDuration && <span className="flex items-center gap-0.5"><Clock size={9}/> {task.estimatedDuration}m</span>}
                           </div>
                        </div>
                      </div>
                      <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
                {selectedDayTasks.length === 0 && <p className="text-[11px] text-zinc-600 italic pl-1">No tasks scheduled.</p>}
              </div>
            </div>

            {/* Exams */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Award size={11} /> Exams / Tests ({selectedDayTests.length})
              </h5>
              <div className="space-y-1.5">
                {selectedDayTests.map((test) => {
                  const sub = subjects.find(s => s.id === test.subjectId);
                  const isUpcoming = test.status === 'upcoming' || (!test.status && selectedDateStr > todayStr);
                  return (
                    <div key={test.id} className="bg-zinc-950 p-2.5 rounded-xl border border-blue-900/30 text-xs group">
                      <div className="flex justify-between font-semibold text-zinc-300">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub?.color || '#3b82f6' }} />
                            {test.testName}
                          </span>
                          {isUpcoming && <span className="text-[9px] text-blue-400 mt-0.5 uppercase tracking-wider">Upcoming Exam</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isUpcoming && test.marks !== undefined && (
                            <span className="font-mono text-yellow-400">{test.marks}/{test.maxMarks}</span>
                          )}
                          <button onClick={() => onDeleteTest(test.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {test.notes && <p className="text-[10px] text-zinc-500 mt-1">{test.notes}</p>}
                    </div>
                  );
                })}
                {selectedDayTests.length === 0 && <p className="text-[11px] text-zinc-600 italic pl-1">No exams on this date.</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <FileText size={11} /> Personal Notes ({selectedDayNotes.length})
              </h5>
              <div className="space-y-1.5">
                {selectedDayNotes.map((note) => (
                    <div key={note.id} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 text-xs group flex justify-between items-start">
                      <p className="text-zinc-400 whitespace-pre-wrap flex-1">{note.text}</p>
                      <button onClick={() => onDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition ml-2">
                        <Trash2 size={12} />
                      </button>
                    </div>
                ))}
                {selectedDayNotes.length === 0 && <p className="text-[11px] text-zinc-600 italic pl-1">No notes.</p>}
              </div>
            </div>

            {/* Study Sessions */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={11} /> Completed Sessions ({selectedDayLogs.length})
              </h5>
              <div className="space-y-1.5">
                {selectedDayLogs.map((log, idx) => {
                  const sub = subjects.find(s => s.id === log.subjectId);
                  return (
                    <div key={idx} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 text-xs">
                      <div className="flex justify-between font-medium text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub?.color || '#52525b' }} />
                          {sub ? sub.name : 'Other'}
                        </span>
                        <span className="font-mono text-green-400 font-semibold">{log.hours.toFixed(1)} hrs</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 italic leading-snug">{log.note || 'No notes added.'}</p>
                    </div>
                  );
                })}
                {selectedDayLogs.length === 0 && <p className="text-[11px] text-zinc-600 italic pl-1">No focus logged.</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Selected Day aggregation tracker */}
        <div className="border-t border-zinc-900 pt-3 flex justify-between items-center text-[11px] text-zinc-400">
          <span>Productivity</span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-semibold text-white font-mono flex items-center gap-1">
              {calculateProductivityScore(selectedDateStr)} pts
              {calculateProductivityScore(selectedDateStr) > 50 && <Flame size={12} className="text-yellow-500"/>}
            </span>
            <span className="text-[9px] text-yellow-500 font-medium">
              {calculateProductivityScore(selectedDateStr) >= 100 ? 'Incredible Day' : calculateProductivityScore(selectedDateStr) > 50 ? 'Excellent Day' : calculateProductivityScore(selectedDateStr) > 20 ? 'Good Start' : 'Needs Focus'}
            </span>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <CalendarIcon size={16} className="text-yellow-500"/> Plan for {selectedDateStr}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition"><X size={16}/></button>
            </div>
            
            <div className="flex border-b border-zinc-900 text-xs font-semibold">
              <button onClick={() => setModalTab('task')} className={`flex-1 py-3 transition ${modalTab === 'task' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}>Study Task</button>
              <button onClick={() => setModalTab('exam')} className={`flex-1 py-3 transition ${modalTab === 'exam' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}>Scheduled Exam</button>
              <button onClick={() => setModalTab('note')} className={`flex-1 py-3 transition ${modalTab === 'note' ? 'text-zinc-100 border-b-2 border-zinc-100 bg-zinc-100/5' : 'text-zinc-500 hover:text-zinc-300'}`}>Personal Note</button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              {modalTab !== 'note' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{modalTab === 'task' ? 'Task Title' : 'Exam Title'}</label>
                  <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition" placeholder={`e.g. ${modalTab === 'task' ? 'Read Chapter 4' : 'Physics Midterm'}`} />
                </div>
              )}

              {modalTab !== 'note' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Subject</label>
                  <select required value={formSubjectId} onChange={(e) => setFormSubjectId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition">
                    <option value="" disabled>Select subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {modalTab === 'task' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Priority</label>
                    <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Est. Mins (Opt)</label>
                    <input type="number" value={formEstDuration} onChange={(e) => setFormEstDuration(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition" placeholder="e.g. 60" />
                  </div>
                </div>
              )}

              {(modalTab === 'exam' || modalTab === 'note') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Notes</label>
                  <textarea value={formNotesText} required={modalTab === 'note'} onChange={(e) => setFormNotesText(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition resize-none" placeholder={modalTab === 'note' ? 'Write a personal note for this day...' : 'Optional exam notes...'} />
                </div>
              )}

              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 rounded-xl transition shadow-lg shadow-yellow-500/20 active:scale-[0.98]">
                Save to Calendar
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
