import { Router } from 'express';
import authRoutes from './auth.routes';
import testRoutes from './test.routes';
import attemptRoutes from './attempt.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';
import subscriptionRoutes from './subscription.routes';
import uploadRoutes from './upload.routes';
import dashboardRoutes from './dashboard.routes';
import pricingRoutes from './pricing.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tests', testRoutes);
router.use('/attempts', attemptRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/upload', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pricing', pricingRoutes);

export default router;
