import { Router } from 'express';
import * as creditController from '../controllers/credit.controller';

const router = Router();

// Balance check is public (so students can verify their email credit balance before test start)
router.get('/balance', creditController.checkBalance);
router.post('/check', creditController.checkBalance);

export default router;
