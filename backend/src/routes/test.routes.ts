import { Router } from 'express';
import * as testController from '../controllers/test.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, testController.getTests);
router.get('/:testId', authMiddleware, testController.getTestById);
router.get('/:testId/sections', authMiddleware, testController.getTestSections);
router.get('/:testId/sections/:sectionId/questions', authMiddleware, testController.getSectionQuestions);

export default router;
