import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getProfile);
router.put('/me', authMiddleware, authController.updateProfile);
router.put('/me/exam-preference', authMiddleware, authController.updateExamPreference);

export default router;
