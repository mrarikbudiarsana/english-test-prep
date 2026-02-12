'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Attempt } from '@/types/test';
import { formatBand, formatDate, getBandColor, getBandBgColor, sectionTypeLabel } from '@/lib/utils';
import { HiArrowLeft, HiRefresh } from 'react-icons/hi';
import CongratulationsModal from '@/components/test/CongratulationsModal';

interface ResultsContentProps {
    attemptId: string;
}

export default function ResultsContent({ attemptId }: ResultsContentProps) {
    const router = useRouter();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        fetchResults();
    }, [attemptId]);

    async function fetchResults() {
        try {
            const res = await api.get(`/attempts/${attemptId}/results`);
            setAttempt(res.data);

            // If still scoring, poll every 5 seconds
            if (res.data.status === 'scoring') {
                setPolling(true);
                setTimeout(fetchResults, 5000);
            } else {
                setPolling(false);
                // Show share modal if just completed (optional logic, or user clicks share)
            }
        } catch {
            console.error('Failed to fetch results');
        } finally {
            setLoading(false);
        }
    }

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
            <div className="text-center py-12">
                <p className="text-gray-500">Results not found</p>
            </div>
        );
    }

    if (attempt.status === 'scoring') {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
                <h2 className="mt-6 text-2xl font-bold text-gray-900">Scoring your test...</h2>
                <p className="mt-2 text-gray-500">
                    Our AI is evaluating your Writing and Speaking responses. This usually takes 30-60 seconds.
                </p>
                <p className="mt-4 text-sm text-gray-400">Auto-refreshing every 5 seconds</p>
            </div>
        );
    }

    const sections = [
        { type: 'listening', label: 'Listening', band: attempt.listeningBand, raw: attempt.listeningRaw, total: 40 },
        { type: 'reading', label: 'Reading', band: attempt.readingBand, raw: attempt.readingRaw, total: 40 },
        { type: 'writing', label: 'Writing', band: attempt.writingBand, raw: null, total: null },
        { type: 'speaking', label: 'Speaking', band: attempt.speakingBand, raw: null, total: null },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Back link */}
            <Link
                href="/dashboard"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
                <HiArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>

            {/* Overall Score Banner */}
            <div className={`rounded-2xl p-8 text-center border-2 ${attempt.overallBand ? getBandBgColor(attempt.overallBand) : 'bg-gray-100 border-gray-200'}`}>
                <p className="text-sm font-medium text-gray-600 mb-2">Your IELTS Overall Band Score</p>
                <div className={`text-6xl font-bold ${attempt.overallBand ? getBandColor(attempt.overallBand) : 'text-gray-400'}`}>
                    {formatBand(attempt.overallBand)}
                </div>
                {attempt.completedAt && (
                    <p className="mt-3 text-sm text-gray-500">
                        Completed on {formatDate(attempt.completedAt)}
                    </p>
                )}

                {/* Share Button */}
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
                        <p className={`text-3xl font-bold ${section.band ? getBandColor(section.band) : 'text-gray-400'}`}>
                            {formatBand(section.band)}
                        </p>
                        {section.raw !== null && (
                            <p className="text-xs text-gray-400 mt-1">
                                {section.raw}/{section.total} correct
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Writing Feedback */}
            {attempt.writingFeedback && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Writing Feedback</h3>
                    {Object.entries(attempt.writingFeedback).map(([taskKey, feedback]: [string, any]) => (
                        <div key={taskKey} className="mb-6 last:mb-0">
                            <h4 className="font-medium text-gray-900 mb-3 capitalize">
                                {taskKey.replace(/([0-9])/g, ' $1')}
                            </h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                {feedback.taskAchievement && (
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-gray-500">Task Achievement</p>
                                        <p className="text-lg font-bold text-gray-900">{feedback.taskAchievement.band}</p>
                                    </div>
                                )}
                                {feedback.coherenceCohesion && (
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-gray-500">Coherence</p>
                                        <p className="text-lg font-bold text-gray-900">{feedback.coherenceCohesion.band}</p>
                                    </div>
                                )}
                                {feedback.lexicalResource && (
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-gray-500">Vocabulary</p>
                                        <p className="text-lg font-bold text-gray-900">{feedback.lexicalResource.band}</p>
                                    </div>
                                )}
                                {feedback.grammaticalRange && (
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-gray-500">Grammar</p>
                                        <p className="text-lg font-bold text-gray-900">{feedback.grammaticalRange.band}</p>
                                    </div>
                                )}
                            </div>
                            {feedback.generalFeedback && (
                                <p className="text-sm text-gray-600 mb-3">{feedback.generalFeedback}</p>
                            )}
                            {feedback.strengths && feedback.strengths.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-sm font-medium text-green-700">Strengths:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-600">
                                        {feedback.strengths.map((s: string, i: number) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {feedback.improvements && feedback.improvements.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-orange-700">Areas to Improve:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-600">
                                        {feedback.improvements.map((s: string, i: number) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Speaking Feedback */}
            {attempt.speakingFeedback && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Speaking Feedback</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        {attempt.speakingFeedback.fluencyCoherence && (
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Fluency & Coherence</p>
                                <p className="text-lg font-bold text-gray-900">{attempt.speakingFeedback.fluencyCoherence.band}</p>
                            </div>
                        )}
                        {attempt.speakingFeedback.lexicalResource && (
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Vocabulary</p>
                                <p className="text-lg font-bold text-gray-900">{attempt.speakingFeedback.lexicalResource.band}</p>
                            </div>
                        )}
                        {attempt.speakingFeedback.grammaticalRange && (
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Grammar</p>
                                <p className="text-lg font-bold text-gray-900">{attempt.speakingFeedback.grammaticalRange.band}</p>
                            </div>
                        )}
                        {attempt.speakingFeedback.pronunciation && (
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Pronunciation</p>
                                <p className="text-lg font-bold text-gray-900">{attempt.speakingFeedback.pronunciation.band}</p>
                            </div>
                        )}
                    </div>
                    {attempt.speakingFeedback.generalFeedback && (
                        <p className="text-sm text-gray-600 mb-3">{attempt.speakingFeedback.generalFeedback}</p>
                    )}
                    {attempt.speakingFeedback.strengths && (
                        <div className="mb-2">
                            <p className="text-sm font-medium text-green-700">Strengths:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                                {attempt.speakingFeedback.strengths.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {attempt.speakingFeedback.improvements && (
                        <div>
                            <p className="text-sm font-medium text-orange-700">Areas to Improve:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                                {attempt.speakingFeedback.improvements.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Link
                    href="/tests"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                    Take Another Test
                </Link>
                <Link
                    href="/dashboard"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                    View Dashboard
                </Link>
            </div>

            <CongratulationsModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onViewResults={() => setShowShareModal(false)}
                testTitle={attempt.test?.title}
                attemptId={attemptId}
            />
        </div>
    );
}

