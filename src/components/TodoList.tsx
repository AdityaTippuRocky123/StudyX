import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Calendar, 
  AlertCircle, 
  Filter, 
  CheckCircle, 
  FolderMinus, 
  Tag, 
  ArrowUpDown,
  Edit2
} from 'lucide-react';
import { Subject, Task } from '../types';
import { triggerConfetti } from './Confetti';

interface TodoListProps {
  subjects: Subject[];
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'order'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (id: string, updated: Partial<Task>) => void;
}

export default function TodoList({
  subjects,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask
}: TodoListProps) {
  // New task form state
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');

  // Filtering / search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'none'>('none');

  // Edit states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      subjectId: subjectId || (subjects[0]?.id || 'other'),
      priority,
      dueDate: dueDate || new Date().toISOString().slice(0, 10)
    });

    // Reset Form
    setTitle('');
    setDueDate('');
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim() && onEditTask) {
      onEditTask(id, { title: editTitle.trim() });
    }
    setEditingTaskId(null);
  };

  // Handle completion toggle + celebration
  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    onToggleTask(id);
    if (!currentlyCompleted) {
      triggerConfetti();
    }
  };

  // Completion stats for Progress Bar
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Process tasks
  let processedTasks = tasks.filter(task => {
    const subject = subjects.find(s => s.id === task.subjectId);
    const subjectName = subject ? subject.name.toLowerCase() : 'other';
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          subjectName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'completed' && task.completed) || 
                          (filterStatus === 'pending' && !task.completed);

    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    const matchesSubject = filterSubject === 'all' || task.subjectId === filterSubject;

    return matchesSearch && matchesStatus && matchesPriority && matchesSubject;
  });

  // Sorting
  if (sortBy === 'dueDate') {
    processedTasks = [...processedTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } else if (sortBy === 'priority') {
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    processedTasks = [...processedTasks].sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
  }

  return (
    <div id="todo-tab-content" className="space-y-6">
      
      {/* Dynamic Progress Card */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md shadow-xl shadow-black/10">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <CheckCircle size={16} className="text-yellow-400" />
            Task Completion Engine
          </h3>
          <p className="text-xs text-zinc-500">
            You've completed <strong className="text-white font-semibold font-mono">{completedCount}</strong> out of <strong className="text-white font-semibold font-mono">{totalCount}</strong> assignments. Keep ticking!
          </p>
        </div>

        {/* Progress bar container */}
        <div className="flex items-center gap-3 w-full md:w-72">
          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/60">
            <div 
              className="h-full bg-yellow-500 rounded-full transition-all duration-500 shadow-inner" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-yellow-400 font-mono w-10 text-right">
            {completionRate}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Insertion Form Panel */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 h-fit space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
          <h3 className="text-sm font-semibold text-zinc-100">Add Backlog Task</h3>
          
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Task Title</label>
              <input
                type="text"
                required
                placeholder="Finish calculus homework..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Course Tag</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-400 focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="">Unassigned</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-400 focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/10 transition active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              Insert Task
            </button>
          </form>
        </div>

        {/* Task Backlog Feed List */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 lg:col-span-2 space-y-4 flex flex-col min-h-[460px] backdrop-blur-md shadow-xl shadow-black/10">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
            {/* Search */}
            <div className="relative flex-grow max-w-sm">
              <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 w-full"
              />
            </div>

            {/* Quick sorting selectors */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy(prev => prev === 'dueDate' ? 'none' : 'dueDate')}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 border transition ${
                  sortBy === 'dueDate' 
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
                title="Sort by due date"
              >
                <Calendar size={13} />
                <span className="hidden sm:inline">Due Date</span>
              </button>

              <button
                onClick={() => setSortBy(prev => prev === 'priority' ? 'none' : 'priority')}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 border transition ${
                  sortBy === 'priority' 
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
                title="Sort by priority"
              >
                <AlertCircle size={13} />
                <span className="hidden sm:inline">Priority</span>
              </button>
            </div>
          </div>

          {/* Filters Sub-row */}
          <div className="flex flex-wrap gap-1.5 items-center bg-zinc-950 p-1.5 rounded-xl border border-zinc-900">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterStatus === 'all' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterStatus === 'pending' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterStatus === 'completed' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Completed
            </button>

            <span className="w-px h-4 bg-zinc-800 mx-1 hidden sm:inline" />

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-zinc-400 text-xs px-2 py-1 outline-none focus:text-white cursor-pointer"
            >
              <option value="all" className="bg-zinc-950">Any Priority</option>
              <option value="high" className="bg-zinc-950">High Only</option>
              <option value="medium" className="bg-zinc-950">Medium Only</option>
              <option value="low" className="bg-zinc-950">Low Only</option>
            </select>

            <span className="w-px h-4 bg-zinc-800 mx-1 hidden sm:inline" />

            {/* Subject Filter */}
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="bg-transparent text-zinc-400 text-xs px-2 py-1 outline-none focus:text-white cursor-pointer"
            >
              <option value="all" className="bg-zinc-950">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id} className="bg-zinc-950">{s.name}</option>
              ))}
            </select>
          </div>

          {/* List display */}
          <div className="flex-grow space-y-2 overflow-y-auto max-h-[340px] pr-1">
            {processedTasks.map((task) => {
              const sub = subjects.find(s => s.id === task.subjectId);
              const isEditing = editingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                    task.completed 
                      ? 'bg-zinc-950/40 border-zinc-900/60 opacity-60' 
                      : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-grow">
                    {/* Tick checkbox icon */}
                    <button
                      onClick={() => handleToggle(task.id, task.completed)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        task.completed 
                          ? 'bg-yellow-500 border-yellow-500 text-black' 
                          : 'bg-zinc-900 border-zinc-800 text-transparent hover:border-zinc-700'
                      }`}
                    >
                      <Check size={12} strokeWidth={3} className="block text-current" />
                    </button>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-white focus:outline-none flex-grow"
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0 flex-grow">
                        <p 
                          onClick={() => startEdit(task)}
                          className={`text-xs text-zinc-200 font-medium cursor-pointer hover:text-white truncate ${
                            task.completed ? 'line-through text-zinc-500' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        {/* Sub headers details */}
                        <div className="flex items-center gap-2 mt-1">
                          {sub && (
                            <span 
                              className="text-[9px] px-1.5 py-0.2 rounded font-medium border text-zinc-400"
                              style={{ borderColor: `${sub.color}30`, backgroundColor: `${sub.color}0a` }}
                            >
                              {sub.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                              <Calendar size={10} />
                              {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right hand priority & Action delete icons */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                    {!task.completed && (
                      <span className={`text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        task.priority === 'high' 
                          ? 'bg-red-950/40 text-red-400 border border-red-500/15' 
                          : task.priority === 'medium'
                            ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/15'
                            : 'bg-green-950/40 text-green-400 border border-green-500/15'
                      }`}>
                        {task.priority}
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove task"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {processedTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/40">
                <FolderMinus size={30} className="text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">No tasks found</p>
                <p className="text-[10px] text-zinc-500 mt-1">Refine filters or add a fresh item.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
