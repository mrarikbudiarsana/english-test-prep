import { z } from 'zod';

export const pteWeightsSchema = z.object({
  overall: z.number(),
  listening: z.number(),
  reading: z.number(),
  speaking: z.number(),
  writing: z.number(),
});

export const pteWeightedDetailSchema = z.object({
  questionType: z.string(),
  score: z.number(),
  weight: z.number(),
  weighted: z.number(),
});

export const pteWeightedBlockSchema = z.object({
  score: z.number().nullable(),
  totalWeight: z.number(),
  weightedSum: z.number(),
  details: z.array(pteWeightedDetailSchema),
});

export const pteAnalyticsDebugContractSchema = z.object({
  attemptId: z.string().uuid(),
  testId: z.string().uuid(),
  communicativeSkills: z.object({
    overall: z.number().nullable(),
    listening: z.number().nullable(),
    reading: z.number().nullable(),
    speaking: z.number().nullable(),
    writing: z.number().nullable(),
  }),
  skillsProfile: z.record(z.string(), z.number().nullable()),
  debug: z.object({
    typeScores: z.record(z.string(), z.number()),
    perQuestionType: z.array(z.object({
      questionType: z.string(),
      normalizedAverage: z.number(),
      scaledScore: z.number(),
      sampleCount: z.number().int().nonnegative(),
      weights: pteWeightsSchema.nullable(),
    })),
    communicativeWeighted: z.object({
      overall: pteWeightedBlockSchema,
      listening: pteWeightedBlockSchema,
      reading: pteWeightedBlockSchema,
      speaking: pteWeightedBlockSchema,
      writing: pteWeightedBlockSchema,
    }),
    profileWeighted: z.record(z.string(), pteWeightedBlockSchema),
  }),
});

export type PteAnalyticsDebugContract = z.infer<typeof pteAnalyticsDebugContractSchema>;

