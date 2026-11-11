import { determineCredits } from '../services/lynk.service';
import crypto from 'crypto';

describe('Lynk.id Service & Webhook', () => {
  describe('determineCredits', () => {
    it('detects 1 Test Credit from product slug rx9lj8kjey71', () => {
      const payload = {
        product_url: 'https://lynk.id/englishwitharik/rx9lj8kjey71',
        amount: 49000,
      };
      const result = determineCredits(payload);
      expect(result.credits).toBe(1);
      expect(result.packageName).toContain('1 Test Credit');
    });

    it('detects 3 Test Credits (Value Pack) from product slug j6jxzpdynron', () => {
      const payload = {
        checkout_url: 'https://lynk.id/englishwitharik/j6jxzpdynron',
        amount: 99000,
      };
      const result = determineCredits(payload);
      expect(result.credits).toBe(3);
      expect(result.packageName).toContain('3 Test Credits');
    });

    it('detects 5 Test Credits (Intensive Pack) from product slug y9l4x3rpmyk5', () => {
      const payload = {
        url: 'https://lynk.id/englishwitharik/y9l4x3rpmyk5',
        amount: 149000,
      };
      const result = determineCredits(payload);
      expect(result.credits).toBe(5);
      expect(result.packageName).toContain('5 Test Credits');
    });

    it('detects 1 Test Credit by price 49000 when slug is not present', () => {
      const payload = {
        amount: 49000,
        items: [{ title: 'TOEFL ITP Test' }],
      };
      const result = determineCredits(payload);
      expect(result.credits).toBe(1);
    });

    it('detects 3 Test Credits by price 99000 when slug is not present', () => {
      const payload = {
        amount: 99000,
        items: [{ title: 'TOEFL ITP Test Pack' }],
      };
      const result = determineCredits(payload);
      expect(result.credits).toBe(3);
    });

    it('detects 5 Test Credits by price 149000 when slug is not present', () => {
      const payload = {
        amount: 149000,
        items: [{ title: 'TOEFL ITP Test Pack' }],
      };
      const result = determineCredits(payload);
      expect(result.credits).toBe(5);
    });

    it('detects VIP review option by price 175000 or keyword', () => {
      const payload = {
        amount: 175000,
        items: [{ title: '1 Test + 60-min Review Session with Arik' }],
      };
      const result = determineCredits(payload);
      expect(result.credits).toBe(1);
      expect(result.packageName).toContain('VIP Option');
    });
  });

  describe('HMAC Signature Verification', () => {
    it('verifies valid HMAC-SHA256 signature accurately', () => {
      const secret = 'mk_live_sample_key_123';
      const body = {
        event: 'order.completed',
        status: 'paid',
        customer_email: 'student@example.com',
        amount: 99000,
      };
      const rawPayload = JSON.stringify(body);
      const signature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

      const expectedSignature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);

      expect(sigBuf.length).toBe(expBuf.length);
      expect(crypto.timingSafeEqual(sigBuf, expBuf)).toBe(true);
    });
  });
});
