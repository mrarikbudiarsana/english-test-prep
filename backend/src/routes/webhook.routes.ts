import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

// Endpoint: /api/webhooks/lynk and /api/v1/webhooks/lynk
router.get('/lynk', (_req, res) => {
  res.json({ status: 'ok', message: 'Lynk.id webhook endpoint is active' });
});
router.post('/lynk', webhookController.handleLynkWebhook);

export default router;
