export type TestType = 'academic' | 'general_training' | 'toefl_ibt' | 'toefl_itp' | 'pte_academic';
export type DeliveryModel = 'legacy' | 'toefl_ibt_2026';
export type SectionType = 'listening' | 'reading' | 'writing' | 'speaking' | 'structure';
export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'completion'
  | 'matching'
  | 'dropdown'
  // PTE objective item types
  | 'pte_mcq_single'
  | 'pte_mcq_multiple'
  | 'pte_reading_fill_blanks_dropdown'
  | 'pte_reading_fill_blanks_drag_drop'
  | 'pte_reorder_paragraph'
  | 'pte_listening_fill_blanks'
  | 'pte_highlight_correct_summary'
  | 'pte_select_missing_word'
  | 'pte_highlight_incorrect_words'
  | 'pte_write_from_dictation';

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned' | 'scoring';
export type AttemptMode = 'full' | 'section_practice';

export interface Test {
  id: string;
  title: string;
  description: string | null;
  testType: TestType;
  deliveryModel?: DeliveryModel;
  blueprintJson?: any | null;
  isPublished: boolean;
  isFree: boolean;
  durationMinutes: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  id: string;
  testId: string;
  sectionType: SectionType;
  sectionOrder: number;
  title: string | null;
  instructions: string | null;
  durationMinutes: number;
  audioUrl: string | null;
  passageText: string | null;
  passageTitle: string | null;
  taskDescription: string | null;
  taskNumber: number | null;
  minWords: number | null;
  imageUrl: string | null;
  partNumber: number | null;
  speakingPrompts: any | null;
  preparationTime: number | null;
  responseTime: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  sectionId: string;
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  questionData: any;
  correctAnswer: any;
  points: number;
  explanation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  mode: AttemptMode;
  practiceSectionType: SectionType | null;
  status: AttemptStatus;
  startedAt: Date;
  completedAt: Date | null;
  currentSection: SectionType | null;
  sectionStartedAt: Date | null;
  listeningRaw: number | null;
  listeningBand: number | null;
  listeningScore: number | null;
  readingRaw: number | null;
  readingBand: number | null;
  readingScore: number | null;
  writingRaw: number | null;
  speakingRaw: number | null;
  structureScore: number | null;
  writingBand: number | null;
  speakingBand: number | null;
  overallBand: number | null;
  overallScore: number | null;
  readingScore30: number | null;
  listeningScore30: number | null;
  writingScore30: number | null;
  speakingScore30: number | null;
  overallScore120: number | null;
  scoreMappingVersion: string | null;
  cefrLevel: string | null;
  scoreReportable: boolean | null;
  validUntil: string | null;
  writingFeedback: any | null;
  speakingFeedback: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  attemptId: string;
  questionId: string;
  sectionId: string;
  answerData: any;
  writingText: string | null;
  wordCount: number | null;
  audioUrl: string | null;
  audioDuration: number | null;
  isCorrect: boolean | null;
  score: number | null;
  aiFeedback: any | null;
  answeredAt: Date;
  createdAt: Date;
}
