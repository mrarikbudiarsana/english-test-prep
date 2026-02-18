import { Router } from 'express';
import * as toeflIbtController from '../controllers/toefl-ibt.controller';
import { authMiddleware } from '../middleware/auth';

// Mounted at /attempts/:attemptId/toefl-ibt in routes/index.ts
const router = Router({ mergeParams: true });

router.post('/route/:sectionType', authMiddleware, toeflIbtController.routeSection);
router.post('/score/:sectionType', authMiddleware, toeflIbtController.scoreSection);

export default router;
