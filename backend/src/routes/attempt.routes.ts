import { Router } from 'express';
import * as attemptController from '../controllers/attempt.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, attemptController.startAttempt);
router.get('/', authMiddleware, attemptController.getUserAttempts);
router.get('/:attemptId', authMiddleware, attemptController.getAttempt);
router.put('/:attemptId/section-start', authMiddleware, attemptController.updateSection);
router.post('/:attemptId/responses', authMiddleware, attemptController.saveResponses);
router.post('/:attemptId/auto-save', authMiddleware, attemptController.autoSave);
router.post('/:attemptId/submit-section', authMiddleware, attemptController.submitSection);
router.post('/:attemptId/submit', authMiddleware, attemptController.submitTest);
router.get('/:attemptId/results', authMiddleware, attemptController.getResults);
router.get('/:attemptId/share', attemptController.getShareInfo); // Public endpoint for OG image
router.delete('/:attemptId', authMiddleware, attemptController.deleteAttempt);

export default router;
