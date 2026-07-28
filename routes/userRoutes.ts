import { Router } from 'express';
import { getUserData, updateUserData } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { verifyDatabaseConnection } from '../middleware/dbCheckMiddleware';

const router = Router();

// Protected routes for user data
router.get('/data', verifyDatabaseConnection, protect, getUserData as any);
router.put('/data', verifyDatabaseConnection, protect, updateUserData as any);

export default router;
