export type TestType = 'academic' | 'general_training' | 'toefl_ibt' | 'toefl_itp' | 'pte_academic';
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
  deliveryModel?: 'legacy' | 'toefl_ibt_2026';
  blueprintJson?: any | null;
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
  moduleStage?: number | null;
  modulePath?: string | null;
  taskType?: string | null;
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
  correctAnswer?: AnswerData; // Only available in results view
  groupLabel?: string | null; // e.g., "Questions 1-7"
  groupInstructions?: string | null; // Shared instructions for the group
  audioUrl?: string | null; // Question-level audio (TOEFL Part A)
  itemPayload?: any | null; // TOEFL iBT rich item data
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

// PTE-specific data interfaces (objective items only)
export interface PteMcqData {
  prompt?: string;
  options: { key: string; text: string }[];
}

export interface PteReadingFillBlanksDropdownData {
  context: string;
  blanks: Record<string, { options: string[] }>;
}

export interface PteReadingFillBlanksDragDropData {
  textSegments: string[];
  options: string[];
  blankIds: string[];
}

export interface PteReorderParagraphData {
  blocks: { id: string; text: string }[];
}

export interface PteListeningFillBlanksData {
  transcript: string;
  blankIds: string[];
}

export interface PteHighlightCorrectSummaryData {
  prompt?: string;
  options: { key: string; text: string }[];
}

export interface PteSelectMissingWordData {
  prompt?: string;
  options: { key: string; text: string }[];
}

export interface PteHighlightIncorrectWordsData {
  transcript: string;
  tokens: { id: string; text: string; index: number }[];
}

export interface PteWriteFromDictationData {
  prompt?: string;
}

export type QuestionData =
  | MCQData
  | TFNGData
  | YNNGData
  | CompletionData
  | MatchingData
  | DropdownData
  | PteMcqData
  | PteReadingFillBlanksDropdownData
  | PteReadingFillBlanksDragDropData
  | PteReorderParagraphData
  | PteListeningFillBlanksData
  | PteHighlightCorrectSummaryData
  | PteSelectMissingWordData
  | PteHighlightIncorrectWordsData
  | PteWriteFromDictationData;

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
  writingRaw?: number | null;
  speakingRaw?: number | null;
  structureScore: number | null; // TOEFL
  writingBand: number | null;
  speakingBand: number | null;
  overallBand: number | null;
  overallScore: number | null; // TOEFL
  readingScore30?: number | null;
  listeningScore30?: number | null;
  writingScore30?: number | null;
  speakingScore30?: number | null;
  overallScore120?: number | null;
  scoreMappingVersion?: string | null;
  cefrLevel?: string | null;
  scoreReportable?: boolean | null;
  validUntil?: string | null;
  writingFeedback: WritingFeedback | null;
  speakingFeedback: SpeakingFeedback | null;
  readingPath?: string | null;
  listeningPath?: string | null;
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
