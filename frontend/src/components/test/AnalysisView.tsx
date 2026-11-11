'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { Attempt, Section, Question, SectionType } from '@/types/test';
import { Subscription } from '@/types/user';
import api from '@/lib/api';
import { getTier } from '@/lib/tier';
import QuestionRenderer from '@/components/test/QuestionRenderer';
import AudioPlayer from '@/components/test/AudioPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    Lock,
    Check,
    AlertCircle,
    Sparkles,
    CheckCircle2,
    XCircle,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Volume2,
    BookOpen,
    Layers,
    Filter,
    ArrowUp,
    RotateCcw
} from 'lucide-react';

interface AnalysisViewProps {
    attempt: Attempt;
    userSubscription?: Subscription | null;
}

interface AnalysisQuestion extends Question {
    displayNumber: number;
}

const SECTION_ORDER: SectionType[] = ['listening', 'structure', 'reading'];

const SECTION_CONFIG: Record<SectionType, { label: string; shortLabel: string; icon: typeof Volume2; defaultTotal: number }> = {
    listening: {
        label: 'Listening Comprehension',
        shortLabel: 'Listening',
        icon: Volume2,
        defaultTotal: 50,
    },
    structure: {
        label: 'Structure & Written Expression',
        shortLabel: 'Structure',
        icon: BookOpen,
        defaultTotal: 40,
    },
    reading: {
        label: 'Reading Comprehension',
        shortLabel: 'Reading',
        icon: Layers,
        defaultTotal: 50,
    },
};

