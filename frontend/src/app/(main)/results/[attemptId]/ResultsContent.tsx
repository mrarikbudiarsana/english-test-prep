'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { Attempt } from '@/types/test';
import { formatBand, formatDate, getBandColor, getBandBgColor, examNameFromTestType, usesBandScale } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getTestTypesForExam } from '@/config/examConfig';
import { HiArrowLeft } from 'react-icons/hi';
import CongratulationsModal from '@/components/test/CongratulationsModal';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar, XAxis, YAxis, Cell, LabelList,
    ResponsiveContainer, Tooltip,
} from 'recharts';

interface ResultsContentProps {
    attemptId: string;
}

interface BandFeedback {
    band: number;
    feedback: string;
}

interface WritingTaskFeedback {
    taskNumber: number;
    wordCount: number;
    taskAchievement?: BandFeedback;
    taskResponse?: BandFeedback;
    coherenceCohesion: BandFeedback;
    lexicalResource: BandFeedback;
    grammaticalRangeAccuracy: BandFeedback;
    overallBand: number;
    generalFeedback: string;
}

interface WritingFeedback {
    tasks: WritingTaskFeedback[];
    overallWritingBand: number;
    summary: string;
}

interface SpeakingPartFeedback {
    partNumber: number;
    fluencyCoherence: BandFeedback;
    lexicalResource: BandFeedback;
    grammaticalRangeAccuracy: BandFeedback;
    pronunciation: BandFeedback;
    partFeedback: string;
}

interface SpeakingFeedback {
    parts: SpeakingPartFeedback[];
    overallSpeakingBand: number;
    fluencyCoherence: BandFeedback;
    lexicalResource: BandFeedback;
    grammaticalRangeAccuracy: BandFeedback;
    pronunciation: BandFeedback;
    summary: string;
}

function CriterionCard({ label, data }: { label: string; data: BandFeedback }) {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <span className="text-lg font-bold text-gray-900">Band {data.band}</span>
            </div>
            {data.feedback && (
                <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{data.feedback}</p>
            )}
        </div>
    );
}

interface CriteriaItem { label: string; short: string; band: number; }

