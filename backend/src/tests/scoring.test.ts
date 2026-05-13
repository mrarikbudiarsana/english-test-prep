import { calculateOverallBand, convertToBand } from '../services/scoring.service';

describe('Scoring Service', () => {
  describe('convertToBand', () => {
    it('calculates the minimum valid TOEFL listening score', () => {
      const score = convertToBand(0, 'listening');
      expect(score).toBe(31);
    });

    it('calculates the maximum valid TOEFL reading score', () => {
      const score = convertToBand(50, 'reading');
      expect(score).toBe(67);
    });
    
    it('calculates an average TOEFL structure score', () => {
      // 20 correct answers in structure usually yields around 48
      const score = convertToBand(20, 'structure');
      expect(score).toBeGreaterThanOrEqual(44);
      expect(score).toBeLessThanOrEqual(52);
    });
  });

  describe('calculateOverallBand', () => {
    it('calculates the overall score correctly for average inputs', () => {
      // listening, reading, writing, speaking, structure
      // (50 + 50 + 50) * 10 / 3 = 500
      const score = calculateOverallBand(50, 50, null, null, 50);
      expect(score).toBe(500);
    });

    it('calculates the maximum overall score correctly', () => {
      // (68 + 68 + 67) * 10 / 3 = 676.666 -> rounds down to 677
      // 68(L), 67(R), null, null, 68(S)
      const score = calculateOverallBand(68, 67, null, null, 68);
      expect(score).toBe(677);
    });

    it('calculates the minimum overall score correctly', () => {
      // (31 + 31 + 31) * 10 / 3 = 310
      const score = calculateOverallBand(31, 31, null, null, 31);
      expect(score).toBe(310);
    });
  });
});