export default function AnalysisView({ attempt, userSubscription }: AnalysisViewProps) {
    const { user } = useAuth();
    const tier = getTier(user, userSubscription ?? null);

    const [sections, setSections] = useState<Section[]>([]);
    const [activeSectionType, setActiveSectionType] = useState<SectionType>('listening');
    const [activePartFilter, setActivePartFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'incorrect' | 'correct' | 'unanswered'>('all');

    // Cache questions by sectionType: Record<SectionType, AnalysisQuestion[]>
    const [questionsByType, setQuestionsByType] = useState<Record<string, AnalysisQuestion[]>>({});
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);
    const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const navigatorRef = useRef<HTMLDivElement>(null);

    // Track scroll for floating back to top button
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 450);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 1. Initial Load: Sections and Answers
    useEffect(() => {
        async function init() {
            try {
                setLoading(true);
                const [sectionsRes, responsesRes] = await Promise.all([
                    api.get(`/tests/${attempt.testId}/sections`),
                    api.get(`/attempts/${attempt.id}/responses`).catch(e => {
                        console.error('Could not fetch responses', e);
                        return { data: [] };
                    }),
                ]);

                const allSections: Section[] = sectionsRes.data || [];
                setSections(allSections);

                const map: Record<string, any> = {};
                const responsesData = responsesRes.data?.data || responsesRes.data || [];
                if (Array.isArray(responsesData)) {
                    responsesData.forEach((r: any) => {
                        if (r.questionId) {
                            map[r.questionId] = r;
                        }
                    });
                }
                setAnswers(map);

                // Set initial active section type
                if (attempt.practiceSectionType) {
                    setActiveSectionType(attempt.practiceSectionType);
                } else if (allSections.length > 0) {
                    const firstType = allSections[0].sectionType;
                    setActiveSectionType(firstType);
                }
            } catch (err) {
                console.error('Failed to init analysis', err);
            } finally {
                setLoading(false);
            }
        }
        void init();
    }, [attempt.testId, attempt.id, attempt.practiceSectionType]);

    // Available main section types for this attempt
    const availableSectionTypes = useMemo(() => {
        if (attempt.practiceSectionType) {
            return [attempt.practiceSectionType];
        }
        const typesInTest = new Set(sections.map(s => s.sectionType));
        const list = SECTION_ORDER.filter(st => typesInTest.has(st));
        return list.length > 0 ? list : (['listening'] as SectionType[]);
    }, [attempt.practiceSectionType, sections]);

    // Current section parts for active type (e.g. Part A, Part B, Part C)
    const currentSectionParts = useMemo(() => {
        return sections
            .filter(s => s.sectionType === activeSectionType)
            .sort((a, b) => a.sectionOrder - b.sectionOrder);
    }, [sections, activeSectionType]);

    // 2. Fetch all questions for active section type (cached)
    useEffect(() => {
        if (!activeSectionType || sections.length === 0) return;
        if (questionsByType[activeSectionType]) return;

        async function fetchSectionQuestions() {
            setLoadingQuestions(true);
            try {
                const sectionParts = sections
                    .filter(s => s.sectionType === activeSectionType)
                    .sort((a, b) => a.sectionOrder - b.sectionOrder);

                const results = await Promise.all(
                    sectionParts.map(part =>
                        api.get(`/attempts/${attempt.id}/sections/${part.id}/questions`)
                            .then(res => ({
                                sectionId: part.id,
                                questions: (res.data?.data || res.data || []) as Question[],
                            }))
                            .catch(err => {
                                console.error(`Failed to load questions for section ${part.id}:`, err);
                                return { sectionId: part.id, questions: [] as Question[] };
                            })
                    )
                );

                let runningNumber = 1;
                const combined: AnalysisQuestion[] = [];
                results.forEach(partRes => {
                    partRes.questions.forEach(q => {
                        combined.push({
                            ...q,
                            sectionId: partRes.sectionId,
                            displayNumber: runningNumber++,
                        });
                    });
                });

                setQuestionsByType(prev => ({
                    ...prev,
                    [activeSectionType]: combined,
                }));
            } catch (err) {
                console.error('Failed to load section questions', err);
            } finally {
                setLoadingQuestions(false);
            }
        }

        void fetchSectionQuestions();
    }, [activeSectionType, sections, attempt.id, questionsByType]);

    const currentQuestions = questionsByType[activeSectionType] || [];

    // Calculate score / accuracy stats for active section
    const stats = useMemo(() => {
        const total = currentQuestions.length;
        let correct = 0;
        let incorrect = 0;
        let unanswered = 0;

        currentQuestions.forEach(q => {
            const responseObj = answers[q.id];
            const isCorrect = responseObj?.isCorrect;
            const hasAnswer = responseObj?.answerData !== null && responseObj?.answerData !== undefined && responseObj?.answerData !== '';

            if (isCorrect === true) {
                correct++;
            } else if (isCorrect === false) {
                incorrect++;
            } else {
                unanswered++;
            }
        });

        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { total, correct, incorrect, unanswered, accuracy };
    }, [currentQuestions, answers]);

    // Filter questions based on active part and status filter
    const filteredQuestions = useMemo(() => {
        return currentQuestions.filter(q => {
            // 1. Part filter
            if (activePartFilter !== 'all' && q.sectionId !== activePartFilter) {
                return false;
            }

            // 2. Status filter
            const responseObj = answers[q.id];
            const isCorrect = responseObj?.isCorrect;
            const hasAnswer = responseObj?.answerData !== null && responseObj?.answerData !== undefined && responseObj?.answerData !== '';
            const isUnanswered = !hasAnswer || isCorrect === null || isCorrect === undefined;

            if (statusFilter === 'incorrect') {
                return isCorrect === false;
            }
            if (statusFilter === 'correct') {
                return isCorrect === true;
            }
            if (statusFilter === 'unanswered') {
                return isUnanswered;
            }
            return true;
        });
    }, [currentQuestions, activePartFilter, statusFilter, answers]);

    // Question jump click handler
    const handleQuestionClick = (questionId: string) => {
        const qObj = currentQuestions.find(q => q.id === questionId);
        if (!qObj) return;

        // Reset part filter if clicked question is in another part
        if (activePartFilter !== 'all' && qObj.sectionId !== activePartFilter) {
            setActivePartFilter('all');
        }

        // Reset status filter if clicked question is hidden by current status filter
        const responseObj = answers[questionId];
        const isCorrect = responseObj?.isCorrect;
        const hasAnswer = responseObj?.answerData !== null && responseObj?.answerData !== undefined && responseObj?.answerData !== '';
        const isUnanswered = !hasAnswer || isCorrect === null || isCorrect === undefined;

        if (statusFilter === 'incorrect' && isCorrect !== false) {
            setStatusFilter('all');
        } else if (statusFilter === 'correct' && isCorrect !== true) {
            setStatusFilter('all');
        } else if (statusFilter === 'unanswered' && !isUnanswered) {
            setStatusFilter('all');
        }

        setTimeout(() => {
            const el = document.getElementById(`analysis-q-${questionId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedQuestionId(questionId);
                setTimeout(() => setHighlightedQuestionId(null), 2500);
            }
        }, 80);
    };

    const scrollToNavigator = () => {
        if (navigatorRef.current) {
            navigatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getSectionScoreBadge = (type: SectionType) => {
        if (type === 'listening' && attempt.listeningRaw != null) {
            return `${attempt.listeningRaw}/50`;
        }
        if (type === 'structure' && attempt.structureRaw != null) {
            return `${attempt.structureRaw}/40`;
        }
        if (type === 'reading' && attempt.readingRaw != null) {
            return `${attempt.readingRaw}/50`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="py-16 text-center space-y-4">
                <div className="inline-block w-8 h-8 border-4 border-[#08507f] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading analysis data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Tier Banner ────────────────────────────────────────── */}
            <div className={cn(
                'p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all',
                tier === 'free' ? 'bg-slate-50 border-slate-200' :
                    tier === 'starter' ? 'bg-blue-50/70 border-blue-200' :
                        'bg-purple-50/70 border-purple-200'
            )}>
                <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#08507f]" />
                        Test Review & Explanations
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        Complete breakdown of your answers, official answer keys, and detailed question explanations.
                    </p>
                </div>
            </div>

            {/* ── Level 1: Primary Section Tabs (Clean Exam Hierarchy) ── */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
                {availableSectionTypes.map(type => {
                    const config = SECTION_CONFIG[type];
                    const Icon = config.icon;
                    const isActive = activeSectionType === type;
                    const scoreBadge = getSectionScoreBadge(type);

                    return (
                        <button
                            key={type}
                            onClick={() => {
                                setActiveSectionType(type);
                                setActivePartFilter('all');
                                setStatusFilter('all');
                            }}
                            className={cn(
                                'flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all',
                                isActive
                                    ? 'bg-[#08507f] text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            )}
                        >
                            <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                            <span>{config.label}</span>
                            {scoreBadge && (
                                <span className={cn(
                                    'ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold',
                                    isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                )}>
                                    {scoreBadge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Level 2: Question Palette Navigator & Filter Hub ──── */}
            <div ref={navigatorRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                {/* Header row: Title, Stats summary, Collapse toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#08507f] flex items-center justify-center">
                            <Filter className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-900">Question Navigator & Filters</h4>
                            <p className="text-xs text-slate-500">
                                Click any question number below to jump directly to its review.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        {stats.total > 0 && (
                            <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                                Score: <span className="text-[#08507f]">{stats.correct}/{stats.total}</span> ({stats.accuracy}%)
                            </div>
                        )}
                        <button
                            onClick={() => setIsNavigatorCollapsed(prev => !prev)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title={isNavigatorCollapsed ? 'Expand Navigator' : 'Collapse Navigator'}
                        >
                            {isNavigatorCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Status Filters: All, Incorrect, Correct, Unanswered */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                                statusFilter === 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            )}
                        >
                            All ({stats.total})
                        </button>

                        <button
                            onClick={() => setStatusFilter('incorrect')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                                statusFilter === 'incorrect'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100/70'
                            )}
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect ({stats.incorrect})</span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('correct')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                                statusFilter === 'correct'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-emerald-50/70 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                            )}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct ({stats.correct})</span>
                        </button>

                        {stats.unanswered > 0 && (
                            <button
                                onClick={() => setStatusFilter('unanswered')}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                                    statusFilter === 'unanswered'
                                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                )}
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Unanswered ({stats.unanswered})</span>
                            </button>
                        )}
                    </div>

                    {/* Reset Filters Shortcut (if active) */}
                    {(statusFilter !== 'all' || activePartFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setStatusFilter('all');
                                setActivePartFilter('all');
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#08507f] hover:underline"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset Filters
                        </button>
                    )}
                </div>

                {/* Secondary: Sub-part pills (if section has multiple parts) */}
                {currentSectionParts.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-3">
                        <span className="text-slate-400 font-semibold shrink-0 uppercase tracking-wider text-[10px]">
                            Parts:
                        </span>
                        <button
                            onClick={() => setActivePartFilter('all')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0',
                                activePartFilter === 'all'
                                    ? 'bg-slate-800 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}
                        >
                            All Parts
                        </button>
                        {currentSectionParts.map((part, i) => (
                            <button
                                key={part.id}
                                onClick={() => setActivePartFilter(part.id)}
                                className={cn(
                                    'px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0',
                                    activePartFilter === part.id
                                        ? 'bg-[#08507f] text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                {part.title || `Part ${i + 1}`}
                            </button>
                        ))}
                    </div>
                )}

                {/* Collapsible Number Palette Grid */}
                {!isNavigatorCollapsed && (
                    <div className="pt-2 border-t border-slate-100">
                        {loadingQuestions ? (
                            <div className="py-6 text-center text-xs text-slate-400">Loading questions palette...</div>
                        ) : currentQuestions.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">No questions found for this section.</div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {currentQuestions.map(q => {
                                    const responseObj = answers[q.id];
                                    const isCorrect = responseObj?.isCorrect;
                                    const hasAnswer = responseObj?.answerData !== null && responseObj?.answerData !== undefined && responseObj?.answerData !== '';
                                    const isUnanswered = !hasAnswer || isCorrect === null || isCorrect === undefined;

                                    const isDimmed = (
                                        (statusFilter === 'incorrect' && isCorrect !== false) ||
                                        (statusFilter === 'correct' && isCorrect !== true) ||
                                        (statusFilter === 'unanswered' && !isUnanswered) ||
                                        (activePartFilter !== 'all' && q.sectionId !== activePartFilter)
                                    );

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => handleQuestionClick(q.id)}
                                            className={cn(
                                                'w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center border',
                                                isCorrect === true
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                    : isCorrect === false
                                                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100',
                                                highlightedQuestionId === q.id && 'ring-2 ring-[#08507f] ring-offset-2 scale-110 shadow-md',
                                                isDimmed && 'opacity-25 hover:opacity-100'
                                            )}
                                            title={`Q${q.displayNumber}: ${isCorrect === true ? 'Correct' : isCorrect === false ? 'Incorrect' : 'Unanswered'}`}
                                        >
                                            {q.displayNumber}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Level 3: Questions List & Explanations ─────────────── */}
            <div className="space-y-6">
                {loadingQuestions ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="inline-block w-6 h-6 border-2 border-[#08507f] border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-xs">Loading section questions...</p>
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">No Questions Match Filter</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {statusFilter === 'incorrect'
                                ? '🎉 Outstanding! You had no incorrect answers in this section part.'
                                : 'Try adjusting or clearing your filters above.'}
                        </p>
                        <button
                            onClick={() => {
                                setStatusFilter('all');
                                setActivePartFilter('all');
                            }}
                            className="px-4 py-2 rounded-xl bg-[#08507f] text-white text-xs font-semibold hover:bg-[#064066] transition-colors"
                        >
                            Show All Questions
                        </button>
                    </div>
                ) : (
                    filteredQuestions.map((q, index) => {
                        const responseObj = answers[q.id];
                        const userAnswer = responseObj?.answerData ?? null;
                        const isListening = activeSectionType === 'listening';

                        // Full access to answers and explanations for completed tests
                        const showStatus = true;
                        const showCorrectAnswer = true;
                        const showExplanation = true;

                        const isCorrect = responseObj?.isCorrect;
                        const hasAnswer = userAnswer !== null && userAnswer !== undefined && userAnswer !== '';

                        const statusColor = isCorrect === true
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : isCorrect === false
                                ? 'text-rose-700 bg-rose-50 border-rose-200'
                                : 'text-slate-500 bg-slate-50 border-slate-200';

                        const statusIcon = isCorrect === true
                            ? <Check className="w-3.5 h-3.5" />
                            : isCorrect === false
                                ? <AlertCircle className="w-3.5 h-3.5" />
                                : null;

                        const statusText = isCorrect === true
                            ? 'Correct'
                            : isCorrect === false
                                ? 'Incorrect'
                                : 'Not Answered';

                        // Check if this question begins a new section part (e.g. Part A to Part B, or Passage change)
                        const prevQ = index > 0 ? filteredQuestions[index - 1] : null;
                        const isNewSectionPart = !prevQ || prevQ.sectionId !== q.sectionId;
                        const partObj = currentSectionParts.find(p => p.id === q.sectionId);

                        // Sanitized question object for Renderer
                        const renderQuestion = {
                            ...q,
                            explanation: showExplanation ? q.explanation : undefined,
                            explanationAi: showExplanation ? q.explanationAi : undefined,
                            correctAnswer: showCorrectAnswer ? q.correctAnswer : undefined,
                        };

                        const isHighlighted = highlightedQuestionId === q.id;

                        return (
                            <React.Fragment key={q.id}>
                                {/* Part Divider Header */}
                                {isNewSectionPart && partObj && (
                                    <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl p-4 sm:p-5 mt-8 mb-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-[#08507f] bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                                                    {partObj.title || 'Section Part'}
                                                </span>
                                                {partObj.instructions && (
                                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                                        {partObj.instructions}
                                                    </p>
                                                )}
                                            </div>
                                            {partObj.audioUrl && (
                                                <div className="shrink-0 w-full sm:w-auto">
                                                    <AudioPlayer src={partObj.audioUrl} disabled={false} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Question Item Card */}
                                <div
                                    id={`analysis-q-${q.id}`}
                                    className={cn(
                                        'bg-white rounded-2xl border p-5 sm:p-6 transition-all duration-300 relative',
                                        isHighlighted
                                            ? 'border-[#08507f] ring-2 ring-[#08507f]/30 shadow-lg scale-[1.005]'
                                            : 'border-slate-200 shadow-xs hover:border-slate-300'
                                    )}
                                >
                                    {/* Left Accent Bar */}
                                    <div
                                        className={cn(
                                            'absolute left-0 top-3 bottom-3 w-1 rounded-r transition-colors',
                                            isCorrect === true
                                                ? 'bg-emerald-500'
                                                : isCorrect === false
                                                    ? 'bg-rose-500'
                                                    : 'bg-slate-300'
                                        )}
                                    />

                                    {/* Question Card Top Bar */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                                                Q{q.displayNumber}
                                            </span>
                                            {showStatus && (
                                                <div className={cn('flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium', statusColor)}>
                                                    {statusIcon}
                                                    <span>{statusText}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Question Renderer */}
                                    <QuestionRenderer
                                        question={renderQuestion}
                                        answer={userAnswer}
                                        onAnswerChange={() => { }}
                                        readOnly={true}
                                        hideQuestionText={isListening}
                                        displayNumber={q.displayNumber}
                                        hideExplanation={true}
                                    />

                                    {/* Free Tier Gated Lock */}
                                    {!showCorrectAnswer && !isCorrect && (
                                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Correct answer is hidden for Free tier.</span>
                                            </div>
                                            <Link href="/pricing" className="text-[#08507f] font-semibold hover:underline">
                                                Upgrade to Reveal
                                            </Link>
                                        </div>
                                    )}

                                    {/* Explanations (Gated by Tier) */}
                                    {showExplanation && (renderQuestion.explanation || renderQuestion.explanationAi) && (
                                        <div className="mt-5 space-y-3 pt-4 border-t border-slate-100">
                                            {renderQuestion.explanation && (
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-[0.15em] mb-1.5 opacity-60">
                                                        Tutor Explanation
                                                    </h4>
                                                    <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                                                        {renderQuestion.explanation}
                                                    </p>
                                                </div>
                                            )}
                                            {renderQuestion.explanationAi && renderQuestion.explanationAi.trim() !== renderQuestion.explanation?.trim() && (
                                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 relative overflow-hidden group/ai">
                                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover/ai:opacity-[0.07] transition-opacity">
                                                        <Sparkles className="w-16 h-16 text-blue-600" />
                                                    </div>
                                                    <h4 className="font-bold text-blue-900 text-[10px] uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5" /> AI Insight
                                                    </h4>
                                                    <div className="text-blue-900 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                                        {renderQuestion.explanationAi}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </div>

            {/* ── Floating Jump-to-Navigator Button ──────────────────── */}
            {showBackToTop && (
                <button
                    onClick={scrollToNavigator}
                    className="fixed bottom-6 right-6 z-40 bg-[#08507f] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#064066] transition-all flex items-center gap-2 text-xs font-bold border border-white/20 active:scale-95"
                >
                    <ArrowUp className="w-4 h-4" />
                    <span>Jump to Navigator</span>
                </button>
            )}
        </div>
    );
}
