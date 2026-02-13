export type TestType = 'academic' | 'general_training' | 'toefl_ibt' | 'toefl_itp' | 'pte_academic';
export type SectionType = 'listening' | 'reading' | 'writing' | 'speaking' | 'structure';
export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'completion'
  | 'matching'
  | 'dropdown';

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned' | 'scoring';
export type AttemptMode = 'full' | 'section_practice';

export interface Test {
  id: string;
  title: string;
  description: string | null;
  testType: TestType;
  isPublished: boolean;
  isFree: boolean;
  durationMinutes: number;
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
}

export interface SpeakingPrompt {
  id: string;
  text: string;
  followUp?: string;
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
  correctAnswer?: AnswerData; // Only available in results view
  groupLabel?: string | null; // e.g., "Questions 1-7"
  groupInstructions?: string | null; // Shared instructions for the group
  audioUrl?: string | null; // Question-level audio (TOEFL Part A)
}

// Question data types for each question type
export interface MCQData {
  options: { key: string; text: string }[];
  multiSelect: boolean;
  expectedAnswers?: number; // For "select TWO/THREE" questions - how many answers required
}

export interface TFNGData {
  statement: string;
  options: string[];
}

export interface YNNGData {
  statement: string;
  options: string[];
}

export interface CompletionData {
  context: string;
  maxWords: number;
  caseSensitive: boolean;
  blankPosition: string;
  title?: string; // IELTS format: title/heading above the notes
  style?: 'standard' | 'note'; // 'standard' = separate cards, 'note' = merged document/summary style
}

export interface MatchingData {
  instructions: string;
  items: { key: string; text: string }[];
  options: { key: string; text: string }[];
  allowReuse: boolean;
}

export interface DropdownData {
  context: string;
  dropdowns: Record<string, {
    options: string[];
    position?: { start: number; end: number };
  }>;
}

export type QuestionData = MCQData | TFNGData | YNNGData | CompletionData | MatchingData | DropdownData;

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
  listeningBand: number | null;
  listeningScore: number | null; // TOEFL
  readingRaw: number | null;
  readingBand: number | null;
  readingScore: number | null; // TOEFL
  structureScore: number | null; // TOEFL
  writingBand: number | null;
  speakingBand: number | null;
  overallBand: number | null;
  overallScore: number | null; // TOEFL
  writingFeedback: WritingFeedback | null;
  speakingFeedback: SpeakingFeedback | null;
  test?: Test;
}

export interface BandFeedback {
  band: number;
  feedback: string;
}

export interface WritingTaskFeedback {
  taskNumber: number;
  wordCount: number;
  taskAchievement?: BandFeedback; // Task 1
  taskResponse?: BandFeedback;    // Task 2
  coherenceCohesion: BandFeedback;
  lexicalResource: BandFeedback;
  grammaticalRangeAccuracy: BandFeedback;
  overallBand: number;
  generalFeedback: string;
}

export interface WritingFeedback {
  tasks: WritingTaskFeedback[];
  overallWritingBand: number;
  summary: string;
}

export interface SpeakingPartFeedback {
  partNumber: number;
  fluencyCoherence: BandFeedback;
  lexicalResource: BandFeedback;
  grammaticalRangeAccuracy: BandFeedback;
  pronunciation: BandFeedback;
  partFeedback: string;
}

export interface SpeakingFeedback {
  parts: SpeakingPartFeedback[];
  overallSpeakingBand: number;
  fluencyCoherence: BandFeedback;
  lexicalResource: BandFeedback;
  grammaticalRangeAccuracy: BandFeedback;
  pronunciation: BandFeedback;
  summary: string;
}

export interface UserResponse {
  id: string;
  attemptId: string;
  questionId: string;
  sectionId: string;
  answerData: AnswerData;
  writingText: string | null;
  wordCount: number | null;
  audioUrl: string | null;
  isCorrect: boolean | null;
  score: number | null;
  aiFeedback: Record<string, unknown> | null;
}
