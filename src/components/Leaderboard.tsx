import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, Award, Loader2, User } from 'lucide-react';

interface LeaderboardProps {
  currentUser: any;
  settings: any;
}

interface LeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  profilePicture: string;
  studyMinutes: number;
  streak: number;
}

export default function Leaderboard({ currentUser, settings }: LeaderboardProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard?type=${period}`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard();

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [period]);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-yellow-500" />;
    if (rank === 2) return <Trophy size={18} className="text-zinc-400" />;
    if (rank === 3) return <Trophy size={18} className="text-amber-700" />;
    return <span className="font-mono text-zinc-500 w-[18px] text-center">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="text-yellow-500" />
            Study Leaderboard
          </h2>
          <p className="text-zinc-500 text-sm mt-1">See how you stack up against the community.</p>
        </div>

        <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                period === p
                  ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="w-12 text-center">Rank</div>
          <div>Scholar</div>
          <div className="w-24 text-right">Study Time</div>
          <div className="w-20 text-right">Streak</div>
        </div>

        {/* Loading State */}
        {loading && data.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="animate-spin mb-4 text-yellow-500" size={32} />
            <p className="text-sm font-medium animate-pulse">Loading rankings...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
            <Trophy size={48} className="text-zinc-800 mb-4" />
            <p className="text-sm font-medium">No activity yet for this period.</p>
            <p className="text-xs mt-1">Be the first to hit the books!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50 relative">
            {/* Auto-refresh subtle indicator */}
            {loading && data.length > 0 && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-yellow-500/20 overflow-hidden">
                <div className="h-full bg-yellow-500 w-1/3 animate-[slide_1s_ease-in-out_infinite]" />
              </div>
            )}
            
            {data.map((item) => {
              const isCurrentUser = currentUser._id === item.userId;

              return (
                <div
                  key={item.userId}
                  className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 p-4 transition-colors ${
                    isCurrentUser 
                      ? 'bg-yellow-500/5 border-l-2 border-yellow-500' 
                      : 'hover:bg-zinc-800/30 border-l-2 border-transparent'
                  }`}
                >
                  <div className="w-12 flex justify-center items-center">
                    {getRankBadge(item.rank)}
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.profilePicture ? (
                        <img src={item.profilePicture} alt={item.username} className="w-full h-full object-cover" />
                      ) : (
                        <User size={14} className="text-zinc-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-yellow-500' : 'text-zinc-200'}`}>
                        {item.username} {isCurrentUser && <span className="text-[10px] ml-1 opacity-60 font-normal">(You)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="w-24 text-right flex flex-col items-end justify-center">
                    <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-zinc-300">
                      <Clock size={12} className="text-blue-400" />
                      {formatTime(item.studyMinutes)}
                    </div>
                  </div>

                  <div className="w-20 text-right flex flex-col items-end justify-center">
                    <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-zinc-300">
                      <Flame size={12} className={item.streak > 2 ? 'text-orange-500' : 'text-zinc-500'} />
                      {item.streak}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
