'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { Attempt } from '@/types/test';
import { formatBand, formatDate, getBandColor, getBandBgColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getTestTypesForExam } from '@/config/examConfig';
import { HiArrowLeft } from 'react-icons/hi';
import CongratulationsModal from '@/components/test/CongratulationsModal';

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
    const isToefl = testType === 'toefl_itp';

    // Only show sections that have meaningful data
    // For objective sections (listening/reading): show if score > 0 or raw > 0
    // For subjective sections (writing/speaking): show if score exists and > 0
    const allSections = isToefl ? [
        { type: 'listening', label: 'Listening', score: attempt.listeningScore, raw: attempt.listeningRaw, total: 50 },
        { type: 'structure', label: 'Structure', score: attempt.structureScore, raw: attempt.structureScore, total: 40 },
        { type: 'reading', label: 'Reading', score: attempt.readingScore, raw: attempt.readingRaw, total: 50 },
    ] : [
        { type: 'listening', label: 'Listening', score: attempt.listeningBand, raw: attempt.listeningRaw, total: 40 },
        { type: 'reading', label: 'Reading', score: attempt.readingBand, raw: attempt.readingRaw, total: 40 },
        { type: 'writing', label: 'Writing', score: attempt.writingBand, raw: null, total: null },
        { type: 'speaking', label: 'Speaking', score: attempt.speakingBand, raw: null, total: null },
    ];
    const sections = allSections.filter(s => {
        const hasScore = s.score !== null && s.score !== undefined && s.score > 0;
        const hasRaw = s.raw !== null && s.raw !== undefined && s.raw > 0;
        return hasScore || hasRaw;
    });

    const writingFeedback = attempt.writingFeedback as WritingFeedback | null | undefined;
    const speakingFeedback = attempt.speakingFeedback as SpeakingFeedback | null | undefined;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Back link */}
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <HiArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>

            {/* Overall Score Banner */}
            <div className={`rounded-2xl p-8 text-center border-2 ${isToefl
                    ? (attempt.overallScore ? getBandBgColor(attempt.overallScore) : 'bg-gray-100 border-gray-200')
                    : (attempt.overallBand ? getBandBgColor(attempt.overallBand) : 'bg-gray-100 border-gray-200')
                }`}>
                <p className="text-sm font-medium text-gray-600 mb-2">{isToefl ? 'TOEFL Total Score' : 'Your IELTS Overall Band Score'}</p>
                <div className={`text-6xl font-bold ${isToefl
                        ? (attempt.overallScore ? getBandColor(attempt.overallScore) : 'text-gray-400')
                        : (attempt.overallBand ? getBandColor(attempt.overallBand) : 'text-gray-400')
                    }`}>
                    {isToefl ? attempt.overallScore : formatBand(attempt.overallBand)}
                </div>
                {attempt.completedAt && (
                    <p className="mt-3 text-sm text-gray-500">Completed on {formatDate(attempt.completedAt)}</p>
                )}
                <button
                    onClick={() => setShowShareModal(true)}
                    className="mt-6 px-6 py-2 bg-white text-blue-600 font-medium rounded-full shadow-sm hover:shadow-md transition-all text-sm border border-blue-100"
                >
                    Share Result
                </button>
            </div>

            {/* Section Scores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sections.map((section) => (
                    <div key={section.type} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                        <p className="text-sm font-medium text-gray-500 mb-1">{section.label}</p>
                        <p className={`text-3xl font-bold ${section.score ? getBandColor(section.score) : 'text-gray-400'}`}>
                            {isToefl ? section.score : formatBand(section.score)}
                        </p>
                        {section.raw !== null && !isToefl && (
                            <p className="text-xs text-gray-400 mt-1">{section.raw}/{section.total} correct</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Writing Feedback */}
            {writingFeedback?.tasks && writingFeedback.tasks.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Writing Feedback</h3>
                        {writingFeedback.summary && (
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{writingFeedback.summary}</p>
                        )}
                    </div>

                    {writingFeedback.tasks.map((task) => (
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
                    ))}
                </div>
            )}

            {/* Speaking Feedback */}
            {speakingFeedback && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Speaking Feedback</h3>
                        {speakingFeedback.summary && (
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{speakingFeedback.summary}</p>
                        )}
                    </div>

                    {/* Overall criteria */}
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
                <Link href="/tests" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                    Take Another Test
                </Link>
                <Link href="/dashboard" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
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
