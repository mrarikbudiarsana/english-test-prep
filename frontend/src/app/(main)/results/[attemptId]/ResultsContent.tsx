'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { Attempt } from '@/types/test';
import { formatDate, formatScore, examNameFromTestType } from '@/lib/utils';
import { getTier } from '@/lib/tier';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTestTypesForExam } from '@/config/examConfig';
import { HiArrowLeft } from 'react-icons/hi';
import { Lock } from 'lucide-react';
import CongratulationsModal from '@/components/test/CongratulationsModal';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar, XAxis, YAxis, Cell, LabelList,
    ResponsiveContainer, Tooltip,
} from 'recharts';
import AnalysisView from '@/components/test/AnalysisView';
import { Subscription } from '@/types/user';

interface ResultsContentProps {
    attemptId: string;
}

interface CriteriaItem { label: string; short: string; band: number; }

function CriterionAnalytics({ criteria, color = '#08507f', maxScore = 50 }: { criteria: CriteriaItem[]; color?: string; maxScore?: number }) {
    const radarData = criteria.map(c => ({ subject: c.short, score: c.band, fullMark: maxScore }));
    const barData = criteria.map(c => ({ subject: c.label, score: c.band }));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Radar */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Section Shape</p>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis domain={[0, maxScore]} tick={false} axisLine={false} />
                            <Radar dataKey="score" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.2} />
                            <Tooltip
                                formatter={(v: any) => [`Score ${v}`, 'Score']}
                                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bars */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Section Scores</p>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap="25%">
                            <XAxis type="number" domain={[0, maxScore]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="subject" width={110} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                formatter={(v: any) => [`Score ${v}`, 'Score']}
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
    const { t } = useLanguage();
    const params = useParams<{ attemptId?: string | string[] }>();
    const searchParams = useSearchParams();
    const isCompleted = searchParams?.get('completed') === 'true';
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'analysis'>('overview');
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const routeAttemptId = Array.isArray(params?.attemptId) ? params.attemptId[0] : params?.attemptId;
    const resolvedAttemptId = (attemptId && attemptId !== 'undefined' ? attemptId : routeAttemptId)?.trim();
    const allowedTestTypes = user?.preferredExamType ? getTestTypesForExam(user.preferredExamType) : [];

    // Fetch subscription
    useEffect(() => {
        api.get('/subscriptions/current')
            .then(res => setSubscription(res.data?.data))
            .catch(() => setSubscription(null));
    }, []);

    // Auto-open congratulations modal if test was just completed
    useEffect(() => {
        if (attempt && isCompleted) {
            setShowShareModal(true);
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('completed');
                window.history.replaceState({}, '', url.pathname + url.search);
            }
        }
    }, [attempt, isCompleted]);

    const tier = getTier(user, subscription);

    const fetchResults = useCallback(async () => {
        try {
            setErrorMessage(null);
            if (!resolvedAttemptId) {
                setErrorMessage('Invalid result link.');
                return;
            }
            const res = await api.get(`/attempts/${resolvedAttemptId}/results`);
            setAttempt(res.data);
        } catch (error) {
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
    }, [resolvedAttemptId, user?.role]);

    useEffect(() => {
        if (!resolvedAttemptId) {
            setErrorMessage('Invalid result link.');
            setLoading(false);
            return;
        }
        void fetchResults();
    }, [fetchResults, resolvedAttemptId]);

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
                        void fetchResults();
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }


    if (attempt.test?.testType && allowedTestTypes.length > 0 && !allowedTestTypes.includes(attempt.test.testType) && user?.role !== 'admin') {
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

    const testType: string = attempt.test?.testType || 'toefl_itp';
    const examName = examNameFromTestType(testType);

    const sections = [
        { type: 'listening', label: 'Listening Comprehension', score: attempt.listeningScore, raw: attempt.listeningRaw, total: 50 },
        { type: 'structure', label: 'Structure and Written Expression', score: attempt.structureScore, raw: attempt.structureRaw, total: 40 },
        { type: 'reading', label: 'Reading Comprehension', score: attempt.readingScore, raw: attempt.readingRaw, total: 50 },
    ];

    // Determine if this is a partial test (only 1 section taken)
    const isPartialTest = !!attempt.practiceSectionType;
    const singleSection = isPartialTest ? sections.find(s => s.type === attempt.practiceSectionType) : null;

    // For partial tests, use the single section's score; for full tests, use overall
    const displayScore = isPartialTest && singleSection
        ? singleSection.score
        : attempt.overallScore;

    const displayLabel = isPartialTest && singleSection
        ? `Your Estimated ${examName} ${singleSection.label} Scaled Score`
        : 'Your Estimated Total Score';

    const scorePrecision = 0;
    const navyBannerClass = 'card-premium !rounded-[2.5rem] !p-12 !shadow-2xl';
    const navyScoreClass = 'text-[#08507f] drop-shadow-[0_4px_12px_rgba(8,80,127,0.2)]';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Back link */}
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <HiArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>

            {/* View Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-white p-1 rounded-xl shadow-sm border inline-flex">
                    <button
                        onClick={() => setViewMode('overview')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'overview'
                            ? 'bg-[#08507f] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Score Overview
                    </button>
                    <button
                        onClick={() => setViewMode('analysis')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'analysis'
                            ? 'bg-[#08507f] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Detailed Analysis
                    </button>
                </div>
            </div>

            {viewMode === 'overview' ? (
                <>
                    {/* Score Banner */}
                    <div className={`relative overflow-hidden rounded-3xl p-8 text-center border-2 ${navyBannerClass}`}>
                        <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-blue-100/40 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-slate-100/40 blur-2xl" />

                        <div className="mb-4 inline-flex items-center rounded-full border border-[#cbd5e1] bg-white px-3 py-1 text-xs font-semibold tracking-wide text-[#08507f]">
                            Practice Test Result (Unofficial)
                        </div>

                        <p className="mb-2 font-medium text-4xl leading-tight text-slate-800">{displayLabel}</p>
                        <div className={`font-bold text-7xl md:text-8xl ${navyScoreClass}`}>
                            {formatScore(Number(displayScore), scorePrecision)}
                        </div>
                        {attempt.completedAt && (
                            <p className="mt-3 text-sm text-slate-500">Completed on {formatDate(attempt.completedAt)}</p>
                        )}
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="mt-6 rounded-full px-6 py-2 text-sm font-medium border border-[#cbd5e1] bg-white text-[#08507f] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                        >
                            Share Result
                        </button>
                    </div>

                    {/* Section Scores - only show for full tests with multiple sections */}
                    {!isPartialTest && sections.length > 0 && (
                        <div className="mx-auto w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {sections.map((section) => (
                                <div
                                    key={section.type}
                                    className="card-premium !p-6 text-center hover:-translate-y-1"
                                >
                                    <p className="mb-2 text-[10px] font-bold text-[#08507f] uppercase tracking-[0.15em]">{section.label}</p>
                                    <p className="text-4xl font-black text-slate-800">
                                        {section.score != null ? Math.round(section.score) : '-'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">{section.type.substring(0, 1)} Scale</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Personalized Course CTA ──────────────────────────── */}
                    <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-slate-900 mt-12 mb-8" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.05] pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', transform: 'translate(20%, -20%)' }} />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner text-amber-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-xl font-black tracking-tight mb-2">
                                        {t('results_course_cta_title')}
                                    </h4>
                                    <p className="text-slate-400 text-sm max-w-xl leading-relaxed font-medium">
                                        {t('results_course_cta_body')}
                                    </p>
                                </div>
                            </div>
                            <a
                                href="https://wa.me/6282144223581?text=Halo%20Arik%2C%20saya%20tertarik%20dengan%20kursus%20TOEFL%20ITP"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl font-black transition-all duration-200 text-sm shadow-xl shrink-0 active:scale-95"
                                style={{ color: '#063d61', backgroundColor: '#f59e0b' }}
                            >
                                {t('results_course_cta_btn')}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Overall Section Analysis (Gated) */}
                    {!isPartialTest && sections.length > 0 && (
                        <div className="bg-white rounded-xl border border-[#cbd5e1] p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</h3>
                            {tier !== 'free' ? (
                                <CriterionAnalytics
                                    criteria={sections
                                        .filter(s => s.score !== null)
                                        .map(s => ({
                                            label: s.label,
                                            short: s.type.substring(0, 3).toUpperCase(),
                                            band: s.score || 0
                                        }))}
                                    color="#08507f"
                                    maxScore={68}
                                />
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
                                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <h4 className="font-semibold text-gray-700">Performance Charts Locked</h4>
                                    <p className="text-sm text-gray-500 mt-1">Upgrade to Starter to see your relative strengths and weaknesses.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {!isPartialTest && (
                        <p className="text-center text-sm text-[#08507f]/80">
                            This practice test is designed to help you evaluate your TOEFL ITP readiness. It is not an official score report, and your results on the actual exam may vary.
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-center space-x-4">
                        <Link href="/tests" className="px-6 py-3 rounded-xl bg-[#08507f] text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            Take Another Test
                        </Link>
                        <Link href="/dashboard" className="px-6 py-3 border border-[#cbd5e1] rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                            View Dashboard
                        </Link>
                    </div>
                </>
            ) : (
                <AnalysisView attempt={attempt} userSubscription={subscription} />
            )
            }

            <CongratulationsModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onViewResults={() => setShowShareModal(false)}
                testTitle={attempt.test?.title}
                attemptId={resolvedAttemptId}
                score={attempt.overallScore || undefined}
                isFreeTest={attempt.test?.isFree ?? true}
            />
        </div>
    );
}
