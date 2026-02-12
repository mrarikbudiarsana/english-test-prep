'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Section, Question, SectionType } from '@/types/test';
import { TestSessionProvider, useTestSession } from '@/contexts/TestSessionContext';
import { HiArrowLeft } from 'react-icons/hi';
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

const SECTION_ORDER: SectionType[] = ['listening', 'reading', 'writing', 'speaking'];

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

  const [testTitle, setTestTitle] = useState<string>('');

  // Load test title
  useEffect(() => {
    async function loadTestDetails() {
      try {
        const res = await api.get(`/tests/${testId}`);
        setTestTitle(res.data.title);
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
        const allSections: Section[] = sectionsRes.data;
        setSections(allSections);

        const sectionTypes = mode === 'section_practice' && practiceSection
          ? [practiceSection]
          : SECTION_ORDER;

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
          await loadSectionQuestions(firstSections, firstType, filteredSections);
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
    allSections: Section[]
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
    dispatch({
      type: 'SET_SECTION',
      payload: {
        sectionType,
        index: SECTION_ORDER.indexOf(sectionType),
        timeRemaining: totalDuration * 60,
      },
    });
    timer.start(totalDuration * 60);

    // Notify backend
    await api.put(`/attempts/${attemptId}/section-start`, { sectionType });
  }

  function advanceToNextSection() {
    if (mode === 'section_practice') {
      // Practice mode: go to results
      router.push(`/results/${attemptId}`);
      return;
    }

    const currentIdx = SECTION_ORDER.indexOf(state.currentSectionType!);
    if (currentIdx >= SECTION_ORDER.length - 1) {
      // Last section: submit test
      handleSubmitTest();
      return;
    }

    const nextType = SECTION_ORDER[currentIdx + 1];
    const nextSections = sections.filter(s => s.sectionType === nextType);
    if (nextSections.length > 0) {
      loadSectionQuestions(nextSections, nextType, sections);
    }
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, answer } });
  };

  const handleToggleFlag = (questionId: string) => {
    dispatch({ type: 'FLAG_QUESTION', payload: { questionId } });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (mode === 'full' && SECTION_ORDER.indexOf(state.currentSectionType!) < SECTION_ORDER.length - 1) {
      openSubmitModal('section');
    } else {
      openSubmitModal('test');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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

  // Reset activePartIndex when changing section type
  useEffect(() => {
    setActivePartIndex(0);
  }, [state.currentSectionType]);

  // Current active part based on tab selection
  const currentSectionPart = currentSectionParts[activePartIndex] || currentSectionParts[0];

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
        // Sum points instead of just counting questions
        offset += questions.filter(q => q.sectionId === partId).reduce((sum, q) => sum + (q.points || 1), 0);
      }
    }
    return offset;
  }, [questions, currentSectionParts, activePartIndex]);

  const unansweredCount = questions.filter(q => !state.answeredQuestions.has(q.id)).length;

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
              sections={SECTION_ORDER}
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
              onClick={() => openSubmitModal(
                mode === 'full' && SECTION_ORDER.indexOf(state.currentSectionType!) < SECTION_ORDER.length - 1
                  ? 'section'
                  : 'test'
              )}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              {mode === 'full' && SECTION_ORDER.indexOf(state.currentSectionType!) < SECTION_ORDER.length - 1
                ? 'Next Section'
                : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Body */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full">
          {/* Listening Section */}
          {state.currentSectionType === 'listening' && (
            <div className="h-full overflow-y-auto">
              {/* Keep listening section constrained or make full width? Usually listening is centered content. Let's keep max-w-7xl for listening/writing/speaking unless requested otherwise. Reading needs full width. */}
              <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {currentSectionPart?.audioUrl && (
                  <AudioPlayer
                    src={currentSectionPart.audioUrl}
                    playOnce={true}
                  />
                )}
                {currentSectionPart?.instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
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
                    <>
                      {/* Render grouped questions */}
                      {Object.entries(grouped).map(([groupLabel, groupQuestions]) => {
                        const firstQuestion = groupQuestions[0];
                        return (
                          <div key={groupLabel} className="bg-white">
                            <GroupInstruction
                              groupLabel={groupLabel}
                              groupInstructions={firstQuestion.groupInstructions}
                              variant="compact"
                            />

                            {/* Render all questions in this group */}
                            <div className="space-y-4">
                              {groupQuestions.map((question, qIdx) => (
                                <div key={question.id} className="pl-0">
                                  <QuestionRenderer
                                    question={question}
                                    answer={state.answers[question.id]}
                                    onAnswerChange={handleAnswerChange}
                                    displayNumber={partNumberOffset + activePartQuestions.indexOf(question) + 1}
                                    isActive={questions.indexOf(question) === currentQuestionIndex}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Render ungrouped questions */}
                      {ungrouped.map(question => {
                        const displayNum = partNumberOffset + activePartQuestions.indexOf(question) + 1;
                        return (
                          <div key={question.id} className="bg-white p-6 border-b border-gray-200 last:border-0">
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
                    </>
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
                  className="h-full bg-white grow min-w-0" // min-w-0 used to allow flex child to shrink below content size
                >
                  <div className="h-full overflow-y-auto px-8 py-6 space-y-8">


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
                                        const displayNum = partNumberOffset + activePartQuestions.indexOf(question) + 1;
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
                                                      className="h-8 w-32 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 font-medium text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    {groupQuestions.map((question, qIdx) => {
                                      const isNoteStyle = question.questionType === 'completion' && (question.questionData as any).style !== 'standard';

                                      // Calculate display number (range if > 1 point)
                                      const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                      const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + (q.points || 1), 0) + 1;
                                      const points = question.points || 1;
                                      const displayNum = points > 1 ? `${startNum}-${startNum + points - 1}` : startNum;

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

                                            // Calculate start number based on points of previous questions in this part
                                            const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                            const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + (q.points || 1), 0) + 1;
                                            const points = question.points || 1;
                                            const displayNum = points > 1 ? `${startNum}-${startNum + points - 1}` : startNum;

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
                                                          className="h-8 w-32 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 font-medium text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                                    // Calculate display number (range if > 1 point)
                                    const previousQuestions = activePartQuestions.slice(0, activePartQuestions.indexOf(question));
                                    const startNum = partNumberOffset + previousQuestions.reduce((sum, q) => sum + (q.points || 1), 0) + 1;
                                    const points = question.points || 1;
                                    const displayNum = points > 1 ? `${startNum}-${startNum + points - 1}` : startNum;

                                    return (
                                      <div
                                        key={question.id}
                                        className={cn(
                                          "transition-colors duration-300",
                                          isNoteStyle ? "" : "-mx-4 px-4" // Removed border/bg styles for active state
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
                        <div className="prose prose-sm">
                          {currentSectionPart.taskDescription}
                        </div>
                        <p className="mt-3 text-sm text-gray-500">
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

              {/* Writing task navigation (Task 1 / Task 2) */}
              {currentSectionParts.length > 1 && (
                <div className="mt-8 flex justify-center space-x-4">
                  {currentSectionParts.map((part, idx) => (
                    <button
                      key={part.id}
                      onClick={() => {
                        // Switch to the other task's section part
                        const newQuestions = questions; // already loaded
                        setCurrentQuestionIndex(idx);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentSectionPart?.id === part.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      Task {part.taskNumber}
                    </button>
                  ))}
                </div>
              )}
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
                      {currentSectionPart.speakingPrompts && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          {(currentSectionPart.speakingPrompts as any[]).map((prompt: any, idx: number) => (
                            <div key={idx} className="mb-2 last:mb-0">
                              <p className="text-gray-900">{prompt.text}</p>
                              {prompt.followUp && (
                                <p className="text-gray-500 text-sm mt-1">Follow-up: {prompt.followUp}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <AudioRecorder
                    onRecordingComplete={(url, duration) => {
                      if (currentSectionPart) {
                        handleAnswerChange(`speaking_${currentSectionPart.id}`, {
                          audioUrl: url,
                          duration,
                        });
                      }
                    }}
                    maxDuration={currentSectionPart?.responseTime || 120}
                  />
                </div>
              </div>
            </div>
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
          setCurrentQuestionIndex(index);

          // If this is a Reading/Listening section with multiple parts,
          // ensure we switch the activePartIndex if the question belongs to a different part
          const selectedQuestion = questions[index];
          if (selectedQuestion && currentSectionParts.length > 1) {
            const partIdx = currentSectionParts.findIndex(p => p.id === selectedQuestion.sectionId);
            if (partIdx !== -1 && partIdx !== activePartIndex) {
              setActivePartIndex(partIdx);
            }
          }

          // Scroll and focus
          setTimeout(() => {
            const element = document.getElementById(`question-${index}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });

              // Find and focus the input element if it exists (for completion questions)
              const input = element.querySelector('input');
              if (input) {
                input.focus({ preventScroll: true }); // Prevent jumping, let scrollIntoView handle it
              }
            }
          }, 0);
        }}
        onNext={handleNextQuestion}
        onPrevious={handlePreviousQuestion}
        isFirst={currentQuestionIndex === 0}
        isLast={currentQuestionIndex === questions.length - 1 && mode !== 'full'} // Logic can be improved for full test sequence
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
