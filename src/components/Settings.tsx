import React, { useState } from 'react';
import { 
  Sliders, 
  Moon, 
  Sun, 
  Smartphone, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  AlertOctagon, 
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AppSettings, Subject, StudyLog, Task, TestMark, Goal, TimerSession } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  subjects: Subject[];
  logs: StudyLog[];
  tasks: Task[];
  tests: TestMark[];
  goals: Goal[];
  sessions: TimerSession[];
  onImportData: (imported: {
    subjects: Subject[];
    logs: StudyLog[];
    tasks: Task[];
    tests: TestMark[];
    goals: Goal[];
    sessions: TimerSession[];
    settings: AppSettings;
  }) => void;
  onClearAllData: () => void;
}

export default function Settings({
  settings,
  onUpdateSettings,
  subjects,
  logs,
  tasks,
  tests,
  goals,
  sessions,
  onImportData,
  onClearAllData
}: SettingsProps) {
  // Local state for Form inputs
  const [focus, setFocus] = useState(settings.pomodoroFocus);
  const [shortBreak, setShortBreak] = useState(settings.pomodoroShortBreak);
  const [longBreak, setLongBreak] = useState(settings.pomodoroLongBreak);
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [alarm, setAlarm] = useState(settings.alarmSound);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSaveTimer = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      pomodoroFocus: Number(focus),
      pomodoroShortBreak: Number(shortBreak),
      pomodoroLongBreak: Number(longBreak),
      alarmSound: alarm
    });
    showToast("Timer configurations saved!");
  };

  const toggleNotifications = async () => {
    const nextVal = !notifications;
    setNotifications(nextVal);

    if (nextVal && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifications(false);
        showToast("System notification permission denied.");
        return;
      }
    }

    onUpdateSettings({
      ...settings,
      notificationsEnabled: nextVal
    });
    showToast(`Notifications ${nextVal ? 'enabled' : 'disabled'}!`);
  };

  const handleThemeChange = (theme: 'dark' | 'light' | 'amoled') => {
    onUpdateSettings({
      ...settings,
      theme
    });
    showToast(`Applied ${theme === 'amoled' ? 'AMOLED Black' : theme === 'dark' ? 'Pro Dark' : 'Elegant Light'} theme!`);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const backupData = {
      subjects,
      logs,
      tasks,
      tests,
      goals,
      sessions,
      settings
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("JSON backup downloaded successfully!");
  };

  // Export CSV Logs Backup
  const handleExportCSV = () => {
    if (logs.length === 0) {
      showToast("No logs available to export.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Subject,Date,Hours,Notes\n";

    logs.forEach(log => {
      const sub = subjects.find(s => s.id === log.subjectId);
      const subName = sub ? sub.name.replace(/"/g, '""') : 'Other';
      const notesEscaped = log.notes.replace(/"/g, '""');
      csvContent += `${log.id},"${subName}",${log.date},${log.hours},"${notesEscaped}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `study_logs_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast("CSV study logs downloaded!");
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (
          parsed &&
          Array.isArray(parsed.subjects) &&
          Array.isArray(parsed.logs) &&
          Array.isArray(parsed.tasks) &&
          Array.isArray(parsed.tests)
        ) {
          onImportData(parsed);
          showToast("Data restoration completed successfully!");
        } else {
          showToast("Error: Invalid backup file format.");
        }
      } catch (err) {
        showToast("Error reading restore file.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmClear = () => {
    onClearAllData();
    setShowClearConfirm(false);
    showToast("All databases wiped successfully.");
  };

  return (
    <div id="settings-tab-content" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Toast Notification helper */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-yellow-500 text-black px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle size={14} strokeWidth={2.5} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Themes Preference */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Theme Canvas Configuration
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Customize the visual language of your study cabin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* AMOLED Black */}
          <button
            onClick={() => handleThemeChange('amoled')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
              settings.theme === 'amoled'
                ? 'bg-black border-yellow-500 text-white shadow-lg'
                : 'bg-black border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
            }`}
          >
            <Moon size={18} className="mb-2" />
            <span className="text-xs font-bold">AMOLED Black</span>
            <span className="text-[10px] text-zinc-600 mt-1">True complete solid black canvas</span>
          </button>

          {/* Pro Dark */}
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
              settings.theme === 'dark'
                ? 'bg-zinc-950 border-yellow-500 text-white shadow-lg'
                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
            }`}
          >
            <Moon size={18} className="mb-2 text-zinc-400" />
            <span className="text-xs font-bold">Pro Dark</span>
            <span className="text-[10px] text-zinc-600 mt-1">Sleek charcoal workspace background</span>
          </button>

          {/* Elegant Light */}
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
              settings.theme === 'light'
                ? 'bg-white border-yellow-500 text-black shadow-lg'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            }`}
          >
            <Sun size={18} className="mb-2 text-yellow-500" />
            <span className="text-xs font-bold">Elegant Light</span>
            <span className="text-[10px] text-zinc-400 mt-1">Soft clean high-contrast cream canvas</span>
          </button>
        </div>
      </div>

      {/* Pomodoro Study Timer intervals configuration */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 backdrop-blur-md shadow-xl shadow-black/10">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4">
          <Clock size={16} className="text-yellow-400" />
          Pomodoro Study Interval Setup
        </h3>

        <form onSubmit={handleSaveTimer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Focus Period (Minutes)</label>
              <input
                type="number"
                min="1"
                max="180"
                required
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Short Rest (Minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={shortBreak}
                onChange={(e) => setShortBreak(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Alarm Sound Chime</label>
              <select
                value={alarm}
                onChange={(e) => setAlarm(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
              >
                <option value="bell">🔔 Cozy Warm Bell</option>
                <option value="digital">🎛️ Tech Digital Beep</option>
                <option value="zen">🧘 Ambient Zen Decent</option>
                <option value="off">🔇 Silent Visual Flash</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded-xl transition active:scale-95 shadow-md shadow-yellow-500/10"
          >
            Apply Timer Layout
          </button>
        </form>
      </div>

      {/* Hardware / notifications config */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 flex items-center justify-between backdrop-blur-md shadow-xl shadow-black/10">
        <div className="space-y-1 pr-4">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Bell size={16} className="text-yellow-400" />
            Desktop Alerts Notification
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Delivers brief system push triggers when timer countdown cycles complete.
          </p>
        </div>

        <button
          onClick={toggleNotifications}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            notifications ? 'bg-yellow-500' : 'bg-zinc-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
              notifications ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Portability Backup restoration */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Sliders size={16} className="text-yellow-400" />
          Data Backup & Portability
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Backup to JSON */}
          <button
            onClick={handleExportJSON}
            className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition flex items-center justify-center gap-2 text-xs text-zinc-300 font-semibold"
          >
            <Download size={14} className="text-yellow-500" />
            Backup Database JSON
          </button>

          {/* Export logs to CSV */}
          <button
            onClick={handleExportCSV}
            className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition flex items-center justify-center gap-2 text-xs text-zinc-300 font-semibold"
          >
            <Download size={14} className="text-emerald-500" />
            Export Logs to CSV
          </button>

          {/* Restore from JSON */}
          <label className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition flex items-center justify-center gap-2 text-xs text-zinc-300 font-semibold cursor-pointer">
            <Upload size={14} className="text-blue-500" />
            Restore Database JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/15 border border-red-900/30 rounded-[24px] p-5 space-y-4 backdrop-blur-md shadow-xl shadow-black/10">
        <div>
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertOctagon size={16} />
            Danger Cabinet
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Destructive parameters. This will fully reset your log progress.</p>
        </div>

        {showClearConfirm ? (
          <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
            <p className="text-xs text-zinc-300 font-medium">Are you absolutely sure? This action is irreversible.</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmClear}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition"
              >
                Wipe Everything
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl transition"
          >
            Clear LocalStorage DB
          </button>
        )}
      </div>
    </div>
  );
}
