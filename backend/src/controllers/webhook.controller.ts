import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import * as lynkService from '../services/lynk.service';
import { logger } from '../utils/logger';

export async function handleLynkWebhook(req: Request, res: Response) {
  try {
    const merchantKey = env.lynkMerchantKey;

    if (merchantKey) {
      const headerKey = (
        req.headers['x-merchant-key'] ||
        req.headers['x-lynk-merchant-key'] ||
        req.headers['x-api-key']
      ) as string | undefined;

      const signature = req.headers['x-lynk-signature'] as string | undefined;
      const bodyKey = req.body?.merchant_key || req.body?.merchantKey;
      const queryKey = (req.query?.merchant_key || req.query?.key) as string | undefined;

      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      let isVerified = false;

      // 1. Direct key match in headers, body, query, or Bearer auth
      if (
        headerKey === merchantKey ||
        bodyKey === merchantKey ||
        queryKey === merchantKey ||
        bearerToken === merchantKey
      ) {
        isVerified = true;
      }

      // 2. HMAC-SHA256 signature verification if signature header is provided
      if (!isVerified && signature) {
        try {
          const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          const expectedSignature = crypto
            .createHmac('sha256', merchantKey)
            .update(rawPayload)
            .digest('hex');

          const sigBuf = Buffer.from(signature);
          const expBuf = Buffer.from(expectedSignature);

          if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
            isVerified = true;
          }
        } catch (sigErr) {
          logger.warn('Failed while checking HMAC signature', { error: sigErr });
        }
      }

      if (!isVerified) {
        logger.warn('Lynk.id webhook rejected: Invalid merchant key or signature', {
          receivedHeaders: Object.keys(req.headers),
          hasSignature: !!signature,
          hasBodyKey: !!bodyKey,
        });
        return res.status(401).json({ error: 'Unauthorized: Invalid merchant key or signature' });
      }
    } else {
      logger.warn('LYNK_MERCHANT_KEY is not configured in .env.local. Webhook accepted without key verification.');
    }

    const result = await lynkService.processLynkWebhook(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error handling Lynk.id webhook:', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
}
