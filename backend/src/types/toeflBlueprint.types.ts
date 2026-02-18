/**
 * TOEFL iBT 2026 delivery model types.
 *
 * Phase 1: type definitions only (no runtime logic yet).
 * Phase 2 will add the adaptive routing engine and task renderers.
 */

export type DeliveryModel = 'legacy' | 'toefl_ibt_2026';

// ---------- Task types ----------

export type ReadingTaskType = 'complete_words' | 'read_daily_life' | 'read_academic_passage';
export type ListeningTaskType =
  | 'listen_choose_response'
  | 'listen_conversation'
  | 'listen_announcement'
  | 'listen_academic_talk';
export type WritingTaskType = 'build_sentence' | 'write_email' | 'academic_discussion';
export type SpeakingTaskType = 'listen_repeat' | 'take_interview';

export type ToeflTaskType =
  | ReadingTaskType
  | ListeningTaskType
  | WritingTaskType
  | SpeakingTaskType;

// ---------- Blueprint JSON (stored in tests.blueprint_json) ----------

export interface MstConfig {
  stage1: number;
  stage2: number;
  paths: ['lower', 'upper'];
  cutScorePercent: number; // default 60 — route upper if stage1 % >= this
}

export interface ToeflIbtBlueprint {
  deliveryModel: 'toefl_ibt_2026';
  scoreMappingVersion: string; // e.g. 'toefl_ibt_2026_v1'
  sections: {
    reading: {
      rawMax: 30;
      mst: MstConfig;
    };
    listening: {
      rawMax: 30;
      mst: MstConfig;
    };
    writing: {
      rawMax: 20;
      tasks: {
        build_sentence: { count: 10; rawMax: 10 };
        write_email: { count: 1; rawMax: 5 };
        academic_discussion: { count: 1; rawMax: 5 };
      };
    };
    speaking: {
      rawMax: 55;
      tasks: {
        listen_repeat: { count: 7; rawMax: 35 };
        take_interview: { count: 4; rawMax: 20 };
      };
    };
  };
}

/** Default blueprint for a standard TOEFL iBT 2026 test. */
export const DEFAULT_TOEFL_IBT_BLUEPRINT: ToeflIbtBlueprint = {
  deliveryModel: 'toefl_ibt_2026',
  scoreMappingVersion: 'toefl_ibt_2026_v1',
  sections: {
    reading: {
      rawMax: 30,
      mst: { stage1: 20, stage2: 15, paths: ['lower', 'upper'], cutScorePercent: 60 },
    },
    listening: {
      rawMax: 30,
      mst: { stage1: 20, stage2: 15, paths: ['lower', 'upper'], cutScorePercent: 60 },
    },
    writing: {
      rawMax: 20,
      tasks: {
        build_sentence: { count: 10, rawMax: 10 },
        write_email: { count: 1, rawMax: 5 },
        academic_discussion: { count: 1, rawMax: 5 },
      },
    },
    speaking: {
      rawMax: 55,
      tasks: {
        listen_repeat: { count: 7, rawMax: 35 },
        take_interview: { count: 4, rawMax: 20 },
      },
    },
  },
};
