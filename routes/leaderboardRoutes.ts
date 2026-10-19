import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController';
import { verifyDatabaseConnection } from '../middleware/dbCheckMiddleware';

const router = Router();

router.get('/', verifyDatabaseConnection, getLeaderboard as any);

export default router;
