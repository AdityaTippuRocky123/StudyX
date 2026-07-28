import { Request, Response } from 'express';
import UserData from '../models/UserData';
import { AuthRequest } from '../middleware/authMiddleware';

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)}`;
}

function processStudyStats(sessions: any[]) {
  let totalStudyMinutes = 0;
  let dailyStudyMinutes = 0;
  let weeklyStudyMinutes = 0;
  let monthlyStudyMinutes = 0;
  
  const now = new Date();
  const currentDay = now.toISOString().slice(0, 10);
  const currentMonth = now.toISOString().slice(0, 7);
  const currentWeek = getISOWeek(now);
  
  // A study session counts only if user studied at least 20 minutes (1200 seconds)
  const validSessions = sessions.filter(s => s.duration >= 1200 && s.type === 'focus');
  
  validSessions.forEach(s => {
    const mins = Math.floor(s.duration / 60);
    totalStudyMinutes += mins;
    
    const sDate = new Date(s.date);
    const sDay = sDate.toISOString().slice(0, 10);
    const sMonth = sDate.toISOString().slice(0, 7);
    const sWeek = getISOWeek(sDate);
    
    if (sDay === currentDay) dailyStudyMinutes += mins;
    if (sWeek === currentWeek) weeklyStudyMinutes += mins;
    if (sMonth === currentMonth) monthlyStudyMinutes += mins;
  });
  
  // Calculate streaks
  const uniqueDates = Array.from(new Set(validSessions.map(s => new Date(s.date).toISOString().slice(0, 10)))).sort((a, b) => b.localeCompare(a));
  
  let currentStreak = 0;
  let longestStreak = 0;
  
  if (uniqueDates.length > 0) {
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = new Date(uniqueDates[i]);
      const d2 = new Date(uniqueDates[i+1]);
      const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    const yesterdayDate = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
    if (uniqueDates[0] === currentDay || uniqueDates[0] === yesterdayDate) {
      currentStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = new Date(uniqueDates[i]);
        const d2 = new Date(uniqueDates[i+1]);
        const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }
  
  const lastStudyDate = uniqueDates.length > 0 ? uniqueDates[0] : '';
  
  return {
    dailyStudyMinutes,
    dailyStudyDate: currentDay,
    weeklyStudyMinutes,
    weeklyStudyDate: currentWeek,
    monthlyStudyMinutes,
    monthlyStudyDate: currentMonth,
    totalStudyMinutes,
    currentStreak,
    longestStreak,
    lastStudyDate
  };
}

// @desc    Get user data
// @route   GET /api/user/data
// @access  Private
export const getUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    let userData = await UserData.findOne({ user: req.user._id });
    
    if (!userData) {
      // Create empty container if not found
      userData = await UserData.create({
        user: req.user._id,
      });
    }

    res.json(userData);
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Server error fetching user data' });
  }
};

// @desc    Update user data
// @route   PUT /api/user/data
// @access  Private
export const updateUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const updateFields = req.body;
    updateFields.lastActive = new Date();

    // If sessions are provided, calculate leaderboard stats safely on the backend
    if (Array.isArray(updateFields.sessions)) {
      const stats = processStudyStats(updateFields.sessions);
      Object.assign(updateFields, stats);
    }

    // Find and update, or create if it doesn't exist
    const userData = await UserData.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.json(userData);
  } catch (error: any) {
    console.error('Error updating user data:', error);
    res.status(500).json({ error: 'Server error updating user data' });
  }
};
