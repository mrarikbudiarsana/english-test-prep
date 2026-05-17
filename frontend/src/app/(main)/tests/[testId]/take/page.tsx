'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Section, Question, SectionType, MCQData } from '@/types/test';
import { TestSessionProvider, useTestSession } from '@/contexts/TestSessionContext';
import { HiBookOpen, HiVolumeUp } from 'react-icons/hi';
import TestTimer from '@/components/test/TestTimer';
import QuestionRenderer from '@/components/test/QuestionRenderer';
import AudioPlayer from '@/components/test/AudioPlayer';
import ReadingPassage from '@/components/test/ReadingPassage';
import SubmitConfirmation from '@/components/test/SubmitConfirmation';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';
import QuestionNavigator from '@/components/test/QuestionNavigator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye } from 'lucide-react';
import Link from 'next/link';

const SECTION_ORDER: SectionType[] = ['listening', 'structure', 'reading'];

const TOEFL_SECTION_THEME: Record<'listening' | 'structure' | 'reading', {
  label: string;
  icon: typeof HiBookOpen;
  tint: string;
  iconColor: string;
  badgeColor: string;
}> = {
  listening: {
    label: 'Listening Comprehension',
    icon: HiVolumeUp,
    tint: 'bg-[#e8f4fd]',
    iconColor: 'text-[#08507f]',
    badgeColor: 'bg-[#e8f4fd] text-[#08507f] border-[#08507f]/20',
  },
  structure: {
    label: 'Structure & Written Expression',
    icon: HiBookOpen,
    tint: 'bg-[#e8f4fd]',
    iconColor: 'text-[#08507f]',
    badgeColor: 'bg-[#e8f4fd] text-[#08507f] border-[#08507f]/20',
  },
  reading: {
    label: 'Reading Comprehension',
    icon: HiBookOpen,
    tint: 'bg-[#e8f4fd]',
    iconColor: 'text-[#08507f]',
    badgeColor: 'bg-[#e8f4fd] text-[#08507f] border-[#08507f]/20',
  },
};

/**
 * Isolated Volume Control component to ensure smooth sliding
 * without re-rendering the entire test taking page on every increment.
 */
function VolumeControl({ volume, onChange }: { volume: number, onChange: (v: number) => void }) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const currentVal = React.useRef(volume);

  const applyVisual = (val: number) => {
    const pct = val * 100;
    if (trackRef.current) trackRef.current.style.width = `${pct}%`;
    if (thumbRef.current) thumbRef.current.style.left = `calc(${pct}% - 7px)`;
    if (labelRef.current) labelRef.current.textContent = `${Math.round(pct)}%`;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    currentVal.current = val;
    applyVisual(val);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { onChange(val); });
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Volume</span>
      <div className="relative w-32 h-1.5 bg-slate-100 rounded-full cursor-pointer">
        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          defaultValue={volume}
          onChange={handleInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div ref={trackRef} className="absolute left-0 top-0 h-full bg-[#08507f] rounded-full" style={{ width: `${volume * 100}%` }} />
        <div ref={thumbRef} className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 bg-white border-2 border-[#08507f] rounded-full shadow-md z-0" style={{ left: `calc(${volume * 100}% - 7px)` }} />
      </div>
      <span ref={labelRef} className="text-xs font-semibold text-slate-500 min-w-[2.5rem]">{Math.round(volume * 100)}%</span>
    </div>
  );
}

/**
 * Calculate effective points for a question based on its type.
 */
function getEffectivePoints(q: Question): number {
  if (q.questionType === 'multiple_choice') {
    const mcqData = q.questionData as MCQData;
    if (mcqData.multiSelect) {
      return mcqData.expectedAnswers || 2;
    }
  }
  return q.points || 1;
}


function TestTakingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { state, dispatch, submitSection, submitTest } = useTestSession();

  const testId = params.testId as string;
  const attemptIdParam = searchParams.get('attemptId');
  const attemptId = attemptIdParam && attemptIdParam !== 'undefined' ? attemptIdParam : '';
  const mode = searchParams.get('mode') || 'full';
  const practiceSection = searchParams.get('section') as SectionType | null;
  const isPreview = searchParams.get('preview') === 'true';

  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);

  const [submitType, setSubmitType] = useState<'section' | 'test'>('section');
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [viewingDirections, setViewingDirections] = useState(false);
  const [isDirectionsTransitioning, setIsDirectionsTransitioning] = useState(false);
  const directionsTransitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [testTitle, setTestTitle] = useState<string>('');
  const [thinkingTimeLeft, setThinkingTimeLeft] = useState<number | null>(null);
  const [globalVolume, setGlobalVolume] = useState<number>(1);
  const [isToeflReadingProgressOpen, setIsToeflReadingProgressOpen] = useState(false);
  const [toeflReadingMobileView, setToeflReadingMobileView] = useState<'passage' | 'question'>('question');

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

  // Prevent accidental quits via browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Block browser back button
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      // Optional: show a small toast or alert
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleTimeUp = async () => {
    if (state.currentSectionType) {
      await submitSection(state.currentSectionType);
      advanceToNextSection();
    }
  };

  const timer = useTimer({ onTimeUp: handleTimeUp });

  const loadSectionQuestions = useCallback(async (
    sectionParts: Section[],
    sectionType: SectionType,
    allSections: Section[],
    overrideTimeRemaining?: number
  ) => {
    // Fetch all section parts in parallel instead of sequentially
    const results = await Promise.all(
      sectionParts.map(section => api.get(`/tests/${testId}/sections/${section.id}/questions`))
    );

    const allQuestions: Question[] = [];
    results.forEach((res, i) => {
      allQuestions.push(...res.data);
      dispatch({ type: 'SET_QUESTIONS', payload: { sectionId: sectionParts[i].id, questions: res.data } });
    });

    setQuestions(allQuestions);
    setCurrentQuestionIndex(0);

    const totalDuration = sectionParts.reduce((sum, s) => sum + s.durationMinutes, 0);
    const finalTimeRemaining = overrideTimeRemaining !== undefined
      ? overrideTimeRemaining
      : totalDuration * 60;

    dispatch({
      type: 'SET_SECTION',
      payload: {
        sectionType,
        index: SECTION_ORDER.indexOf(sectionType),
        timeRemaining: finalTimeRemaining,
      },
    });
    timer.start(finalTimeRemaining);

    const resolvedAttemptId = state.attemptId || attemptId;
    if (resolvedAttemptId && overrideTimeRemaining === undefined) {
      api.put(`/attempts/${resolvedAttemptId}/section-start`, { sectionType }).catch(console.error);
    }

    setViewingDirections(true);
  }, [testId, dispatch, state.attemptId, attemptId, timer]);

  const advanceToNextSection = useCallback(() => {
    const resolvedAttemptId = state.attemptId || attemptId;

    if (mode === 'section_practice') {
      if (resolvedAttemptId) {
        router.push(`/results/${resolvedAttemptId}?completed=true`);
      }
      return;
    }

    const currentIdx = SECTION_ORDER.indexOf(state.currentSectionType!);
    if (currentIdx >= SECTION_ORDER.length - 1) {
      handleSubmitTest();
      return;
    }

    const nextType = SECTION_ORDER[currentIdx + 1];
    const nextSections = sections.filter(s => s.sectionType === nextType);
    if (nextSections.length > 0) {
      loadSectionQuestions(nextSections, nextType, sections);
    }
  }, [state.currentSectionType, state.attemptId, attemptId, mode, router, sections, loadSectionQuestions]);

  // Load test sections and initialize session
  useEffect(() => {
    async function init() {
      try {
        const [sectionsRes, attemptRes, responsesRes] = await Promise.all([
          api.get(`/tests/${testId}/sections`),
          attemptId ? api.get(`/attempts/${attemptId}`).catch(err => {
            console.error('Failed to load attempt:', err);
            return null;
          }) : Promise.resolve(null),
          attemptId ? api.get(`/attempts/${attemptId}/responses`).catch(err => {
            console.error('Failed to load saved responses:', err);
            return null;
          }) : Promise.resolve(null),
        ]);

        const allSections: Section[] = sectionsRes.data;
        setSections(allSections);

        const sectionTypes = mode === 'section_practice' && practiceSection
          ? [practiceSection]
          : SECTION_ORDER;

        const filteredSections = allSections.filter(s =>
          sectionTypes.includes(s.sectionType)
        );

        let attemptData: any = null;
        if (attemptRes) {
          attemptData = attemptRes.data?.data || attemptRes.data;
        }

        let startType = sectionTypes[0];
        if (
          mode === 'full' &&
          attemptData?.currentSection &&
          sectionTypes.includes(attemptData.currentSection)
        ) {
          startType = attemptData.currentSection;
        }

        let savedAnswers: Record<string, any> = {};
        if (responsesRes) {
          const responsesData = responsesRes.data?.data || responsesRes.data || [];
          responsesData.forEach((r: any) => {
            if (r.questionId) {
              savedAnswers[r.questionId] = r.answerData;
            }
          });
        }

        let overrideTime: number | undefined = undefined;
        if (attemptData?.sectionStartedAt && startType === attemptData.currentSection) {
          const startingSections = filteredSections.filter(s => s.sectionType === startType);
          const totalDuration = startingSections.reduce((sum, s) => sum + s.durationMinutes, 0);
          const elapsedSeconds = Math.floor(
            (Date.now() - new Date(attemptData.sectionStartedAt).getTime()) / 1000
          );
          overrideTime = Math.max(0, totalDuration * 60 - elapsedSeconds);
        }

        dispatch({
          type: 'INIT_SESSION',
          payload: {
            attemptId,
            testId,
            mode: mode as 'full' | 'section_practice',
            sections: filteredSections,
          },
        });

        if (Object.keys(savedAnswers).length > 0) {
          dispatch({ type: 'LOAD_SAVED_ANSWERS', payload: savedAnswers });
        }

        const firstSections = filteredSections.filter(s => s.sectionType === startType);
        if (firstSections.length > 0) {
          await loadSectionQuestions(firstSections, startType, filteredSections, overrideTime);
        }
      } catch (err) {
        console.error('Failed to initialize test:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, attemptId, mode, practiceSection]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, answer } });

    if (isPartBCMode) {
      const answeredQuestionIndex = questions.findIndex(q => q.id === questionId);
      if (answeredQuestionIndex !== -1 && answeredQuestionIndex !== currentQuestionIndex) {
        selectQuestionIndex(answeredQuestionIndex);
      }
    }
  };

  const handleToggleFlag = (questionId: string) => {
    dispatch({ type: 'FLAG_QUESTION', payload: { questionId } });
  };

  const focusQuestionAtIndex = useCallback((index: number) => {
    setTimeout(() => {
      const element = document.getElementById(`question-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  }, []);

  const selectQuestionIndex = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    focusQuestionAtIndex(index);
  }, [focusQuestionAtIndex]);


  const exitDirectionsView = useCallback(() => {
    if (!viewingDirections) return;
    if (isDirectionsTransitioning) return;

    setIsDirectionsTransitioning(true);
    directionsTransitionTimeoutRef.current = setTimeout(() => {
      setViewingDirections(false);
      setIsDirectionsTransitioning(false);
    }, 220);
  }, [isDirectionsTransitioning, viewingDirections]);

  const currentSectionParts = useMemo(
    () => sections.filter(s => s.sectionType === state.currentSectionType),
    [sections, state.currentSectionType]
  );

  const resolvedPartNumbers = useMemo(() => {
    const resolved: number[] = [];
    for (let idx = 0; idx < currentSectionParts.length; idx++) {
      const part = currentSectionParts[idx];
      const source = `${part?.title || ''} ${part?.instructions || ''}`.toLowerCase();
      if (state.currentSectionType === 'listening') {
        if (/\bpart\s*a\b/.test(source)) { resolved.push(1); continue; }
        if (/\bpart\s*b\b/.test(source)) { resolved.push(2); continue; }
        if (/\bpart\s*c\b/.test(source)) { resolved.push(3); continue; }
        if (idx > 0) {
          const prevResolved = resolved[idx - 1];
          const rawPart = part?.partNumber;
          if (rawPart == null || rawPart >= prevResolved) { resolved.push(prevResolved); continue; }
        }
      }
      resolved.push(part?.partNumber != null ? part.partNumber : idx + 1);
    }
    return resolved;
  }, [currentSectionParts, state.currentSectionType]);

  const getResolvedPartNumber = useCallback((index: number) => resolvedPartNumbers[index] ?? index + 1, [resolvedPartNumbers]);

  const handleToeflNavigation = useCallback((dir: 'next' | 'prev') => {
    const currentSectionPart = currentSectionParts[activePartIndex];
    if (!currentSectionPart) return;

    if (dir === 'next') {
      if (viewingDirections) {
        exitDirectionsView();
        return;
      }

      if (state.currentSectionType === 'listening' && getResolvedPartNumber(activePartIndex) >= 2) {
        if (activePartIndex < currentSectionParts.length - 1) {
          const nextPartIdx = activePartIndex + 1;
          const nextPart = currentSectionParts[nextPartIdx];
          const firstQOfNextPart = questions.find(q => q.sectionId === nextPart.id);
          if (firstQOfNextPart) {
            setActivePartIndex(nextPartIdx);
            selectQuestionIndex(questions.indexOf(firstQOfNextPart));
            setViewingDirections(getResolvedPartNumber(activePartIndex) !== getResolvedPartNumber(nextPartIdx));
          }
        } else {
          // In Listening, when you reach the end, you finish the section (no review)
          openSubmitModal(mode === 'full' && SECTION_ORDER.indexOf(state.currentSectionType!) < SECTION_ORDER.length - 1 ? 'section' : 'test');
        }
        return;
      }

      const currentPartQuestions = questions.filter(q => q.sectionId === currentSectionPart.id);
      const isLastOfPart = questions.indexOf(currentPartQuestions[currentPartQuestions.length - 1]) === currentQuestionIndex;

      if (isLastOfPart) {
        if (activePartIndex < currentSectionParts.length - 1) {
          const nextPartIdx = activePartIndex + 1;
          const nextPart = currentSectionParts[nextPartIdx];
          const firstQOfNextPart = questions.find(q => q.sectionId === nextPart.id);
          if (firstQOfNextPart) {
            setActivePartIndex(nextPartIdx);
            setCurrentQuestionIndex(questions.indexOf(firstQOfNextPart));
            // Reading passages are silent transitions — directions only show once at section start
            if (state.currentSectionType !== 'reading') {
              setViewingDirections(getResolvedPartNumber(activePartIndex) !== getResolvedPartNumber(nextPartIdx));
            }
          }
        } else {
          // Finish section directly when reaching the end of Listening or Structure
          openSubmitModal(mode === 'full' && SECTION_ORDER.indexOf(state.currentSectionType!) < SECTION_ORDER.length - 1 ? 'section' : 'test');
        }
      } else {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }
    } else {
      if (state.currentSectionType === 'listening') return;

      if (viewingDirections) {
        if (activePartIndex > 0) {
          const prevPartIdx = activePartIndex - 1;
          const prevPart = currentSectionParts[prevPartIdx];
          const lastQOfPrevPart = questions.filter(q => q.sectionId === prevPart.id).pop();
          if (lastQOfPrevPart) {
            setActivePartIndex(prevPartIdx);
            setCurrentQuestionIndex(questions.indexOf(lastQOfPrevPart));
            exitDirectionsView();
          }
        }
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
  }, [activePartIndex, currentQuestionIndex, currentSectionParts, exitDirectionsView, getResolvedPartNumber, mode, questions, selectQuestionIndex, state.currentSectionType, viewingDirections]);

  const handleNextQuestion = () => {
    // Clear any active thinking time countdown if user manually advances
    setThinkingTimeLeft(null);

    if (state.currentSectionType === 'listening') {
      handleToeflNavigation('next');
      return;
    }
    if (state.currentSectionType === 'structure') {
      handleToeflNavigation('next');
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      selectQuestionIndex(currentQuestionIndex + 1);
    } else if (mode === 'full' && SECTION_ORDER.indexOf(state.currentSectionType!) < SECTION_ORDER.length - 1) {
      openSubmitModal('section');
    } else {
      openSubmitModal('test');
    }
  };

  const handleAudioEnd = () => {
    if (state.currentSectionType === 'listening') {
      const sectionThinkingTime = currentSectionPart?.audioThinkingTime ?? 0;
      if (sectionThinkingTime > 0) {
        setThinkingTimeLeft(sectionThinkingTime);
      } else {
        handleNextQuestion();
      }
    }
  };

  // Countdown effect for Audio Thinking Time
  useEffect(() => {
    if (thinkingTimeLeft === null) return;
    
    if (thinkingTimeLeft <= 0) {
      setThinkingTimeLeft(null);
      handleNextQuestion();
      return;
    }

    const timer = setTimeout(() => {
      setThinkingTimeLeft(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [thinkingTimeLeft]);

  const handlePreviousQuestion = () => {
    if (state.currentSectionType === 'listening') {
      handleToeflNavigation('prev');
      return;
    }
    if (state.currentSectionType === 'structure') {
      handleToeflNavigation('prev');
      return;
    }
    if (currentQuestionIndex > 0) {
      selectQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitSection = async () => {
    if (state.currentSectionType) {
      if (state.currentSectionType === 'listening') {
        // No review for listening, proceed to submission directly
        timer.stop();
        try {
          setError(null);
          await submitSection(state.currentSectionType);
          setShowSubmitModal(false);
          advanceToNextSection();
        } catch {
          setError(t('test_submit_error'));
          setShowSubmitModal(false);
          timer.start(timer.timeRemaining);
        }
        return;
      }
      timer.stop();
      try {
        setError(null);
        await submitSection(state.currentSectionType);
        setShowSubmitModal(false);
        advanceToNextSection();
      } catch {
        setError(t('test_submit_error'));
        setShowSubmitModal(false);
        timer.start(timer.timeRemaining); // Resume timer on failure
      }
    }
  };

  const handleSubmitTest = async () => {
    timer.stop();
    try {
      setError(null);
      await submitTest();
      setShowSubmitModal(false);
      const resolvedAttemptId = state.attemptId || attemptId;
      if (resolvedAttemptId) {
        router.push(`/results/${resolvedAttemptId}?completed=true`);
      } else {
        router.push('/results');
      }
    } catch {
      setError(t('test_submit_error'));
      setShowSubmitModal(false);
      timer.start(timer.timeRemaining); // Resume timer on failure
    }
  };

  const openSubmitModal = (type: 'section' | 'test') => {
    setSubmitType(type);
    setShowSubmitModal(true);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isToeflLockedSection = state.currentSectionType === 'listening';
  const currentSectionIndex = state.currentSectionType ? SECTION_ORDER.indexOf(state.currentSectionType) : -1;
  const upcomingSectionType = currentSectionIndex >= 0 && currentSectionIndex < SECTION_ORDER.length - 1 ? SECTION_ORDER[currentSectionIndex + 1] : null;
  const toeflHasUnanswered = questions.some(q => !state.answeredQuestions.has(q.id));
  
  // Standardized Labels
  const topActionLabel = mode === 'full' && upcomingSectionType ? t('test_next_section') : t('test_finish');
  const isPartBCModeTop = state.currentSectionType === 'listening' && getResolvedPartNumber(activePartIndex) >= 2;
  const navigatorActionLabel = isPartBCModeTop && activePartIndex === currentSectionParts.length - 1
    ? topActionLabel
    : currentQuestionIndex < questions.length - 1 ? t('test_next') : topActionLabel;
  

  useEffect(() => {
    setActivePartIndex(0);
    setIsToeflReadingProgressOpen(false);
    setToeflReadingMobileView('question');
  }, [state.currentSectionType]);

  useEffect(() => {
    if (currentQuestion && currentSectionParts.length > 0) {
      const partIndex = currentSectionParts.findIndex(p => p.id === currentQuestion.sectionId);
      if (partIndex !== -1) setActivePartIndex(partIndex);
    }
  }, [currentQuestion, currentSectionParts]);

  const activePartQuestions = useMemo(() => {
    if (!currentSectionParts[activePartIndex]) return questions;
    return questions.filter(q => q.sectionId === currentSectionParts[activePartIndex].id);
  }, [questions, currentSectionParts, activePartIndex]);

  const partNumberOffset = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < activePartIndex; i++) {
      const partId = currentSectionParts[i]?.id;
      if (partId) offset += questions.filter(q => q.sectionId === partId).reduce((sum, q) => sum + getEffectivePoints(q), 0);
    }
    return offset;
  }, [questions, currentSectionParts, activePartIndex]);

  const unansweredCount = useCallback(() => questions.filter(q => !state.answeredQuestions.has(q.id)).length, [questions, state.answeredQuestions]);
  const answeredCount = useMemo(() => questions.filter((q) => Boolean(state.answers[q.id])).length, [questions, state.answers]);

  const getToeflPartLabel = useCallback((sectionType: SectionType | null | undefined, partIndex: number): string => {
    const resolved = getResolvedPartNumber(partIndex);
    if (sectionType === 'listening') {
      if (resolved === 1) return 'Part A — Short Conversations';
      if (resolved === 2) return 'Part B — Longer Conversations';
      if (resolved === 3) return 'Part C — Talks/Lectures';
    }
    if (sectionType === 'structure') {
      if (resolved === 1) return 'Part 1 — Structure';
      if (resolved === 2) return 'Part 2 — Written Expression';
    }
    return `Part ${resolved}`;
  }, [getResolvedPartNumber]);

  const isPartBCMode = state.currentSectionType === 'listening' && getResolvedPartNumber(activePartIndex) >= 2;

  const toeflSectionTheme = useMemo(() => {
    if (state.currentSectionType === 'listening' || state.currentSectionType === 'structure' || state.currentSectionType === 'reading') {
      return TOEFL_SECTION_THEME[state.currentSectionType];
    }
    return TOEFL_SECTION_THEME.listening;
  }, [state.currentSectionType]);

  const toeflPhaseLabel = useMemo(() => {
    if (!state.currentSectionType) return null;
    if (viewingDirections) return 'Directions';
    return 'Active Section';
  }, [state.currentSectionType, viewingDirections]);

  const currentPartLabel = useMemo(() => getToeflPartLabel(state.currentSectionType, activePartIndex), [getToeflPartLabel, state.currentSectionType, activePartIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#08507f] mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">{t('test_preparing')}</p>
        </div>
      </div>
    );
  }

  const ToeflSectionIcon = toeflSectionTheme.icon;
  const currentSectionPart = currentSectionParts[activePartIndex];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-slate-800">
      {isPreview && (
        <div className="shrink-0 bg-orange-600 text-white px-6 py-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-4 z-[60]">
          <Eye className="w-4 h-4" />
          <span>Preview Mode — Your results will not be saved or affect any analytics.</span>
          <Link href={testId ? `/admin/tests/${testId}` : '/admin/tests'} className="underline hover:text-white/80 ml-4">
            Exit Preview
          </Link>
        </div>
      )}
      {/* Redesigned Premium Header */}
      <header className="shrink-0 z-50 bg-white border-b border-slate-100 px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#08507f] leading-tight">
              {toeflSectionTheme.label}
            </h2>
             <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('test_participant')}</span>
                <span className="text-xs font-semibold text-slate-600">{user?.displayName || 'Student'}</span>
                <span className="mx-1 text-slate-300">|</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{testTitle}</span>
             </div>
          </div>

          <div className="flex items-center gap-10">
            {/* Volume Control — only visible during Listening */}
            {state.currentSectionType === 'listening' && (
              <VolumeControl volume={globalVolume} onChange={setGlobalVolume} />
            )}

            {/* Timer */}
            <div className={`text-2xl font-mono font-bold tabular-nums transition-colors ${timer.timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
              <TestTimer timeRemaining={timer.timeRemaining} isRunning={timer.isRunning} />
            </div>

            {/* Finish Test Button */}
            <button
              onClick={() => openSubmitModal(mode === 'full' && currentSectionIndex < SECTION_ORDER.length - 1 ? 'section' : 'test')}
              className="px-6 py-2.5 bg-[#22c55e] text-white text-sm font-bold uppercase tracking-wider rounded-md hover:bg-[#16a34a] hover:shadow-lg transition-all active:scale-95"
            >
              {t('test_finish')}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Main Layout Body */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Question Content */}
        <main className={cn(
          'flex-1 overflow-hidden bg-white',
          state.currentSectionType === 'reading' ? 'flex flex-col' : 'overflow-y-auto border-r border-slate-50'
        )}>
          {state.currentSectionType !== 'reading' ? (
            /* ── Non-reading: padded scroll area ── */
            <div className="h-full w-full mx-auto px-8 py-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {currentPartLabel.split('\u2014')[0].trim()}
                </h1>
              </div>
              <div className="w-full">
                {viewingDirections ? (
                  <div className={cn("w-full flex flex-col items-center justify-center min-h-[400px] transition-all duration-300", isDirectionsTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100')}>
                    <div className="w-full max-w-5xl text-center">
                      <h2 className="text-4xl font-bold text-slate-900 mb-6">{currentSectionPart?.title || 'Directions'}</h2>
                      <div className="prose prose-slate prose-lg mx-auto text-slate-600 mb-12 leading-relaxed">{currentSectionPart?.instructions}</div>
                      <button onClick={exitDirectionsView} className="rounded-lg bg-[#08507f] px-8 py-2.5 font-bold text-white text-sm hover:bg-[#064066] hover:shadow-md active:translate-y-0 transition-all uppercase tracking-widest">
                        {t('test_continue_questions')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {currentSectionPart?.audioUrl && (
                      <AudioPlayer src={currentSectionPart.audioUrl} playOnce autoPlay disabled={false} disableScrubbing={state.currentSectionType === 'listening'} volume={globalVolume} onEnd={handleAudioEnd} />
                    )}
                    <div className="mt-8">
                      {isPartBCMode ? (
                        <div className="space-y-12">
                          {questions.filter(q => q.sectionId === currentSectionPart?.id).map((q, i) => (
                             <QuestionRenderer key={q.id} question={q} answer={state.answers[q.id]} onAnswerChange={handleAnswerChange} displayNumber={partNumberOffset + i + 1} isActive={questions.indexOf(q) === currentQuestionIndex} disableScrubbing={state.currentSectionType === 'listening'} volume={globalVolume} hideQuestionText={state.currentSectionType === 'listening'} />
                          ))}
                        </div>
                      ) : currentQuestion && (
                         <QuestionRenderer question={currentQuestion} answer={state.answers[currentQuestion.id]} onAnswerChange={handleAnswerChange} displayNumber={currentQuestionIndex + 1} isActive={true} onAudioEnd={handleAudioEnd} playOnce autoPlay disableScrubbing={state.currentSectionType === 'listening'} volume={globalVolume} hideQuestionText={state.currentSectionType === 'listening'} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Reading: full-height, no outer padding ── */
            <>
              {viewingDirections ? (
                /* Directions — centered, padded */
                <div className="flex-1 flex items-center justify-center px-8 py-8">
                  <div className="w-full max-w-3xl text-center">
                    <h2 className="text-4xl font-bold text-slate-900 mb-8">Reading Comprehension</h2>
                    <div className="text-left text-slate-600 mb-12 whitespace-pre-wrap leading-relaxed text-lg">{currentSectionPart?.instructions}</div>
                    <button onClick={exitDirectionsView} className="rounded-lg bg-[#08507f] px-8 py-2.5 font-bold text-white text-sm hover:bg-[#064066] hover:shadow-md active:translate-y-0 transition-all uppercase tracking-widest">{t('test_begin_reading')}</button>
                  </div>
                </div>
              ) : (
                /* Active reading — passage bar + two columns, full height */
                <>
                  {/* Passage bar — full width, no padding mismatch */}
                  <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 shrink-0">
                    <h2 className="text-base font-bold text-slate-800">Passage {activePartIndex + 1}</h2>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">{answeredCount} / {questions.length} {t('test_answered')}</span>
                      <button
                        onClick={() => setIsToeflReadingProgressOpen(prev => !prev)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border',
                          isToeflReadingProgressOpen
                            ? 'bg-[#08507f] text-white border-[#08507f] shadow-sm'
                            : 'bg-white text-[#08507f] border-[#08507f]/30 hover:bg-[#e8f4fd] hover:border-[#08507f]'
                        )}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h8" />
                        </svg>
                        {isToeflReadingProgressOpen ? t('test_hide_progress') : t('test_show_progress')}
                      </button>
                    </div>
                  </div>

                  {/* Two-column area fills remaining height */}
                  <div className="flex flex-1 overflow-hidden">
                    {/* Left — passage */}
                    <div className="flex flex-col w-1/2 border-r border-slate-200 overflow-hidden">
                      {/* Questions range label */}
                      {(() => {
                        const partQs = questions.filter(q => q.sectionId === currentSectionPart?.id);
                        if (partQs.length === 0) return null;
                        const first = questions.indexOf(partQs[0]) + 1;
                        const last  = questions.indexOf(partQs[partQs.length - 1]) + 1;
                        return (
                          <div className="px-6 py-3 border-b border-slate-100 shrink-0">
                            <span className="text-sm font-bold text-slate-700">
                              Questions {first}{first !== last ? `\u2013${last}` : ''}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="flex-1 overflow-auto">
                        <ReadingPassage
                          title={currentSectionPart?.passageTitle || ''}
                          content={currentSectionPart?.passageText || ''}
                          highlightEnabled
                          variant="toefl_itp"
                        />
                      </div>
                    </div>

                    {/* Right — current question and side-pane navigator */}
                    <div className="flex-1 flex items-stretch overflow-hidden">
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                          {currentQuestion && (
                            <QuestionRenderer
                              question={currentQuestion}
                              answer={state.answers[currentQuestion.id]}
                              onAnswerChange={handleAnswerChange}
                              displayNumber={currentQuestionIndex + 1}
                              isActive
                            />
                          )}
                        </div>
                      </div>

                      {/* Reading progress — side pane (pushes question, doesn't overlay) */}
                      {isToeflReadingProgressOpen && (
                        <div className="w-64 bg-white border-l border-slate-200 shadow-sm flex flex-col overflow-y-auto z-10 animate-in slide-in-from-right duration-300">
                          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Progress</h3>
                            <button
                              onClick={() => setIsToeflReadingProgressOpen(false)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <div className="p-5">
                            <QuestionNavigator
                              totalQuestions={questions.length}
                              currentIndex={currentQuestionIndex}
                              onSelect={idx => selectQuestionIndex(idx)}
                              answeredIndices={new Set(questions.map((q, i) => state.answers[q.id] ? i : -1).filter(i => i !== -1))}
                              flaggedIndices={new Set(questions.map((q, i) => state.flaggedQuestions.has(q.id) ? i : -1).filter(i => i !== -1))}
                              allowNavigation
                              variant="grid"
                              hideActions
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* Right: Progress Sidebar — non-reading sections only */}
        {state.currentSectionType !== 'reading' && (
          <aside className="w-[280px] shrink-0 bg-[#f9fafb] p-6 overflow-y-auto flex flex-col border-l border-slate-100">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">{t('test_question_progress')}</h3>
            <QuestionNavigator
              totalQuestions={questions.length}
              currentIndex={currentQuestionIndex}
              onSelect={idx => state.currentSectionType !== 'listening' && selectQuestionIndex(idx)}
              answeredIndices={new Set(questions.map((q, i) => state.answers[q.id] ? i : -1).filter(i => i !== -1))}
              flaggedIndices={new Set(questions.map((q, i) => state.flaggedQuestions.has(q.id) ? i : -1).filter(i => i !== -1))}
              allowNavigation={state.currentSectionType !== 'listening'}
              variant="grid"
              hideActions
            />
            {state.currentSectionType === 'listening' && (
              <p className="mt-4 text-[10px] text-center text-slate-400 font-medium italic leading-relaxed">
                Navigation is disabled for the Listening section to maintain exam authenticity.
              </p>
            )}
          </aside>
        )}
      </div>

      {/* Footer */}
      {!viewingDirections && state.currentSectionType && currentQuestion && (
        <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-2.5 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center divide-x divide-slate-200 border border-slate-200 rounded overflow-hidden">
              <button
                onClick={handlePreviousQuestion}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={currentQuestionIndex === 0 && !isPartBCMode || (state.currentSectionType === 'listening')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                {t('test_prev')}
              </button>
              <button
                onClick={() => handleToggleFlag(currentQuestion.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-colors',
                  state.flaggedQuestions.has(currentQuestion.id)
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                {state.flaggedQuestions.has(currentQuestion.id) ? t('test_marked') : t('test_mark_review')}
              </button>
            </div>

            <div className="flex items-center gap-4">
              {thinkingTimeLeft !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md animate-pulse">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    {t('test_thinking_time')}: {thinkingTimeLeft}s
                  </span>
                </div>
              )}
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-2 bg-[#08507f] text-white text-[13px] font-bold uppercase tracking-wider rounded border-b-2 border-[#064066] hover:bg-[#064066] transition-all active:translate-y-0.5 active:border-b-0 group"
              >
                {thinkingTimeLeft !== null ? t('test_skip') : navigatorActionLabel}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <SubmitConfirmation isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} onConfirm={submitType === 'section' ? handleSubmitSection : handleSubmitTest} type={submitType} unansweredCount={unansweredCount()} />
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
