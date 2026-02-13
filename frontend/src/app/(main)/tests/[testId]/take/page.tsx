'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Section, Question, SectionType, MCQData, DropdownData, TestType } from '@/types/test';
import { TestSessionProvider, useTestSession } from '@/contexts/TestSessionContext';
import { HiArrowLeft, HiBookOpen } from 'react-icons/hi';
import TestTimer from '@/components/test/TestTimer';
import QuestionRenderer from '@/components/test/QuestionRenderer';
import QuestionNavigation from '@/components/test/QuestionNavigation';
import AudioPlayer from '@/components/test/AudioPlayer';
import AudioRecorder from '@/components/test/AudioRecorder';
import ReadingPassage from '@/components/test/ReadingPassage';
import RichTextEditor from '@/components/test/RichTextEditor';
import SectionProgress from '@/components/test/SectionProgress';
import SubmitConfirmation from '@/components/test/SubmitConfirmation';
import TestFooter from '@/components/test/TestFooter';
import GroupInstruction from '@/components/test/GroupInstruction';
import { renderFormattedText } from '@/components/test/GroupInstruction';
import { useTimer } from '@/hooks/useTimer';
import { sectionTypeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';
import { EnterFullScreenIcon, ExitFullScreenIcon } from '@radix-ui/react-icons';
import CongratulationsModal from '@/components/test/CongratulationsModal';
import QuestionNavigator from '@/components/test/QuestionNavigator';

const SECTION_ORDER: SectionType[] = ['listening', 'reading', 'writing', 'speaking', 'structure'];
const SECTION_ORDER_TOEFL: SectionType[] = ['listening', 'structure', 'reading'];

/**
 * Calculate effective points for a question based on its type.
 * Multi-select MCQs use expectedAnswers, dropdowns use key count.
 */
function getEffectivePoints(q: Question): number {
  if (q.questionType === 'multiple_choice') {
    const mcqData = q.questionData as MCQData;
    if (mcqData.multiSelect) {
      return mcqData.expectedAnswers || 2;
    }
  }
  if (q.questionType === 'dropdown') {
    const dropdownData = q.questionData as DropdownData;
    return Object.keys(dropdownData.dropdowns).length;
  }
  return q.points || 1;
}

function TestTakingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, dispatch, autoSave, submitSection, submitTest } = useTestSession();
  const { isFocusMode, toggleFocusMode } = useLayout();

  const testId = params.testId as string;
  const attemptId = searchParams.get('attemptId') || '';
  const mode = searchParams.get('mode') || 'full';
  const practiceSection = searchParams.get('section') as SectionType | null;

  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);

  const [submitType, setSubmitType] = useState<'section' | 'test'>('section');
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [viewingDirections, setViewingDirections] = useState(false); // Controls interstitial directions pages

  const [testTitle, setTestTitle] = useState<string>('');
  const [testType, setTestType] = useState<TestType>('academic'); // Default, updated on load

  // Load test title
  useEffect(() => {
    async function loadTestDetails() {
      try {
        const res = await api.get(`/tests/${testId}`);
        setTestTitle(res.data.title);
        setTestType(res.data.testType);
      } catch (err) {
        console.error('Failed to load test details:', err);
      }
    }
    if (testId) {
      loadTestDetails();
    }
  }, [testId]);

  // Resizable split pane state
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((mouseMoveEvent.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth >= 20 && newWidth <= 80) { // Limit between 20% and 80%
          setLeftPaneWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleTimeUp = useCallback(async () => {
    if (state.currentSectionType) {
      await submitSection(state.currentSectionType);
      advanceToNextSection();
    }
  }, [state.currentSectionType, submitSection]);

  const timer = useTimer({ onTimeUp: handleTimeUp });

  // Load test sections and initialize session
  useEffect(() => {
    async function init() {
      try {
        const sectionsRes = await api.get(`/tests/${testId}/sections`);
        // If we didn't have test details yet, fetch them (or rely on what we have, but init depends on testId)
        // Actually, we need testType here to determine order.
        // We can fetch test details in parallel
        const testDetailsRes = await api.get(`/tests/${testId}`);
        const fetchedTestType = testDetailsRes.data.testType;
        setTestType(fetchedTestType); // Sync state

        const allSections: Section[] = sectionsRes.data;
        setSections(allSections);

        const currentSectionOrder = fetchedTestType === 'toefl_itp' ? SECTION_ORDER_TOEFL : SECTION_ORDER;
        const sectionTypes = mode === 'section_practice' && practiceSection
          ? [practiceSection]
          : currentSectionOrder;

        const filteredSections = allSections.filter(s =>
          sectionTypes.includes(s.sectionType)
        );

        dispatch({
          type: 'INIT_SESSION',
          payload: {
            attemptId,
            testId,
            mode: mode as 'full' | 'section_practice',
            sections: filteredSections,
          },
        });

        // Load first section
        const firstType = sectionTypes[0];
        const firstSections = filteredSections.filter(s => s.sectionType === firstType);
        if (firstSections.length > 0) {
          await loadSectionQuestions(firstSections, firstType, filteredSections, fetchedTestType);
        }
      } catch (err) {
        console.error('Failed to initialize test:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [testId, attemptId, mode, practiceSection]);

  async function loadSectionQuestions(
    sectionParts: Section[],
    sectionType: SectionType,
    allSections: Section[],
    resolvedTestType?: TestType
  ) {
    const allQuestions: Question[] = [];
    for (const section of sectionParts) {
      const res = await api.get(`/tests/${testId}/sections/${section.id}/questions`);
      allQuestions.push(...res.data);
      dispatch({ type: 'SET_QUESTIONS', payload: { sectionId: section.id, questions: res.data } });
    }
    setQuestions(allQuestions);
    setCurrentQuestionIndex(0);

    // Calculate total duration for this section type
    const totalDuration = sectionParts.reduce((sum, s) => sum + s.durationMinutes, 0);
    const activeTestType = resolvedTestType ?? testType;
    const currentSectionOrder = activeTestType === 'toefl_itp' ? SECTION_ORDER_TOEFL : SECTION_ORDER;

    dispatch({
      type: 'SET_SECTION',
      payload: {
        sectionType,
        index: currentSectionOrder.indexOf(sectionType),
        timeRemaining: totalDuration * 60,
      },
    });
    timer.start(totalDuration * 60);

    // Notify backend
    await api.put(`/attempts/${attemptId}/section-start`, { sectionType });

    // For TOEFL iTP, show directions initially
    if (activeTestType === 'toefl_itp') {
      setViewingDirections(true);
    }
  }

  function advanceToNextSection() {
    if (mode === 'section_practice') {
      // Practice mode: go to results
      router.push(`/results/${attemptId}`);
      return;
    }

    const currentSectionOrder = testType === 'toefl_itp' ? SECTION_ORDER_TOEFL : SECTION_ORDER;
    const currentIdx = currentSectionOrder.indexOf(state.currentSectionType!);
    if (currentIdx >= currentSectionOrder.length - 1) {
      // Last section: submit test
      handleSubmitTest();
      return;
    }

    const nextType = currentSectionOrder[currentIdx + 1];
    const nextSections = sections.filter(s => s.sectionType === nextType);
    if (nextSections.length > 0) {
      loadSectionQuestions(nextSections, nextType, sections, testType);
    }
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, answer } });
  };

  const handleToggleFlag = (questionId: string) => {
    dispatch({ type: 'FLAG_QUESTION', payload: { questionId } });
  };

  const focusQuestionAtIndex = useCallback((index: number) => {
    setTimeout(() => {
      const element = document.getElementById(`question-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = element.querySelector('input, textarea, select') as HTMLElement | null;
        if (input) {
          input.focus({ preventScroll: true });
        }
      }
    }, 0);
  }, []);

  const selectQuestionIndex = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    focusQuestionAtIndex(index);
  }, [focusQuestionAtIndex]);

  const handleNextQuestion = () => {
    // TOEFL ITP Navigation Logic
    if (testType === 'toefl_itp' && state.currentSectionType !== 'reading') {
      handleToeflNavigation('next');
      return;
    }

    const currentSectionOrder = testType === 'toefl_itp' ? SECTION_ORDER_TOEFL : SECTION_ORDER;

    if (currentQuestionIndex < questions.length - 1) {
      selectQuestionIndex(currentQuestionIndex + 1);
    } else if (mode === 'full' && currentSectionOrder.indexOf(state.currentSectionType!) < currentSectionOrder.length - 1) {
      openSubmitModal('section');
    } else {
      openSubmitModal('test');
    }
  };

  const handleAudioEnd = useCallback(() => {
    if (testType === 'toefl_itp' && state.currentSectionType === 'listening') {
      // Auto-advance when audio ends
      // We use a small timeout to allow the user to see the "Audio Finished" state briefly if needed,
      // but usually immediate is better for this test type.
      // However, we must ensure we don't double-advance if the user clicked next manually.
      // This simple call is usually safe as it updates state based on current state.
      handleNextQuestion();
    }
  }, [testType, state.currentSectionType, handleNextQuestion]);


  const handlePreviousQuestion = () => {
    if (testType === 'toefl_itp' && state.currentSectionType !== 'reading') {
      handleToeflNavigation('prev');
      return;
    }

    if (currentQuestionIndex > 0) {
      selectQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleToeflNavigation = (dir: 'next' | 'prev') => {
    const shouldShowDirectionsBetweenParts = (fromIdx: number, toIdx: number) => {
      const fromPartNo = getResolvedPartNumber(fromIdx);
      const toPartNo = getResolvedPartNumber(toIdx);
      return fromPartNo !== toPartNo;
    };

    if (dir === 'next') {
      if (viewingDirections) {
        setViewingDirections(false);
        return;
      }

      // Part B/C: treat entire recording as one unit — Next advances to next recording
      if (isPartBCMode) {
        if (activePartIndex < currentSectionParts.length - 1) {
          const nextPartIdx = activePartIndex + 1;
          const nextPart = currentSectionParts[nextPartIdx];
          const firstQOfNextPart = questions.find(q => q.sectionId === nextPart.id);
          if (firstQOfNextPart) {
            setActivePartIndex(nextPartIdx);
            setCurrentQuestionIndex(questions.indexOf(firstQOfNextPart));
            setViewingDirections(shouldShowDirectionsBetweenParts(activePartIndex, nextPartIdx));
          }
        } else {
          openSubmitModal('section');
        }
        return;
      }

      const currentPartQuestions = questions.filter(q => q.sectionId === currentSectionPart.id);
      const isLastOfPart = questions.indexOf(currentPartQuestions[currentPartQuestions.length - 1]) === currentQuestionIndex;

      if (isLastOfPart) {
        if (activePartIndex < currentSectionParts.length - 1) {
          // Move to next part
          const nextPartIdx = activePartIndex + 1;
          const nextPart = currentSectionParts[nextPartIdx];
          const firstQOfNextPart = questions.find(q => q.sectionId === nextPart.id);

          if (firstQOfNextPart) {
            setActivePartIndex(nextPartIdx);
            setCurrentQuestionIndex(questions.indexOf(firstQOfNextPart));
            setViewingDirections(shouldShowDirectionsBetweenParts(activePartIndex, nextPartIdx));
          }
        } else {
          // End of section
          openSubmitModal('section');
        }
      } else {
        // Normal next question
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }
    } else {
      // Previous — disabled for Part B/C (no going back in TOEFL ITP)
      if (isPartBCMode) return;

      if (viewingDirections) {
        if (activePartIndex > 0) {
          // Go back to last question of previous part
          const prevPartIdx = activePartIndex - 1;
          const prevPart = currentSectionParts[prevPartIdx];
          const lastQOfPrevPart = questions.filter(q => q.sectionId === prevPart.id).pop();

          if (lastQOfPrevPart) {
            setActivePartIndex(prevPartIdx);
            setCurrentQuestionIndex(questions.indexOf(lastQOfPrevPart));
            setViewingDirections(false);
          }
        }
        // If first part, do nothing (keep showing directions)
      } else {
        const currentPartQuestions = questions.filter(q => q.sectionId === currentSectionPart.id);
        const isFirstOfPart = questions.indexOf(currentPartQuestions[0]) === currentQuestionIndex;

        if (isFirstOfPart) {
          setViewingDirections(true);
        } else {
          setCurrentQuestionIndex(prev => prev - 1);
        }
      }
    }
  };

  const handleSubmitSection = async () => {
    if (state.currentSectionType) {
      timer.stop();
      await submitSection(state.currentSectionType);
      setShowSubmitModal(false);
      advanceToNextSection();
    }
  };

  const handleSubmitTest = async () => {
    timer.stop();
    await submitTest();
    setShowSubmitModal(false);
    setShowCongratulationsModal(true);
  };

  const handleViewResults = () => {
    router.push(`/results/${attemptId}`);
  };

  const openSubmitModal = (type: 'section' | 'test') => {
    setSubmitType(type);
    setShowSubmitModal(true);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentSectionParts = sections.filter(s => s.sectionType === state.currentSectionType);

  // Reset activePartIndex and currentPromptIndex when changing section type
  useEffect(() => {
    setActivePartIndex(0);
    setCurrentPromptIndex(0);
  }, [state.currentSectionType]);

  // Reset currentPromptIndex when changing active part
  useEffect(() => {
    setCurrentPromptIndex(0);
  }, [activePartIndex]);

  // Current active part based on tab selection
  const currentSectionPart = currentSectionParts[activePartIndex] || currentSectionParts[0];

  const resolvedPartNumbers = useMemo(() => {
    return currentSectionParts.map((part, idx) => {
      // TOEFL ITP Listening: infer from title/instructions first to avoid bad legacy part_number data
      if (testType === 'toefl_itp' && state.currentSectionType === 'listening') {
        const source = `${part?.title || ''} ${part?.instructions || ''}`.toLowerCase();
        if (/\bpart\s*a\b/.test(source)) return 1;
        if (/\bpart\s*b\b/.test(source)) return 2;
        if (/\bpart\s*c\b/.test(source)) return 3;
      }

      if (part?.partNumber != null) return part.partNumber;

      // If missing, keep same logical part as previous for listening recordings
      if (testType === 'toefl_itp' && state.currentSectionType === 'listening' && idx > 0) {
        return currentSectionParts[idx - 1]?.partNumber ?? idx;
      }

      return idx + 1;
    });
  }, [currentSectionParts, testType, state.currentSectionType]);

  const getResolvedPartNumber = useCallback((index: number) => {
    return resolvedPartNumbers[index] ?? index + 1;
  }, [resolvedPartNumbers]);

  // TOEFL ITP Part B/C: all questions for one recording shown scrollably, Next advances recording
  const isPartBCMode = testType === 'toefl_itp' &&
    state.currentSectionType === 'listening' &&
    getResolvedPartNumber(activePartIndex) >= 2;

  // Sync activePartIndex with the currently selected question so footer navigation
  // (next/previous/question click) keeps the visible part in sync across sections.
  useEffect(() => {
    if (currentQuestion) {
      const partIndex = currentSectionParts.findIndex(p => p.id === currentQuestion.sectionId);
      if (partIndex !== -1 && partIndex !== activePartIndex) {
        setActivePartIndex(partIndex);
      }
    }
  }, [currentQuestion, currentSectionParts, activePartIndex]);

  // Filter questions for the active part
  const activePartQuestions = useMemo(() => {
    if (!currentSectionPart) return questions;
    // For reading/listening with multiple parts, filter to active part
    if (currentSectionParts.length > 1) {
      return questions.filter(q => q.sectionId === currentSectionPart.id);
    }
    return questions;
  }, [questions, currentSectionPart, currentSectionParts]);

  // Compute the continuous display number offset for the active part
  const partNumberOffset = useMemo(() => {
    if (currentSectionParts.length <= 1) return 0;
    let offset = 0;
    for (let i = 0; i < activePartIndex; i++) {
      const partId = currentSectionParts[i]?.id;
      if (partId) {
        // Sum effective points (accounts for multi-select MCQs, dropdowns, etc.)
        offset += questions.filter(q => q.sectionId === partId).reduce((sum, q) => sum + getEffectivePoints(q), 0);
      }
    }
    return offset;
  }, [questions, currentSectionParts, activePartIndex]);

  const unansweredCount = (() => {
    const sectionType = state.currentSectionType;
    if (sectionType === 'writing') {
      // Writing is answered if any part has text
      return currentSectionParts.filter(
        part => !state.answers[`writing_${part.id}`]?.text?.trim()
      ).length;
    }
    if (sectionType === 'speaking') {
      // Speaking is answered if any recording exists for the part
      return currentSectionParts.filter(
        part => !state.answers[`speaking_${part.id}`]?.recordings?.[0]
      ).length;
    }
    return questions.filter(q => !state.answeredQuestions.has(q.id)).length;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col bg-gray-50 overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
      {/* Test Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full px-6 py-2 grid grid-cols-3 items-center">
          {/* Left: Test Title */}
          {/* Left: Test Title */}
          <div className="flex items-center justify-start space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exit to Dashboard"
            >
              <HiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-gray-900 truncate max-w-[300px]" title={testTitle}>
              {testTitle}
            </h1>
          </div>

          {/* Center: Section Progress */}
          <div className="flex items-center justify-center">
            <SectionProgress
              sections={testType === 'toefl_itp' ? SECTION_ORDER_TOEFL : SECTION_ORDER}
              currentSection={state.currentSectionType || 'listening'}
              completedSections={state.completedSections}
            />
          </div>

          {/* Right: Controls */}
          <div className="flex items-center justify-end space-x-4">
            {/* Focus Mode button removed as test page is always full screen */}

            <TestTimer
              timeRemaining={timer.timeRemaining}
              isRunning={timer.isRunning}
            />

            {state.isAutoSaving && (
              <span className="text-xs text-gray-400">Saving...</span>
            )}

            <button
              onClick={() => {
                const currentSectionOrder = testType === 'toefl_itp' ? SECTION_ORDER_TOEFL : SECTION_ORDER;
                openSubmitModal(
                  mode === 'full' && currentSectionOrder.indexOf(state.currentSectionType!) < currentSectionOrder.length - 1
                    ? 'section'
                    : 'test'
                )
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              {(() => {
                const currentSectionOrder = testType === 'toefl_itp' ? SECTION_ORDER_TOEFL : SECTION_ORDER;
                return mode === 'full' && currentSectionOrder.indexOf(state.currentSectionType!) < currentSectionOrder.length - 1
                  ? 'Next Section'
                  : 'Submit Test';
              })()}
            </button>
          </div>
        </div>
      </div>

      {/* Test Body */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full">
          {/* TOEFL iTP Specific Rendering (Pagination) */}
          {testType === 'toefl_itp' && state.currentSectionType !== 'reading' ? (
            <div className="max-w-4xl mx-auto px-4 py-8 h-full flex flex-col">
              {viewingDirections ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <HiBookOpen className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {currentSectionPart.title || 'Directions'}
                  </h2>
                  <div className="prose prose-blue max-w-none text-gray-600 mb-8">
                    {currentSectionPart.instructions || 'Please read the instructions carefully before proceeding.'}
                  </div>
                  <button
                    onClick={() => setViewingDirections(false)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    Start {currentSectionPart.title ? currentSectionPart.title : 'Part'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Audio Player if applicable */}
                  {currentSectionPart?.audioUrl && (
                    <div className="mb-6">
                      <AudioPlayer
                        src={currentSectionPart.audioUrl}
                        playOnce={true}
                      />
                    </div>
                  )}

                  {/* Instructions Banner - Removed as per user request (redundant with Directions page) */}
                  {/* 
                  {currentSectionPart?.instructions && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
                      <h4 className="font-bold mb-1">Instructions</h4>
                      {currentSectionPart.instructions}
                    </div>
                  )}
                  */}

                  {/* Question Navigator */}
                  <div className="mb-4">
                    <QuestionNavigator
                      totalQuestions={questions.length}
                      currentIndex={currentQuestionIndex}
                      onSelect={(index) => {
                        if (state.currentSectionType !== 'listening') {
                          setCurrentQuestionIndex(index);
                        }
                      }}
                      answeredIndices={
                        new Set(
                          questions
                            .map((q, idx) => state.answers[q.id] ? idx : -1)
                            .filter(idx => idx !== -1)
                        )
                      }
                      allowNavigation={state.currentSectionType !== 'listening'}
                      startIndex={1}
                    />
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                    {isPartBCMode ? (
                      // Part B/C: all questions for this recording, scrollable
                      <div className="space-y-2">
                        {questions
                          .filter(q => q.sectionId === currentSectionPart.id)
                          .map((question) => {
                            const partQs = questions.filter(q => q.sectionId === currentSectionPart.id);
                            const prevQs = partQs.slice(0, partQs.indexOf(question));
                            const startNum = partNumberOffset + prevQs.reduce((sum, q) => sum + getEffectivePoints(q), 0) + 1;
                            return (
                              <QuestionRenderer
                                key={question.id}
                                question={question}
                                answer={state.answers[question.id]}
                                onAnswerChange={handleAnswerChange}
                                displayNumber={startNum}
                                isActive={false}
                              />
                            );
                          })}
                      </div>
                    ) : currentQuestion && (
                      <div className="space-y-6">
                        {/* Group Instructions if present */}
                        {currentQuestion.groupLabel && (
                          <GroupInstruction
                            groupLabel={currentQuestion.groupLabel}
                            groupInstructions={currentQuestion.groupInstructions}
                            variant="compact"
                          />
                        )}

                        {/* Question Itself */}
                        <QuestionRenderer
                          question={currentQuestion}
                          answer={state.answers[currentQuestion.id]}
                          onAnswerChange={handleAnswerChange}
                          displayNumber={currentQuestionIndex + 1}
                          isActive={true}
                          onAudioEnd={handleAudioEnd}
                          playOnce={testType === 'toefl_itp'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer provides the only navigation controls to avoid duplicate Previous/Next UI */}
                </>
              )}
            </div>
          ) : (
            /* Standard Scrolling View (IELTS etc. + Reading) */
            <>
              {/* Listening Section */}
              {(state.currentSectionType === 'listening' || state.currentSectionType === 'structure') && (
                <div className="h-full overflow-y-auto">
                  {/* Keep listening section constrained or make full width? Usually listening is centered content. Let's keep max-w-7xl for listening/writing/speaking unless requested otherwise. Reading needs full width. */}
                  <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                    {/* Part Navigation for Listening/Structure */}
                    {currentSectionParts.length > 1 && (
                      <div className="flex items-center space-x-1 mb-4 border-b border-gray-200 pb-2 overflow-x-auto">
                        {currentSectionParts.map((part, idx) => (
                          <button
                            key={part.id}
                            onClick={() => {
                              setActivePartIndex(idx);
                              const firstQIdx = questions.findIndex(q => q.sectionId === part.id);
                              if (firstQIdx !== -1) setCurrentQuestionIndex(firstQIdx);
                            }}
                            className={cn(
                              "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                              activePartIndex === idx
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            Part {getResolvedPartNumber(idx)}
                          </button>
                        ))}
                      </div>
                    )}

                    {currentSectionPart?.audioUrl && (
                      <AudioPlayer
                        src={currentSectionPart.audioUrl}
                        playOnce={mode === 'full'}
                      />
                    )}

                    {/* Always show instructions if available */}
                    {currentSectionPart?.instructions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
                        <h4 className="font-bold mb-1">Instructions</h4>
                        {currentSectionPart.instructions}
                      </div>
                    )}

                    {/* Group questions by groupLabel */}
                    {(() => {
                      const grouped: { [key: string]: Question[] } = {};
                      const ungrouped: Question[] = [];

                      activePartQuestions.forEach(q => {
                        if (q.groupLabel) {
                          if (!grouped[q.groupLabel]) {
                            grouped[q.groupLabel] = [];
                          }
                          grouped[q.groupLabel].push(q);
                        } else {
                          ungrouped.push(q);
                        }
                      });

                      return (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                          {/* Render grouped questions */}
                          {Object.entries(grouped).map(([groupLabel, groupQuestions]) => {
                            const firstQuestion = groupQuestions[0];
                            return (
                              <div key={groupLabel}>
                                <GroupInstruction
                                  groupLabel={groupLabel}
                                  groupInstructions={firstQuestion.groupInstructions}
                                  variant="compact"
                                />

                                {/* Render all questions in this group */}
                                <div className="space-y-4">
                                  {groupQuestions.map((question) => {
                                    // Calculate display number based on accumulated points of previous questions
                                    const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                    const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + getEffectivePoints(q), 0) + 1;

                                    return (
                                      <div key={question.id} className="pl-0">
                                        <QuestionRenderer
                                          question={question}
                                          answer={state.answers[question.id]}
                                          onAnswerChange={handleAnswerChange}
                                          displayNumber={startNum}
                                          isActive={questions.indexOf(question) === currentQuestionIndex}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* Render ungrouped questions */}
                          {ungrouped.map(question => {
                            // Calculate display number based on accumulated points of previous questions
                            const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                            const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + getEffectivePoints(q), 0) + 1;

                            return (
                              <div key={question.id} className="pt-4 border-t border-gray-100 first:border-0 first:pt-0">
                                <QuestionRenderer
                                  question={question}
                                  answer={state.answers[question.id]}
                                  onAnswerChange={handleAnswerChange}
                                  displayNumber={startNum}
                                  isActive={questions.indexOf(question) === currentQuestionIndex}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Reading Section */}
              {state.currentSectionType === 'reading' && (
                <div className="flex flex-col h-full">



                  {/* Full-width Instructions Banner */}
                  {currentSectionPart?.instructions && (
                    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 text-center text-sm font-medium text-blue-800 shrink-0">
                      {currentSectionPart.instructions}
                    </div>
                  )}

                  <div className="flex flex-1 overflow-hidden" ref={containerRef}>
                    {/* Left Pane: Reading Passage */}
                    <div
                      className="h-full border-r border-gray-200 bg-white shrink-0"
                      style={{ width: `${leftPaneWidth}%` }}
                    >
                      <div className="h-full overflow-y-auto">
                        {currentSectionPart && (
                          <ReadingPassage
                            title={currentSectionPart.passageTitle || ''}
                            content={currentSectionPart.passageText || ''}
                            highlightEnabled={true}
                          />
                        )}
                      </div>
                    </div>

                    {/* Drag Handle */}
                    <div
                      className="w-1.5 bg-gray-100 hover:bg-blue-400 cursor-col-resize hover:w-2 transition-all z-10 flex items-center justify-center shrink-0 active:bg-blue-600 -ml-0.5"
                      onMouseDown={startResizing}
                    >
                      <div className="h-8 w-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* Right Pane: Questions */}
                    <div
                      className="h-full bg-white grow min-w-0 flex flex-col" // min-w-0 used to allow flex child to shrink below content size
                    >
                      {/* Question Navigator for Reading */}
                      {testType === 'toefl_itp' && (
                        <div className="shrink-0">
                          <QuestionNavigator
                            totalQuestions={questions.length}
                            currentIndex={currentQuestionIndex}
                            onSelect={(index) => {
                              setCurrentQuestionIndex(index);
                              // Ensure right pane scrolls to top or specific question if possible?
                              // The navigator already syncs index, which renders proper active state.
                              // Ideally we scroll to the question in the list.
                              // For now, index sync is enough as reading usually scrolls the user or we'd needrefs.
                            }}
                            answeredIndices={
                              new Set(
                                questions
                                  .map((q, idx) => state.answers[q.id] ? idx : -1)
                                  .filter(idx => idx !== -1)
                              )
                            }
                            allowNavigation={true}
                            startIndex={1}
                          />
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">


                        {/* Group questions by groupLabel */}
                        {(() => {
                          const grouped: { [key: string]: Question[] } = {};
                          const ungrouped: Question[] = [];

                          activePartQuestions.forEach(q => {
                            if (q.groupLabel) {
                              if (!grouped[q.groupLabel]) {
                                grouped[q.groupLabel] = [];
                              }
                              grouped[q.groupLabel].push(q);
                            } else {
                              ungrouped.push(q);
                            }
                          });

                          return (
                            <>
                              {/* Render grouped questions */}
                              {Object.entries(grouped).map(([groupLabel, groupQuestions]) => {
                                const firstQuestion = groupQuestions[0];
                                const isNoteStyle = firstQuestion.questionType === 'completion' && (firstQuestion.questionData as any).style !== 'standard';

                                // Detect "summary" mode: note-style completions WITHOUT bullet markers = flowing paragraph
                                const isSummaryFlow = isNoteStyle && groupQuestions.every(q => {
                                  const ctx = ((q.questionData as any).context || '').trim();
                                  return q.questionType === 'completion' &&
                                    !ctx.startsWith('-') &&
                                    !ctx.startsWith('–') &&
                                    !ctx.startsWith('—') &&
                                    !ctx.startsWith('•') &&
                                    !ctx.startsWith('*');
                                });

                                return (
                                  <div key={groupLabel} className="mb-8">
                                    {/* Group header */}
                                    <GroupInstruction
                                      groupLabel={groupLabel}
                                      groupInstructions={firstQuestion.groupInstructions}
                                      variant={isNoteStyle ? 'compact' : 'default'}
                                    />

                                    {/* Summary flow: render ALL questions as inline text in ONE paragraph */}
                                    {isSummaryFlow ? (
                                      <div className="pl-6">
                                        {/* Render Title if it exists (e.g. from the first question) */}
                                        {(groupQuestions[0].questionData as any).title && (
                                          <h4 className="font-bold text-gray-900 mb-2 text-lg">
                                            {(groupQuestions[0].questionData as any).title}
                                          </h4>
                                        )}
                                        <div className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap">
                                          {groupQuestions.map((question) => {
                                            const qData = question.questionData as any;
                                            const context = qData.context || '';
                                            const blankMarker = qData.blankPosition || '___';
                                            let parts = context.split(blankMarker);
                                            if (parts.length === 1) {
                                              for (const marker of ['{blank}', '___', '_____', '______', '__________']) {
                                                const testParts = context.split(marker);
                                                if (testParts.length > 1) { parts = testParts; break; }
                                              }
                                            }
                                            // Calculate display number based on effective points of previous questions
                                            const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                            const displayNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + getEffectivePoints(q), 0) + 1;
                                            const qIndex = questions.indexOf(question);
                                            return (
                                              <span key={question.id} id={`question-${qIndex}`}>
                                                {parts.map((part: string, i: number) => (
                                                  <span key={i}>
                                                    <span>{part}</span>
                                                    {i < parts.length - 1 && (
                                                      <span className="inline-block relative mx-1 align-middle">
                                                        <input
                                                          type="text"
                                                          value={state.answers[question.id] || ''}
                                                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                          className={cn(
                                                            "h-8 w-32 rounded-md border bg-white px-2 text-sm text-gray-900 font-medium text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                                                            qIndex === currentQuestionIndex
                                                              ? "border-blue-500 ring-2 ring-blue-100"
                                                              : "border-gray-300"
                                                          )}
                                                        />
                                                        {!state.answers[question.id] && (
                                                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                                                            {displayNum}
                                                          </span>
                                                        )}
                                                      </span>
                                                    )}
                                                  </span>
                                                ))}
                                                {' '}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : (
                                      /* Standard or Note (bulleted) rendering: each question in its own block */
                                      <div className={isNoteStyle ? "space-y-0 pl-6" : "space-y-4"}>
                                        {groupQuestions.map((question) => {
                                          const isNoteStyle = question.questionType === 'completion' && (question.questionData as any).style !== 'standard';

                                          // Calculate display number based on accumulated effective points
                                          const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                          const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + getEffectivePoints(q), 0) + 1;
                                          // For MCQs, pass startNum and let QuestionRenderer handle multi-badges
                                          // For other types with multiple points, show range
                                          const effectivePoints = getEffectivePoints(question);
                                          const isMCQ = question.questionType === 'multiple_choice';
                                          const displayNum = (!isMCQ && effectivePoints > 1) ? `${startNum}-${startNum + effectivePoints - 1}` : startNum;

                                          return (
                                            <div
                                              key={question.id}
                                              className={cn(
                                                "transition-colors duration-300",
                                                isNoteStyle ? "" : "-mx-4 px-4"
                                              )}
                                              id={`question-${questions.indexOf(question)}`}
                                            >
                                              <QuestionRenderer
                                                question={question}
                                                answer={state.answers[question.id]}
                                                onAnswerChange={handleAnswerChange}
                                                displayNumber={displayNum}
                                                isActive={questions.indexOf(question) === currentQuestionIndex}
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Render ungrouped questions */}
                              {ungrouped.length > 0 && (() => {
                                // Auto-group consecutive summary completion questions by title
                                type UngroupedItem = { type: 'single'; question: Question } | { type: 'summaryFlow'; title: string; questions: Question[] };
                                const items: UngroupedItem[] = [];

                                ungrouped.forEach((question) => {
                                  const isCompletion = question.questionType === 'completion';
                                  const qData = question.questionData as any;
                                  const isNoteStyle = isCompletion && qData.style !== 'standard';
                                  const ctx = (qData.context || '').trim();
                                  const isSummary = isNoteStyle &&
                                    !ctx.startsWith('-') &&
                                    !ctx.startsWith('–') &&
                                    !ctx.startsWith('—') &&
                                    !ctx.startsWith('•') &&
                                    !ctx.startsWith('*');

                                  if (isSummary && qData.title) {
                                    const last = items[items.length - 1];
                                    if (last && last.type === 'summaryFlow' && last.title === qData.title) {
                                      last.questions.push(question);
                                    } else {
                                      items.push({ type: 'summaryFlow', title: qData.title, questions: [question] });
                                    }
                                  } else {
                                    items.push({ type: 'single', question });
                                  }
                                });

                                return (
                                  <div className="space-y-4">
                                    {items.map((item, idx) => {
                                      if (item.type === 'summaryFlow') {
                                        return (
                                          <div key={`summary-${idx}`} className="pl-2">
                                            <h4 className="mb-3 text-lg font-bold text-gray-900">{item.title}</h4>
                                            <div className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap">
                                              {item.questions.map((question) => {
                                                const qData = question.questionData as any;
                                                const context = qData.context || '';
                                                const blankMarker = qData.blankPosition || '___';
                                                let parts = context.split(blankMarker);
                                                if (parts.length === 1) {
                                                  for (const marker of ['{blank}', '___', '_____', '______', '__________']) {
                                                    const testParts = context.split(marker);
                                                    if (testParts.length > 1) { parts = testParts; break; }
                                                  }
                                                }

                                                // Calculate start number based on effective points of previous questions
                                                const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                                const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + getEffectivePoints(q), 0) + 1;
                                                const effectivePoints = getEffectivePoints(question);
                                                const isMCQ = question.questionType === 'multiple_choice';
                                                const displayNum = (!isMCQ && effectivePoints > 1) ? `${startNum}-${startNum + effectivePoints - 1}` : startNum;

                                                const qIndex = questions.indexOf(question);

                                                return (
                                                  <span key={question.id} id={`question-${qIndex}`}>
                                                    {parts.map((part: string, i: number) => (
                                                      <span key={i}>
                                                        <span>{part}</span>
                                                        {i < parts.length - 1 && (
                                                          <span className="inline-block relative mx-1 align-middle">
                                                            <input
                                                              type="text"
                                                              value={state.answers[question.id] || ''}
                                                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                              className={cn(
                                                                "h-8 w-32 rounded-md border bg-white px-2 text-sm text-gray-900 font-medium text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                                                                qIndex === currentQuestionIndex
                                                                  ? "border-blue-500 ring-2 ring-blue-100"
                                                                  : "border-gray-300"
                                                              )}
                                                            />
                                                            {!state.answers[question.id] && (
                                                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium whitespace-nowrap">
                                                                {displayNum}
                                                              </span>
                                                            )}
                                                          </span>
                                                        )}
                                                      </span>
                                                    ))}
                                                    {' '}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        const question = item.question;
                                        const isNoteStyle = question.questionType === 'completion' && (question.questionData as any).style !== 'standard';

                                        // Calculate display number based on effective points
                                        const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                        const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + getEffectivePoints(q), 0) + 1;
                                        const effectivePoints = getEffectivePoints(question);
                                        const isMCQ = question.questionType === 'multiple_choice';
                                        const displayNum = (!isMCQ && effectivePoints > 1) ? `${startNum}-${startNum + effectivePoints - 1}` : startNum;

                                        return (
                                          <div
                                            key={question.id}
                                            className={cn(
                                              "transition-colors duration-300",
                                              isNoteStyle ? "" : "-mx-4 px-4"
                                            )}
                                            id={`question-${questions.indexOf(question)}`}
                                          >
                                            <QuestionRenderer
                                              question={question}
                                              answer={state.answers[question.id]}
                                              onAnswerChange={handleAnswerChange}
                                              displayNumber={displayNum}
                                              isActive={questions.indexOf(question) === currentQuestionIndex}
                                            />
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                );
                              })()}
                            </>
                          );
                        })()}

                        {/* Bottom spacer for footer */}
                        <div className="h-20" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Writing Section */}
              {state.currentSectionType === 'writing' && (
                <div className="h-full overflow-y-auto">
                  <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
                    {/* Writing task navigation (Task 1 / Task 2) */}
                    {currentSectionParts.length > 1 && (
                      <div className="mb-6 flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                        {currentSectionParts.map((part, idx) => {
                          const isActive = activePartIndex === idx;
                          return (
                            <button
                              key={part.id}
                              onClick={() => {
                                setActivePartIndex(idx);
                                // Also try to find the question associated with this part to update footer state
                                // Assuming 1 question per writing task part
                                const questionIdx = questions.findIndex(q => q.sectionId === part.id);
                                if (questionIdx !== -1) {
                                  setCurrentQuestionIndex(questionIdx);
                                }
                              }}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              Task {part.taskNumber}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        {currentSectionPart && (
                          <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-2">
                              Writing Task {currentSectionPart.taskNumber}
                            </h3>
                            {currentSectionPart.imageUrl && (
                              <img
                                src={currentSectionPart.imageUrl}
                                alt="Task chart/graph"
                                className="mb-4 rounded-lg border border-gray-200 max-w-full"
                              />
                            )}
                            <div className="prose prose-sm text-gray-900 prose-p:text-gray-900 prose-headings:text-gray-900 prose-li:text-gray-900 max-w-none">
                              {currentSectionPart.taskDescription}
                            </div>
                            <p className="mt-3 text-sm text-gray-900 font-medium">
                              Write at least {currentSectionPart.minWords} words.
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <RichTextEditor
                          value={
                            currentSectionPart
                              ? (state.answers[`writing_${currentSectionPart.id}`]?.text || '')
                              : ''
                          }
                          onChange={(text) => {
                            if (currentSectionPart) {
                              handleAnswerChange(`writing_${currentSectionPart.id}`, {
                                text,
                                wordCount: text.trim().split(/\s+/).filter(Boolean).length,
                              });
                            }
                          }}
                          minWords={currentSectionPart?.minWords || 150}
                          placeholder="Start writing your response here..."
                        />
                      </div>
                    </div>
                  </div>


                </div>
              )}

              {/* Speaking Section */}
              {state.currentSectionType === 'speaking' && (
                <div className="h-full overflow-y-auto">
                  <div className="max-w-7xl mx-auto px-4 py-6">

                    <div className="max-w-2xl mx-auto space-y-6">
                      {currentSectionPart && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold mb-2">
                            Speaking Part {currentSectionPart.partNumber}
                          </h3>
                          {currentSectionPart.instructions && (
                            <p className="text-gray-500 text-sm mb-4">{currentSectionPart.instructions}</p>
                          )}

                          {currentSectionPart.speakingPrompts && (currentSectionPart.speakingPrompts as any[]).length > 0 ? (
                            <div className="bg-gray-50 rounded-lg p-6 mb-6 min-h-[150px] flex flex-col justify-center items-center text-center">
                              {/* Show only current prompt */}
                              {(() => {
                                const prompt = (currentSectionPart.speakingPrompts as any[])[currentPromptIndex];
                                return (
                                  <div key={currentPromptIndex} className="space-y-4">
                                    <p className="text-xl font-medium text-gray-900">{prompt?.text}</p>
                                    {prompt?.followUp && (
                                      <p className="text-gray-500 text-sm mt-2">Follow-up: {prompt.followUp}</p>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="mt-4 text-sm text-gray-400">
                                Question {currentPromptIndex + 1} of {(currentSectionPart.speakingPrompts as any[]).length}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-10 text-gray-500">
                              No prompts available for this part.
                            </div>
                          )}

                          {/* Prompt Navigation */}
                          {(currentSectionPart.speakingPrompts as any[])?.length > 1 && (
                            <div className="flex justify-between items-center mb-6">
                              <button
                                onClick={() => setCurrentPromptIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentPromptIndex === 0}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                              >
                                Previous Question
                              </button>
                              <button
                                onClick={() => setCurrentPromptIndex(prev => Math.min(((currentSectionPart.speakingPrompts as any[])?.length || 1) - 1, prev + 1))}
                                disabled={currentPromptIndex === ((currentSectionPart.speakingPrompts as any[])?.length || 1) - 1}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                              >
                                Next Question
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <AudioRecorder
                        // remount recorder when prompt changes to reset state
                        key={`${currentSectionPart?.id}-${currentPromptIndex}`}
                        onRecordingComplete={(url, duration) => {
                          if (currentSectionPart) {
                            // Get existing answer or init empty object
                            const existingAnswer = state.answers[`speaking_${currentSectionPart.id}`] || {};
                            const recordings = existingAnswer.recordings || {};

                            // Update specific recording for this prompt
                            const updatedRecordings = {
                              ...recordings,
                              [currentPromptIndex]: { url, duration }
                            };

                            handleAnswerChange(`speaking_${currentSectionPart.id}`, {
                              // Keep other properties if any, update recordings
                              ...existingAnswer,
                              recordings: updatedRecordings,
                            });
                          }
                        }}
                        // 120s (2 min) for Part 1/2, 180s (3 min) for Part 3
                        maxDuration={currentSectionPart?.partNumber === 3 ? 180 : 120}
                      />

                      {/* Show previous recording if exists */}
                      {currentSectionPart && state.answers[`speaking_${currentSectionPart.id}`]?.recordings?.[currentPromptIndex] && (
                        <div className="mt-2 text-center text-sm text-green-600 font-medium">
                          ✓ Recorded ({state.answers[`speaking_${currentSectionPart.id}`].recordings[currentPromptIndex].duration}s)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <TestFooter
        questions={questions}
        sections={currentSectionParts}
        currentQuestionIndex={currentQuestionIndex}
        answeredQuestions={state.answeredQuestions}
        flaggedQuestions={state.flaggedQuestions}
        onQuestionSelect={(index) => {
          selectQuestionIndex(index);

          // If this is a Reading/Listening section with multiple parts,
          // ensure we switch the activePartIndex if the question belongs to a different part
          const selectedQuestion = questions[index];
          if (selectedQuestion && currentSectionParts.length > 1) {
            const partIdx = currentSectionParts.findIndex(p => p.id === selectedQuestion.sectionId);
            if (partIdx !== -1 && partIdx !== activePartIndex) {
              setActivePartIndex(partIdx);
            }
          }
        }}
        onNext={handleNextQuestion}
        onPrevious={handlePreviousQuestion}
        isFirst={isPartBCMode ? true : currentQuestionIndex === 0}
        isLast={isPartBCMode ? false : (currentQuestionIndex === questions.length - 1 && mode !== 'full')}
        onToggleFlag={handleToggleFlag}
      />

      {/* Submit Confirmation Modal */}
      <SubmitConfirmation
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={submitType === 'section' ? handleSubmitSection : handleSubmitTest}
        type={submitType}
        unansweredCount={unansweredCount}
      />

      <CongratulationsModal
        isOpen={showCongratulationsModal}
        onClose={() => setShowCongratulationsModal(false)}
        onViewResults={handleViewResults}
        testTitle={testTitle}
        attemptId={attemptId}
      />
    </div>
  );
}

export default function TestTakingPage() {
  return (
    <TestSessionProvider>
      <TestTakingContent />
    </TestSessionProvider>
  );
}
