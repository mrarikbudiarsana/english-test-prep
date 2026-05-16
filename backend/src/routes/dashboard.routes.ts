import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, dashboardController.getStats);
router.get('/history', authMiddleware, dashboardController.getHistory);
router.get('/progress', authMiddleware, dashboardController.getProgress);
router.get('/announcement', dashboardController.getAnnouncement);

export default router;
