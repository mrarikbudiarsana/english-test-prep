import assert from 'node:assert/strict';
import { pteAnalyticsDebugContractSchema } from '../contracts/pteAnalyticsDebug.contract';

const validFixture = {
  attemptId: '11111111-1111-4111-8111-111111111111',
  testId: '22222222-2222-4222-8222-222222222222',
  communicativeSkills: {
    overall: 65,
    listening: 64,
    reading: 66,
    speaking: 63,
    writing: 67,
  },
  skillsProfile: {
    openResponseSpeakingWriting: 66,
    shortSpeaking: 61,
  },
  debug: {
    typeScores: {
      'Read Aloud': 62,
      'Write from Dictation': 70,
    },
    perQuestionType: [
      {
        questionType: 'Read Aloud',
        normalizedAverage: 0.65,
        scaledScore: 62,
        sampleCount: 6,
        weights: { overall: 4, listening: 0, reading: 0, speaking: 9, writing: 0 },
      },
    ],
    communicativeWeighted: {
      overall: { score: 65, totalWeight: 9, weightedSum: 585, details: [] },
      listening: { score: 64, totalWeight: 13, weightedSum: 832, details: [] },
      reading: { score: 66, totalWeight: 7, weightedSum: 462, details: [] },
      speaking: { score: 63, totalWeight: 16, weightedSum: 1008, details: [] },
      writing: { score: 67, totalWeight: 10, weightedSum: 670, details: [] },
    },
    profileWeighted: {
      openResponseSpeakingWriting: {
        score: 66,
        totalWeight: 11,
        weightedSum: 726,
        details: [
          { questionType: 'Read Aloud', score: 62, weight: 4, weighted: 248 },
        ],
      },
    },
  },
};

function run() {
  const parsedValid = pteAnalyticsDebugContractSchema.safeParse(validFixture);
  assert.equal(parsedValid.success, true, 'valid fixture should pass');

  const invalidFixture: any = {
    ...validFixture,
    attemptId: 'not-a-uuid',
  };
  const parsedInvalid = pteAnalyticsDebugContractSchema.safeParse(invalidFixture);
  assert.equal(parsedInvalid.success, false, 'invalid fixture should fail');

  // eslint-disable-next-line no-console
  console.log('PTE analytics debug contract tests passed');
}

run();

