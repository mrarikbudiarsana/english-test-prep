import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public endpoint to check if payment system is available
router.get('/availability', paymentController.checkAvailability);

router.post('/create', authMiddleware, paymentController.createPayment);
router.post('/notification', paymentController.handleNotification);
router.get('/status/:orderId', authMiddleware, paymentController.getPaymentStatus);

export default router;
