import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public route
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.get('/current', authMiddleware, subscriptionController.getCurrentSubscription);
router.get('/history', authMiddleware, subscriptionController.getSubscriptionHistory);

export default router;
