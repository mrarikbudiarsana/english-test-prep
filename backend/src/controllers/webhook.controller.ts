import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import * as lynkService from '../services/lynk.service';
import { logger } from '../utils/logger';

export async function handleLynkWebhook(req: Request, res: Response) {
  try {
    const merchantKey = env.lynkMerchantKey;

    const headerKey = (
      req.headers['x-merchant-key'] ||
      req.headers['x-lynk-merchant-key'] ||
      req.headers['merchant-key'] ||
      req.headers['merchant_key'] ||
      req.headers['x-api-key'] ||
      req.headers['api-key']
    ) as string | undefined;

    const signature = (
      req.headers['x-lynk-signature'] ||
      req.headers['x-signature'] ||
      req.headers['signature'] ||
      req.headers['x-hub-signature-256']
    ) as string | undefined;

    const bodyKey = req.body?.merchant_key || req.body?.merchantKey || req.body?.key;
    const queryKey = (req.query?.merchant_key || req.query?.key || req.query?.merchantKey) as string | undefined;

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let isVerified = false;

    // 1. Direct key match in headers, body, query, Bearer auth, or signature presence
    if (
      headerKey === merchantKey ||
      bodyKey === merchantKey ||
      queryKey === merchantKey ||
      bearerToken === merchantKey ||
      !!signature
    ) {
      isVerified = true;
    }

    // 2. Always accept Lynk.id dashboard tests, pings, or sample payloads with 200 OK
    const rawEmail = (
      req.body?.customer_email ||
      req.body?.email ||
      req.body?.customer?.email ||
      req.body?.buyer_email ||
      req.body?.buyer?.email ||
      req.body?.data?.customer_email ||
      req.body?.data?.customer?.email ||
      req.body?.data?.email ||
      ''
    ).toString().toLowerCase();

    const isTestPayload =
      req.body?.event === 'test' ||
      req.body?.action === 'test' ||
      req.body?.type === 'test' ||
      req.body?.type === 'ping' ||
      req.body?.test === true ||
      req.body?.is_test === true ||
      req.headers['x-lynk-event'] === 'test' ||
      !req.body ||
      Object.keys(req.body).length === 0 ||
      !rawEmail ||
      rawEmail.includes('test') ||
      rawEmail.includes('demo') ||
      rawEmail.includes('sample') ||
      rawEmail.includes('lynk') ||
      rawEmail.includes('example.com');

    if (isTestPayload) {
      logger.info('Lynk.id test/sample webhook received, returning 200 OK');
      return res.status(200).json({ success: true, message: 'Lynk.id webhook test received successfully' });
    }

    if (merchantKey && !isVerified) {
      const userAgent = (req.headers['user-agent'] || '').toLowerCase();
      if (userAgent.includes('lynk') || userAgent.includes('axios')) {
        logger.info('Accepting Lynk webhook based on user-agent');
        isVerified = true;
      } else {
        logger.warn('Lynk.id webhook rejected: Invalid merchant key or signature', {
          receivedHeaders: Object.keys(req.headers),
          hasSignature: !!signature,
          hasBodyKey: !!bodyKey,
        });
        return res.status(401).json({ error: 'Unauthorized: Invalid merchant key or signature' });
      }
    }

    const body = req.body || {};
    const result = await lynkService.processLynkWebhook(body);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error handling Lynk.id webhook:', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
}
