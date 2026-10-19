import { Router } from 'express';
import { signup, login, getMe, logout } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { verifyDatabaseConnection } from '../middleware/dbCheckMiddleware';

const router = Router();

// Public routes
router.post('/signup', verifyDatabaseConnection, signup);
router.post('/login', verifyDatabaseConnection, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyDatabaseConnection, protect, getMe as any);

export default router;
