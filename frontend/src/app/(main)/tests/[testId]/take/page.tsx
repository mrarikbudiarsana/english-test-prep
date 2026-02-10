'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Section, Question, SectionType } from '@/types/test';
import { TestSessionProvider, useTestSession } from '@/contexts/TestSessionContext';
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
import { useTimer } from '@/hooks/useTimer';
import { sectionTypeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';
import { EnterFullScreenIcon, ExitFullScreenIcon } from '@radix-ui/react-icons';

const SECTION_ORDER: SectionType[] = ['listening', 'reading', 'writing', 'speaking'];

const renderFormattedText = (text: string) => {
  if (!text) return null;
  // Split by bold markers (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

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
  const [submitType, setSubmitType] = useState<'section' | 'test'>('section');

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
    router.push(`/results/${attemptId}`);
  };

  const openSubmitModal = (type: 'section' | 'test') => {
    setSubmitType(type);
    setShowSubmitModal(true);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentSectionParts = sections.filter(s => s.sectionType === state.currentSectionType);

  // Find which section part the current question belongs to
  const currentSectionPart = currentQuestion
    ? currentSectionParts.find(s => s.id === currentQuestion.sectionId)
    : currentSectionParts[0];

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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Test Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SectionProgress
              sections={SECTION_ORDER}
              currentSection={state.currentSectionType || 'listening'}
              completedSections={state.completedSections}
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFocusMode}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isFocusMode ? <ExitFullScreenIcon className="w-5 h-5" /> : <EnterFullScreenIcon className="w-5 h-5" />}
            </button>

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

                  questions.forEach(q => {
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
                          <div key={groupLabel} className="bg-white rounded-lg border-2 border-gray-300 p-6">
                            {/* Group header - IELTS style */}
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-gray-900 mb-2">
                                {groupLabel}
                              </h3>
                              {firstQuestion.groupInstructions && (
                                <p className="text-base text-gray-700 mb-2">
                                  {renderFormattedText(firstQuestion.groupInstructions)}
                                </p>
                              )}
                            </div>

                            {/* Render all questions in this group - simple list style */}
                            <div className="space-y-4">
                              {groupQuestions.map(question => (
                                <div key={question.id} className="pl-0">
                                  <QuestionRenderer
                                    question={question}
                                    answer={state.answers[question.id]}
                                    onAnswerChange={handleAnswerChange}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Render ungrouped questions */}
                      {ungrouped.map(question => (
                        <div key={question.id} className="bg-white rounded-xl border border-gray-200 p-6">
                          <QuestionRenderer
                            question={question}
                            answer={state.answers[question.id]}
                            onAnswerChange={handleAnswerChange}
                          />
                        </div>
                      ))}
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
                  className="h-full border-r border-gray-200 bg-white"
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
                  className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize hover:w-1.5 transition-all z-10 flex items-center justify-center shrink-0 active:bg-blue-600"
                  onMouseDown={startResizing}
                >
                  <div className="h-8 w-0.5 bg-gray-400 rounded-full" />
                </div>

                {/* Right Pane: Questions */}
                <div
                  className="h-full bg-white flex-1"
                  style={{ width: `${100 - leftPaneWidth}%` }}
                >
                  <div className="h-full overflow-y-auto px-8 py-6 space-y-8">


                    {/* Group questions by groupLabel */}
                    {(() => {
                      const grouped: { [key: string]: Question[] } = {};
                      const ungrouped: Question[] = [];

                      questions.forEach(q => {
                        if (q.groupLabel) {
                          if (!grouped[q.groupLabel]) {
                            grouped[q.groupLabel] = [];
                          }
                          grouped[q.groupLabel].push(q);
                        } else {
                          ungrouped.push(q);
                        }
                      });

                      // DEBUG: remove after testing
                      console.log('GROUPED:', Object.keys(grouped), 'UNGROUPED:', ungrouped.length);
                      ungrouped.forEach(q => {
                        const qd = q.questionData as any;
                        console.log(`Q${q.questionNumber}: type=${q.questionType}, title="${qd.title}", style="${qd.style}", ctx="${(qd.context || '').substring(0, 40)}"`);
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
                              // Checks for standard bullet, en-dash, em-dash, bullet point char, asterisk
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
                                <div className={cn(
                                  "mb-2",
                                  isNoteStyle ? "pl-2" : "bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6"
                                )}>
                                  <h3 className={cn(
                                    "font-bold text-gray-900 mb-1",
                                    isNoteStyle ? "text-xl" : "text-base"
                                  )}>
                                    {groupLabel}
                                  </h3>
                                  {firstQuestion.groupInstructions && (
                                    <p className="text-base text-gray-700 mb-2">
                                      {renderFormattedText(firstQuestion.groupInstructions)}
                                    </p>
                                  )}
                                </div>

                                {/* Summary flow: render ALL questions as inline text in ONE paragraph */}
                                {isSummaryFlow ? (
                                  <div className="pl-6">
                                    {/* Render Title if it exists (e.g. from the first question) */}
                                    {(groupQuestions[0].questionData as any).title && (
                                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                                        {(groupQuestions[0].questionData as any).title}
                                      </h4>
                                    )}
                                    <div className="text-base text-gray-900 leading-relaxed">
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
                                                      className="w-32 border border-gray-300 px-2 py-1 text-sm rounded bg-white text-center font-medium transition-all focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-gray-300"
                                                    />
                                                    {!state.answers[question.id] && (
                                                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                                                        {question.questionNumber}
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
                                    {groupQuestions.map((question, qIdx) => (
                                      <div
                                        key={question.id}
                                        className={cn(
                                          "transition-colors duration-300",
                                          questions.indexOf(question) === currentQuestionIndex
                                            ? (isNoteStyle ? "" : "bg-blue-50/50 -mx-4 px-4 rounded-lg border-l-4 border-blue-500")
                                            : (isNoteStyle ? "" : "border-l-4 border-transparent -mx-4 px-4")
                                        )}
                                        id={`question-${questions.indexOf(question)}`}
                                      >
                                        <QuestionRenderer
                                          question={question}
                                          answer={state.answers[question.id]}
                                          onAnswerChange={handleAnswerChange}
                                        />
                                      </div>
                                    ))}
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
                                        <div className="text-base text-gray-900 leading-relaxed">
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
                                                          className="w-32 border border-gray-300 px-2 py-1 text-sm rounded bg-white text-center font-medium transition-all focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-gray-300"
                                                        />
                                                        {!state.answers[question.id] && (
                                                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                                                            {question.questionNumber}
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
                                    return (
                                      <div
                                        key={question.id}
                                        className={cn(
                                          "transition-colors duration-300",
                                          questions.indexOf(question) === currentQuestionIndex
                                            ? (isNoteStyle ? "" : "bg-blue-50/50 -mx-4 px-4 rounded-lg border-l-4 border-blue-500")
                                            : (isNoteStyle ? "" : "border-l-4 border-transparent -mx-4 px-4")
                                        )}
                                        id={`question-${questions.indexOf(question)}`}
                                      >
                                        <QuestionRenderer
                                          question={question}
                                          answer={state.answers[question.id]}
                                          onAnswerChange={handleAnswerChange}
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
        currentQuestionIndex={currentQuestionIndex}
        answeredQuestions={state.answeredQuestions}
        flaggedQuestions={state.flaggedQuestions}
        onQuestionSelect={(index) => {
          setCurrentQuestionIndex(index);
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
