import { Request, Response } from 'express';
import UserData from '../models/UserData';

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)}`;
}

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.query.type as string || 'daily';
    const limit = parseInt(req.query.limit as string) || 50;
    
    const now = new Date();
    let query: any = {};
    let sortField = '';
    let minutesField = '';

    if (type === 'daily') {
      const currentDay = now.toISOString().slice(0, 10);
      query = { dailyStudyDate: currentDay, dailyStudyMinutes: { $gt: 0 } };
      sortField = 'dailyStudyMinutes';
      minutesField = 'dailyStudyMinutes';
    } else if (type === 'weekly') {
      const currentWeek = getISOWeek(now);
      query = { weeklyStudyDate: currentWeek, weeklyStudyMinutes: { $gt: 0 } };
      sortField = 'weeklyStudyMinutes';
      minutesField = 'weeklyStudyMinutes';
    } else if (type === 'monthly') {
      const currentMonth = now.toISOString().slice(0, 7);
      query = { monthlyStudyDate: currentMonth, monthlyStudyMinutes: { $gt: 0 } };
      sortField = 'monthlyStudyMinutes';
      minutesField = 'monthlyStudyMinutes';
    } else {
      res.status(400).json({ error: 'Invalid leaderboard type' });
      return;
    }

    const leaderboardData = await UserData.find(query)
      .sort({ [sortField]: -1 })
      .limit(limit)
      .populate('user', 'username avatar displayName')
      .select(`user currentStreak ${minutesField} lastStudyDate`);

    // Format response
    const formattedData = leaderboardData
      .filter(item => item.user != null) // Ensure user still exists
      .map((item: any, index: number) => ({
        rank: index + 1,
        userId: item.user._id,
        username: item.user.displayName || item.user.username,
        profilePicture: item.user.avatar || '',
        studyMinutes: item[minutesField],
        streak: item.currentStreak
      }));

    res.json(formattedData);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
};
