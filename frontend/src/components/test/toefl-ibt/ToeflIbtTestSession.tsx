'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Section, Question } from '@/types/test';
import ReadMcqRenderer from './ReadMcqRenderer';
import CompleteWordsRenderer from './CompleteWordsRenderer';
import ListenMcqRenderer from './ListenMcqRenderer';
import ToeflIbtWritingRenderer from './ToeflIbtWritingRenderer';
import ToeflIbtSpeakingRenderer from './ToeflIbtSpeakingRenderer';

type Phase =
  | 'loading'
  | 'stage1'
  | 'routing'
  | 'stage2'
  | 'linear'
  | 'test_complete';

interface AnswerMap {
  [questionId: string]:
    | string
    | Record<string, string>
    | {
        text?: string;
        wordCount?: number;
        recordings?: Record<string, { url: string; duration: number }>;
      };
}

type SpeakingRecord = { url: string; duration: number };

interface ToeflIbtTestSessionProps {
  testId: string;
  attemptId: string;
}

const SECTION_ORDER: Array<'reading' | 'listening' | 'writing' | 'speaking'> = [
  'reading',
  'listening',
  'writing',
  'speaking',
];

export default function ToeflIbtTestSession({ testId, attemptId }: ToeflIbtTestSessionProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [currentSectionType, setCurrentSectionType] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [error, setError] = useState<string | null>(null);
  const [routingMessage, setRoutingMessage] = useState('');
  const saveInFlightRef = useRef(false);

  // Load sections on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/tests/${testId}/sections`);
        const sections: Section[] = res.data?.data || res.data || [];
        setAllSections(sections);

        // Find first available section type in TOEFL iBT order
        const firstType = SECTION_ORDER.find((t) =>
          sections.some((s) => s.sectionType === t)
        );

        if (firstType) {
          setCurrentSectionType(firstType);
          await loadFirstModule(sections, firstType);
        } else {
          setError('No TOEFL iBT sections found in this test.');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load test sections.');
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const loadSectionQuestions = useCallback(async (section: Section) => {
    const res = await api.get(`/tests/${testId}/sections/${section.id}/questions`);
    const qs: Question[] = res.data?.data || res.data || [];
    qs.sort((a, b) => a.questionNumber - b.questionNumber);
    setCurrentSection(section);
    setQuestions(qs);
    setCurrentQuestionIndex(0);
    setCurrentPromptIndex(0);
  }, [testId]);

  const loadStage1 = useCallback(async (sections: Section[], sectionType: 'reading' | 'listening') => {
    const stage1 = sections.find(
      (s) => s.sectionType === sectionType && (s.moduleStage ?? 1) === 1
    );
    if (!stage1) {
      setError(`No Stage 1 ${sectionType} section found.`);
      return;
    }
    await loadSectionQuestions(stage1);
    setPhase('stage1');
  }, [loadSectionQuestions]);

  const loadLinearSection = useCallback(async (
    sections: Section[],
    sectionType: 'writing' | 'speaking',
  ) => {
    const first = sections.find((s) => s.sectionType === sectionType);
    if (!first) {
      setError(`No ${sectionType} section found.`);
      return;
    }
    await loadSectionQuestions(first);
    setPhase('linear');
  }, [loadSectionQuestions]);

  const loadFirstModule = useCallback(async (
    sections: Section[],
    sectionType: 'reading' | 'listening' | 'writing' | 'speaking',
  ) => {
    if (sectionType === 'reading' || sectionType === 'listening') {
      await loadStage1(sections, sectionType);
      return;
    }
    await loadLinearSection(sections, sectionType);
  }, [loadLinearSection, loadStage1]);

  // Handle answer for current question
  const handleAnswer = (
    value:
      | string
      | Record<string, string>
      | { text?: string; wordCount?: number; recordings?: Record<string, { url: string; duration: number }> },
  ) => {
    if (!questions[currentQuestionIndex]) return;
    const qId = questions[currentQuestionIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  // Save response to backend
  const saveResponse = async (
    question: Question,
    answer:
      | string
      | Record<string, string>
      | { text?: string; wordCount?: number; recordings?: Record<string, { url: string; duration: number }> },
  ) => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;

    try {
      const writingText =
        typeof answer === 'object' &&
        answer !== null &&
        typeof answer.text === 'string' &&
        answer.text.trim().length > 0
          ? answer.text
          : undefined;
      const wordCount =
        typeof answer === 'object' && answer !== null && typeof answer.wordCount === 'number'
          ? answer.wordCount
          : undefined;

      const payload = {
        questionId: question.id,
        sectionId: question.sectionId,
        answerData: answer,
        writingText,
        wordCount,
      };
      await api.post(`/attempts/${attemptId}/responses`, { responses: [payload] });
    } catch {
      // Non-fatal: log and continue
      console.warn('Failed to save response for question', question.id);
    } finally {
      saveInFlightRef.current = false;
    }
  };

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] ?? null : null;
  const isAdaptiveSection = currentSectionType === 'reading' || currentSectionType === 'listening';

  // Navigate to next question or trigger routing/completion
  const handleNext = async () => {
    // Save current answer first
    if (currentQuestion && currentAnswer !== null) {
      await saveResponse(currentQuestion, currentAnswer as any);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      return;
    }

    // End of section
    if (isAdaptiveSection && phase === 'stage1') {
      // Trigger adaptive routing
      setPhase('routing');
      setRoutingMessage('Analyzing your responses and preparing the next module...');
      try {
        const res = await api.post(
          `/attempts/${attemptId}/toefl-ibt/route/${currentSectionType}`
        );
        const { path, stage2SectionId } = res.data;
        setRoutingMessage(`Routing to ${path === 'upper' ? 'Advanced' : 'Standard'} Module...`);

        // Load Stage 2 section by ID
        const stage2 = allSections.find((s) => s.id === stage2SectionId);
        if (!stage2) {
          throw new Error('Stage 2 section not found locally; refreshing...');
        }
        await loadSectionQuestions(stage2);
        setPhase('stage2');
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Routing failed.');
      }
    } else {
      // Score this section
      if (isAdaptiveSection && phase === 'stage2') {
        try {
          await api.post(`/attempts/${attemptId}/toefl-ibt/score/${currentSectionType}`);
        } catch {
          console.warn('Score API call failed; continuing.');
        }
      }

      // Move to next section type or finish
      const currentIdx = SECTION_ORDER.indexOf(currentSectionType);
      const nextType = SECTION_ORDER.slice(currentIdx + 1).find((t) =>
        allSections.some((s) => s.sectionType === t)
      );

      if (nextType) {
        setCurrentSectionType(nextType);
        setAnswers({});
        await loadFirstModule(allSections, nextType);
      } else {
        // All sections done
        try {
          await api.post(`/attempts/${attemptId}/submit`);
        } catch {
          console.warn('Submit API call failed; continuing.');
        }
        setPhase('test_complete');
      }
    }
  };

  // --- Render helpers ---

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading TOEFL iBT test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => {
              try {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
              } catch (err) {}
              router.back();
            }}
            className="text-blue-600 hover:underline text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'routing') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-medium text-gray-800">{routingMessage}</p>
          <p className="text-sm text-gray-500">This will only take a moment...</p>
        </div>
      </div>
    );
  }

  if (phase === 'test_complete') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">Test Complete!</h1>
          <p className="text-gray-600">
            Your responses have been submitted. Your results will be available shortly.
          </p>
          <button
            onClick={() => {
              try {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
              } catch (err) {}
              router.push(`/attempts/${attemptId}/results`);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !currentSection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No questions available.</p>
      </div>
    );
  }

  const taskType = currentSection.taskType ?? currentQuestion.itemPayload?.taskType ?? null;
  const isCompleteWords = taskType === 'complete_words';
  const isListening = currentSection.sectionType === 'listening';
  const isWriting = currentSection.sectionType === 'writing';
  const isSpeaking = currentSection.sectionType === 'speaking';

  const completeWordsAnswer =
    typeof currentAnswer === 'object' && currentAnswer !== null
      ? (currentAnswer as Record<string, string>)
      : {};

  const mcqAnswer = typeof currentAnswer === 'string' ? currentAnswer : null;
  const writingText =
    typeof currentAnswer === 'object' && currentAnswer !== null && typeof currentAnswer.text === 'string'
      ? currentAnswer.text
      : '';
  const currentAnswerObject =
    typeof currentAnswer === 'object' && currentAnswer !== null
      ? (currentAnswer as Record<string, unknown>)
      : {};
  const speakingRecordings =
    typeof currentAnswer === 'object' &&
    currentAnswer !== null &&
    'recordings' in currentAnswer &&
    typeof (currentAnswer as any).recordings === 'object' &&
    (currentAnswer as any).recordings !== null
      ? ((currentAnswer as any).recordings as Record<string, SpeakingRecord>)
      : ({} as Record<string, SpeakingRecord>);

  const progressPct = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  const stageLabel =
    phase === 'stage1'
      ? 'Module 1'
      : phase === 'stage2'
      ? 'Module 2'
      : 'Section';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 capitalize">
            {currentSection.sectionType} — {stageLabel}
          </span>
          {taskType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">
              {taskType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-1 bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        {isListening ? (
          <ListenMcqRenderer
            question={currentQuestion}
            answer={mcqAnswer}
            onChange={(key) => handleAnswer(key)}
          />
        ) : isWriting ? (
          <ToeflIbtWritingRenderer
            section={currentSection}
            question={currentQuestion}
            answerText={writingText}
            onChange={(text) =>
              handleAnswer({
                text,
                wordCount: text.trim().split(/\s+/).filter(Boolean).length,
              })
            }
          />
        ) : isSpeaking ? (
          <ToeflIbtSpeakingRenderer
            section={currentSection}
            activePromptIndex={currentPromptIndex}
            recordings={speakingRecordings}
            onPromptChange={setCurrentPromptIndex}
            onRecordingComplete={(promptIndex, record) =>
              handleAnswer({
                ...currentAnswerObject,
                recordings: {
                  ...speakingRecordings,
                  [String(promptIndex)]: record,
                },
              })
            }
          />
        ) : isCompleteWords ? (
          <CompleteWordsRenderer
            question={currentQuestion}
            answers={completeWordsAnswer}
            onChange={(blankId, val) =>
              handleAnswer({ ...completeWordsAnswer, [blankId]: val })
            }
          />
        ) : (
          <ReadMcqRenderer
            question={currentQuestion}
            answer={mcqAnswer}
            onChange={(key) => handleAnswer(key)}
            passageText={currentSection.passageText}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-4 flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {currentQuestionIndex < questions.length - 1
            ? 'Next Question'
            : isAdaptiveSection && phase === 'stage1'
            ? 'Continue to Module 2'
            : currentSectionType === 'speaking'
            ? 'Finish Test'
            : 'Finish Section'}
        </button>
      </footer>
    </div>
  );
}
