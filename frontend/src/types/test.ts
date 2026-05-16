export type TestType = 'toefl_itp';
export type SectionType = 'listening' | 'reading' | 'structure';
export type QuestionType = 'multiple_choice';

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';
export type AttemptMode = 'full' | 'section_practice';

export interface Test {
  id: string;
  title: string;
  description: string | null;
  testType: TestType;
  deliveryModel?: 'legacy';
  blueprintJson?: any | null;
  isPublished: boolean;
  isFree: boolean;
  durationMinutes: number;
  audioThinkingTime?: number;
  createdAt: string;
  sections?: Section[];
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
  speakingPrompts: SpeakingPrompt[] | null;
  preparationTime: number | null;
  responseTime: number | null;
  moduleStage?: number | null;
  modulePath?: string | null;
  taskType?: string | null;
  questionCount?: number;
  audioCount?: number;
}

export interface SpeakingPrompt {
  id: string;
  text: string;
  followUp?: string;
  audioUrl?: string;
  mediaUrl?: string;
  imageUrl?: string;
}

export type AnswerData = string | string[] | Record<string, string> | number | boolean | null;

export interface Question {
  id: string;
  sectionId: string;
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  questionData: QuestionData;
  points: number;
  explanation?: string | null;
  explanationAi?: string | null;
  correctAnswer?: AnswerData;
  groupLabel?: string | null;
  groupInstructions?: string | null;
  audioUrl?: string | null;
  itemPayload?: any | null;
}

export interface MCQData {
  options: { key: string; text: string }[];
  multiSelect: boolean;
  expectedAnswers?: number;
}

export type QuestionData = MCQData;

export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  mode: AttemptMode;
  practiceSectionType: SectionType | null;
  status: AttemptStatus;
  startedAt: string;
  completedAt: string | null;
  currentSection: SectionType | null;
  listeningRaw: number | null;
  listeningScore: number | null;
  readingRaw: number | null;
  readingScore: number | null;
  structureRaw: number | null;
  structureScore: number | null;
  overallScore: number | null;
  test?: Test;
}

export interface UserResponse {
  id: string;
  attemptId: string;
  questionId: string;
  sectionId: string;
  answerData: AnswerData;
  isCorrect: boolean | null;
  score: number | null;
}
