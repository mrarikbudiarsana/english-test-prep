export type TestType = 'toefl_itp';
export type DeliveryModel = 'legacy';
export type SectionType = 'listening' | 'reading' | 'structure';
export type QuestionType = 'multiple_choice';

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';
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
  listeningScore: number | null;
  readingRaw: number | null;
  readingScore: number | null;
  structureScore: number | null;
  overallScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  attemptId: string;
  questionId: string;
  sectionId: string;
  answerData: any;
  isCorrect: boolean | null;
  score: number | null;
  answeredAt: Date;
  createdAt: Date;
}