function CriteriaAnalytics({ criteria, color = '#3b82f6' }: { criteria: CriteriaItem[]; color?: string; }) {
    const radarData = criteria.map(c => ({ subject: c.short, score: c.band, fullMark: 9 }));
    const barData = criteria.map(c => ({ subject: c.label, score: c.band }));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Radar */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Criteria Shape</p>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis domain={[0, 9]} tick={false} axisLine={false} />
                            <Radar dataKey="score" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.2} />
                            <Tooltip
                                formatter={(v: any) => [`Band ${v}`, 'Score']}
                                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bars */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Band Scores</p>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap="25%">
                            <XAxis type="number" domain={[0, 9]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="subject" width={110} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                formatter={(v: any) => [`Band ${v}`, 'Score']}
                                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                            />
                            <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={28}>
                                {barData.map((_, i) => <Cell key={i} fill={color} fillOpacity={0.8} />)}
                                <LabelList dataKey="score" position="right" formatter={(v: any) => `${v}`} style={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default function ResultsContent({ attemptId }: ResultsContentProps) {
    const { user } = useAuth();
    const params = useParams<{ attemptId?: string | string[] }>();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingDelayRef = useRef(5000);
    const MAX_POLLING_DELAY_MS = 20000;
    const routeAttemptId = Array.isArray(params?.attemptId) ? params.attemptId[0] : params?.attemptId;
    const resolvedAttemptId = (attemptId && attemptId !== 'undefined' ? attemptId : routeAttemptId)?.trim();
    const allowedTestTypes = user?.preferredExamType ? getTestTypesForExam(user.preferredExamType) : [];

    const clearPollTimeout = useCallback(() => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    }, []);

    const fetchResults = useCallback(async () => {
        try {
            setErrorMessage(null);
            if (!resolvedAttemptId) {
                setErrorMessage('Invalid result link.');
                return;
            }
            const res = await api.get(`/attempts/${resolvedAttemptId}/results`);
            setAttempt(res.data);

            clearPollTimeout();
            if (res.data.status === 'scoring') {
                const delay = pollingDelayRef.current;
                pollTimeoutRef.current = setTimeout(() => {
                    void fetchResults();
                }, delay);
                pollingDelayRef.current = Math.min(Math.floor(delay * 1.5), MAX_POLLING_DELAY_MS);
            } else {
                pollingDelayRef.current = 5000;
            }
        } catch (error) {
            clearPollTimeout();
            setAttempt(null);
            pollingDelayRef.current = 5000;
            if (isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 401) {
                    setErrorMessage('Your session expired. Please sign in again.');
                } else if (status === 403) {
                    setErrorMessage('You do not have access to this result.');
                } else if (status === 404) {
                    setErrorMessage('Result not found.');
                } else if (status === 429) {
                    setErrorMessage('Too many requests while checking score. Please wait a few seconds and retry.');
                } else {
                    const apiMessage = (error.response?.data as { error?: string; message?: string } | undefined)?.error
                        || (error.response?.data as { error?: string; message?: string } | undefined)?.message;
                    setErrorMessage(apiMessage || 'Failed to load result. Please try again.');
                }
                console.error('Failed to fetch results:', status, error.response?.data);
            } else {
                setErrorMessage('Failed to load result. Please try again.');
                console.error('Failed to fetch results:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [clearPollTimeout, resolvedAttemptId]);

    useEffect(() => {
        if (!resolvedAttemptId) {
            setErrorMessage('Invalid result link.');
            setLoading(false);
            return;
        }
        pollingDelayRef.current = 5000;
        void fetchResults();
        return clearPollTimeout;
    }, [clearPollTimeout, fetchResults, resolvedAttemptId]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-40 bg-gray-200 rounded-xl" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="text-center py-12 space-y-4">
                <p className="text-gray-500">{errorMessage || 'Results not found'}</p>
                <button
                    onClick={() => {
                        pollingDelayRef.current = 5000;
                        void fetchResults();
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (attempt.status === 'scoring') {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
                <h2 className="mt-6 text-2xl font-bold text-gray-900">Scoring your test...</h2>
                <p className="mt-2 text-gray-500">
                    Our AI is evaluating your Writing and Speaking responses. This usually takes 30–60 seconds.
                </p>
                <p className="mt-4 text-sm text-gray-400">Auto-refreshing every 5 seconds</p>
            </div>
        );
    }

    if (attempt.test?.testType && allowedTestTypes.length > 0 && !allowedTestTypes.includes(attempt.test.testType)) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Result not available for current program</h2>
                <p className="text-gray-500">Switch your program or open a result that matches your selected test type.</p>
                <Link
                    href="/results"
                    className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                    Back to Results
                </Link>
            </div>
        );
    }

    const testType = attempt.test?.testType || 'academic';
    const isToeflItp = testType === 'toefl_itp';
    const isBandScale = usesBandScale(testType);
    const examName = examNameFromTestType(testType);

    // Only show sections that have meaningful data
    // For objective sections (listening/reading): show if score > 0 or raw > 0
    // For subjective sections (writing/speaking): show if score exists and > 0
    const allSections = isToeflItp ? [
        { type: 'listening', label: 'Listening Comprehension', score: attempt.listeningScore, raw: attempt.listeningRaw, total: 50 },
        { type: 'structure', label: 'Structure and Written Expression', score: attempt.structureScore, raw: attempt.structureScore, total: 40 },
        { type: 'reading', label: 'Reading Comprehension', score: attempt.readingScore, raw: attempt.readingRaw, total: 50 },
    ] : [
        { type: 'listening', label: 'Listening', score: attempt.listeningBand, raw: attempt.listeningRaw, total: 40 },
        { type: 'reading', label: 'Reading', score: attempt.readingBand, raw: attempt.readingRaw, total: 40 },
        { type: 'writing', label: 'Writing', score: attempt.writingBand, raw: null, total: null },
        { type: 'speaking', label: 'Speaking', score: attempt.speakingBand, raw: null, total: null },
    ];
    const sections = isToeflItp
        ? allSections
        : allSections.filter(s => {
            const hasScore = s.score !== null && s.score !== undefined && s.score > 0;
            const hasRaw = s.raw !== null && s.raw !== undefined && s.raw > 0;
            return hasScore || hasRaw;
        });

    const writingFeedback = attempt.writingFeedback as WritingFeedback | null | undefined;
    const speakingFeedback = attempt.speakingFeedback as SpeakingFeedback | null | undefined;

    // Determine if this is a partial test (only 1 section taken)
    const isPartialTest = sections.length === 1;
    const singleSection = isPartialTest ? sections[0] : null;

    // For partial tests, use the single section's score; for full tests, use overall
    const displayScore = isPartialTest && singleSection
        ? singleSection.score
        : (isToeflItp ? (attempt.overallScore ?? attempt.overallBand) : attempt.overallBand);
    const sectionScoreLabel = isToeflItp ? 'Scaled Score' : (isBandScale ? 'Band Score' : 'Score');
    const displayLabel = isPartialTest && singleSection
        ? `Your ${examName} ${singleSection.label} ${sectionScoreLabel}`
        : (isToeflItp
            ? 'Your TOEFL ITP Total Score'
            : (isBandScale ? `Your ${examName} Overall Band Score` : `Your ${examName} Overall Score`));
    const toeflBannerClass = isToeflItp
        ? 'bg-gradient-to-br from-violet-50 via-indigo-50 to-white border-violet-200 shadow-[0_12px_35px_rgba(88,72,184,0.14)]'
        : (displayScore ? getBandBgColor(displayScore) : 'bg-gray-100 border-gray-200');
    const toeflScoreClass = isToeflItp
        ? 'text-violet-700 drop-shadow-[0_3px_10px_rgba(88,72,184,0.25)]'
        : (displayScore ? getBandColor(displayScore) : 'text-gray-400');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Back link */}
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <HiArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>

            {/* Score Banner */}
            <div className={`relative overflow-hidden rounded-3xl p-8 text-center border-2 ${toeflBannerClass}`}>
                {isToeflItp && (
                    <>
                        <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-violet-200/30 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-indigo-200/30 blur-2xl" />
                    </>
                )}
                <p className={`mb-2 text-sm font-medium ${isToeflItp ? 'text-violet-800' : 'text-gray-600'}`}>{displayLabel}</p>
                <div className={`text-6xl font-bold ${toeflScoreClass}`}>
                    {isToeflItp && !isPartialTest ? displayScore : formatBand(displayScore)}
                </div>
                {attempt.completedAt && (
                    <p className={`mt-3 text-sm ${isToeflItp ? 'text-violet-700/80' : 'text-gray-500'}`}>Completed on {formatDate(attempt.completedAt)}</p>
                )}
                <button
                    onClick={() => setShowShareModal(true)}
                    className={`mt-6 rounded-full px-6 py-2 text-sm font-medium transition-all ${isToeflItp
                        ? 'border border-violet-200 bg-white text-violet-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                        : 'border border-blue-100 bg-white text-blue-600 shadow-sm hover:shadow-md'}`}
                >
                    Share Result
                </button>
            </div>

            {/* Section Scores - only show for full tests with multiple sections */}
            {!isPartialTest && sections.length > 0 && (
                <div className={`grid gap-4 ${isToeflItp ? 'mx-auto w-full max-w-3xl grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                    {sections.map((section) => (
                        <div
                            key={section.type}
                            className={`rounded-2xl border p-5 text-center ${isToeflItp
                                ? 'border-violet-200 bg-gradient-to-b from-white to-violet-50/70 shadow-[0_10px_25px_rgba(88,72,184,0.08)]'
                                : 'border-gray-200 bg-white'}`}
                        >
                            <p className={`mb-1 text-sm font-medium ${isToeflItp ? 'text-violet-700' : 'text-gray-500'}`}>{section.label}</p>
                            <p className={`text-3xl font-bold ${isToeflItp ? 'text-violet-700' : (section.score ? getBandColor(section.score) : 'text-gray-400')}`}>
                                {isToeflItp ? section.score : formatBand(section.score)}
                            </p>
                            {section.raw !== null && !isToeflItp && (
                                <p className="text-xs text-gray-400 mt-1">{section.raw}/{section.total} correct</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {isToeflItp && !isPartialTest && (
                <p className="text-center text-sm text-violet-700/80">
                    TOEFL ITP reports one total score and three section scores.
                </p>
            )}

            {/* Writing Feedback - only show if writing was actually taken (score > 0) */}
            {attempt.writingBand && attempt.writingBand > 0 && writingFeedback?.tasks && writingFeedback.tasks.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Writing Feedback</h3>
                        {writingFeedback.summary && (
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{writingFeedback.summary}</p>
                        )}
                    </div>

                    {writingFeedback.tasks.map((task) => {
                        const writingCriteria: CriteriaItem[] = [
                            ...(task.taskAchievement ? [{ label: 'Task Achievement', short: 'TA', band: task.taskAchievement.band }] : []),
                            ...(task.taskResponse ? [{ label: 'Task Response', short: 'TR', band: task.taskResponse.band }] : []),
                            { label: 'Coherence & Cohesion', short: 'CC', band: task.coherenceCohesion.band },
                            { label: 'Lexical Resource', short: 'LR', band: task.lexicalResource.band },
                            { label: 'Grammar & Accuracy', short: 'GRA', band: task.grammaticalRangeAccuracy.band },
                        ];
                        return (
                            <div key={task.taskNumber} className="border-t border-gray-100 pt-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900">Task {task.taskNumber}</h4>
                                    <div className="flex items-center gap-3">
                                        {task.wordCount > 0 && (
                                            <span className="text-xs text-gray-400">{task.wordCount} words</span>
                                        )}
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${getBandBgColor(task.overallBand)} ${getBandColor(task.overallBand)}`}>
                                            Band {task.overallBand}
                                        </span>
                                    </div>
                                </div>

                                <CriteriaAnalytics criteria={writingCriteria} color="#3b82f6" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {task.taskAchievement && (
                                        <CriterionCard label="Task Achievement" data={task.taskAchievement} />
                                    )}
                                    {task.taskResponse && (
                                        <CriterionCard label="Task Response" data={task.taskResponse} />
                                    )}
                                    <CriterionCard label="Coherence & Cohesion" data={task.coherenceCohesion} />
                                    <CriterionCard label="Lexical Resource" data={task.lexicalResource} />
                                    <CriterionCard label="Grammatical Range & Accuracy" data={task.grammaticalRangeAccuracy} />
                                </div>

                                {task.generalFeedback && (
                                    <p className="mt-4 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">
                                        {task.generalFeedback}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Speaking Feedback - only show if speaking was actually taken (score > 0) */}
            {attempt.speakingBand && attempt.speakingBand > 0 && speakingFeedback && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Speaking Feedback</h3>
                        {speakingFeedback.summary && (
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{speakingFeedback.summary}</p>
                        )}
                    </div>

                    {/* Overall criteria analytics */}
                    <CriteriaAnalytics
                        criteria={[
                            { label: 'Fluency & Coherence', short: 'FC', band: speakingFeedback.fluencyCoherence.band },
                            { label: 'Lexical Resource', short: 'LR', band: speakingFeedback.lexicalResource.band },
                            { label: 'Grammar & Accuracy', short: 'GRA', band: speakingFeedback.grammaticalRangeAccuracy.band },
                            { label: 'Pronunciation', short: 'Pron', band: speakingFeedback.pronunciation.band },
                        ]}
                        color="#8b5cf6"
                    />

                    {/* Overall criteria detail cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CriterionCard label="Fluency & Coherence" data={speakingFeedback.fluencyCoherence} />
                        <CriterionCard label="Lexical Resource" data={speakingFeedback.lexicalResource} />
                        <CriterionCard label="Grammatical Range & Accuracy" data={speakingFeedback.grammaticalRangeAccuracy} />
                        <CriterionCard label="Pronunciation" data={speakingFeedback.pronunciation} />
                    </div>

                    {/* Per-part breakdown */}
                    {speakingFeedback.parts && speakingFeedback.parts.length > 0 && (
                        <div className="space-y-4">
                            {speakingFeedback.parts.map((part) => (
                                <div key={part.partNumber} className="border-t border-gray-100 pt-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Part {part.partNumber}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                        {[
                                            { label: 'Fluency', data: part.fluencyCoherence },
                                            { label: 'Vocabulary', data: part.lexicalResource },
                                            { label: 'Grammar', data: part.grammaticalRangeAccuracy },
                                            { label: 'Pronunciation', data: part.pronunciation },
                                        ].map(({ label, data }) => (
                                            <div key={label} className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500">{label}</p>
                                                <p className="text-lg font-bold text-gray-900">Band {data.band}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {part.partFeedback && (
                                        <p className="mt-3 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">
                                            {part.partFeedback}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Link href="/tests" className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${isToeflItp ? 'bg-violet-700 hover:bg-violet-800' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    Take Another Test
                </Link>
                <Link href="/dashboard" className={`px-6 py-3 border rounded-lg font-medium transition-colors ${isToeflItp ? 'border-violet-200 text-violet-800 hover:bg-violet-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    View Dashboard
                </Link>
            </div>

            <CongratulationsModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onViewResults={() => setShowShareModal(false)}
                testTitle={attempt.test?.title}
                attemptId={resolvedAttemptId}
            />
        </div>
    );
}
