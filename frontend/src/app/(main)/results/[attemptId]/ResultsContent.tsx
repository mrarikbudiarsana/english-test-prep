'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { Attempt } from '@/types/test';
import { formatDate, formatScore, examNameFromTestType } from '@/lib/utils';
import { getToeflItpCefr, CefrInfo, CefrSkillKey } from '@/lib/cefr';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTestTypesForExam } from '@/config/examConfig';
import { HiArrowLeft, HiShare, HiOutlineSparkles } from 'react-icons/hi';
import CongratulationsModal from '@/components/test/CongratulationsModal';
import AnalysisView from '@/components/test/AnalysisView';

interface ResultsContentProps {
    attemptId: string;
}

interface SectionSummary {
    type: Exclude<CefrSkillKey, 'overall'>;
    label: string;
    shortLabel: string;
    score: number | null | undefined;
    raw: number | null | undefined;
    total: number;
}

function toPercent(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function CefrScaleTrack({ score, cefr, compact = false }: { score: number; cefr: CefrInfo; compact?: boolean }) {
    const { min, max } = cefr.range;
    const fillPct = toPercent(score, min, max);
    const markers: Array<{ label: string; value: number }> = [
        { label: 'A2', value: cefr.thresholds.a2 },
        { label: 'B1', value: cefr.thresholds.b1 },
        { label: 'B2', value: cefr.thresholds.b2 },
        { label: 'C1', value: cefr.thresholds.c1 },
    ];

    return (
        <div className="w-full">
            <div className={`relative w-full rounded-full bg-slate-100 ${compact ? 'h-2.5' : 'h-3'} overflow-visible`}>
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[#08507f] to-[#0ea5e9] transition-all duration-500"
                    style={{ width: `${fillPct}%` }}
                />
                {markers.map((m) => {
                    const leftPct = toPercent(m.value, min, max);
                    return (
                        <div
                            key={m.label}
                            className="absolute top-0 bottom-0 w-px bg-slate-300/90"
                            style={{ left: `${leftPct}%` }}
                            title={`CEFR ${m.label}: ${m.value}+`}
                        />
                    );
                })}
            </div>
            <div className="relative mt-1.5 h-4 text-[10px] font-semibold text-slate-400">
                <span className="absolute left-0">{min}</span>
                {markers.map((m) => {
                    const leftPct = toPercent(m.value, min, max);
                    const reached = Math.round(score) >= m.value;
                    return (
                        <span
                            key={m.label}
                            className={`absolute -translate-x-1/2 ${reached ? 'text-[#08507f] font-bold' : 'text-slate-400'}`}
                            style={{ left: `${leftPct}%` }}
                        >
                            {m.label}
                        </span>
                    );
                })}
                <span className="absolute right-0">{max}</span>
            </div>
        </div>
    );
}

function SkillBenchmarkPanel({
    sections,
    focusSectionType,
}: {
    sections: SectionSummary[];
    focusSectionType: SectionSummary['type'] | null;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">CEFR Skill Benchmark</h3>
                    <p className="text-xs text-slate-500">
                        Each skill mapped to official ETS TOEFL ITP Level 1 CEFR cut scores
                    </p>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Scale: 31 – 68 (Reading 67)</span>
            </div>

            <div className="space-y-5">
                {sections.map((section) => {
                    const score = section.score ?? 0;
                    const cefr = getToeflItpCefr(section.score, section.type);
                    const isFocus = focusSectionType === section.type;
                    const maxScale = section.type === 'reading' ? 67 : 68;

                    return (
                        <div
                            key={section.type}
                            className={`rounded-xl p-4 border transition-colors ${
                                isFocus ? 'bg-amber-50/40 border-amber-200/80' : 'bg-slate-50/70 border-slate-100'
                            }`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">{section.label}</span>
                                    {isFocus && (
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                            Focus Area
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2.5">
                                    {section.raw != null && (
                                        <span className="text-xs font-medium text-slate-500">
                                            {section.raw}/{section.total} correct
                                        </span>
                                    )}
                                    <span className="text-base font-black text-slate-900">
                                        {section.score != null ? Math.round(section.score) : '-'}
                                        <span className="text-xs font-semibold text-slate-400">/{maxScale}</span>
                                    </span>
                                    {cefr && (
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cefr.badgeClass}`}>
                                            {cefr.level}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {cefr && <CefrScaleTrack score={score} cefr={cefr} compact />}

                            {cefr && (
                                <p className="mt-1.5 text-[11px] text-slate-500">
                                    {cefr.nextTarget
                                        ? `+${cefr.nextTarget.pointsNeeded} scaled ${cefr.nextTarget.pointsNeeded === 1 ? 'point' : 'points'} to reach CEFR ${cefr.nextTarget.level} (${cefr.thresholds[cefr.nextTarget.level.toLowerCase() as 'a2' | 'b1' | 'b2' | 'c1']}+)`
                                        : `CEFR C1 threshold achieved (${cefr.thresholds.c1}+)`}
                                </p>
                            )}
                        </div>
                    );
                })}
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
    const routeAttemptId = Array.isArray(params?.attemptId) ? params.attemptId[0] : params?.attemptId;
    const resolvedAttemptId = (attemptId && attemptId !== 'undefined' ? attemptId : routeAttemptId)?.trim();
    const allowedTestTypes = user?.preferredExamType ? getTestTypesForExam(user.preferredExamType) : [];

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

    const sections: SectionSummary[] = [
        { type: 'listening', label: 'Listening Comprehension', shortLabel: 'Listening', score: attempt.listeningScore, raw: attempt.listeningRaw, total: 50 },
        { type: 'structure', label: 'Structure and Written Expression', shortLabel: 'Structure & Written', score: attempt.structureScore, raw: attempt.structureRaw, total: 40 },
        { type: 'reading', label: 'Reading Comprehension', shortLabel: 'Reading', score: attempt.readingScore, raw: attempt.readingRaw, total: 50 },
    ];

    // Determine if this is a partial test (only 1 section taken)
    const isPartialTest = !!attempt.practiceSectionType;
    const singleSection = isPartialTest ? sections.find(s => s.type === attempt.practiceSectionType) : null;

    // Identify weakest section for diagnostic focus highlight (only when scores vary)
    const scoredSections = sections.filter((s): s is SectionSummary & { score: number } => s.score != null);
    const minScore = scoredSections.length > 1 ? Math.min(...scoredSections.map(s => s.score)) : null;
    const maxScore = scoredSections.length > 1 ? Math.max(...scoredSections.map(s => s.score)) : null;
    const focusSection = minScore != null && maxScore != null && minScore < maxScore
        ? scoredSections.find(s => s.score === minScore) ?? null
        : null;
    const focusCefr = focusSection ? getToeflItpCefr(focusSection.score, focusSection.type) : null;

    // For partial tests, use the single section's score; for full tests, use overall
    const displayScore = isPartialTest && singleSection
        ? singleSection.score
        : attempt.overallScore;

    const displayLabel = isPartialTest && singleSection
        ? `Your Estimated ${examName} ${singleSection.label} Scaled Score`
        : 'Your Estimated Total Score';

    const displayCefr = getToeflItpCefr(
        displayScore != null ? Number(displayScore) : null,
        isPartialTest && singleSection ? singleSection.type : 'overall'
    );

    const scorePrecision = 0;
    const navyScoreClass = 'text-[#08507f] drop-shadow-[0_4px_12px_rgba(8,80,127,0.16)]';

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back link */}
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <HiArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>

            {/* View Toggle */}
            <div className="flex justify-center">
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
                    {/* Hero + Section Diagnostic Grid */}
                    <div className={isPartialTest ? 'max-w-2xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch'}>
                        {/* Main Score Card */}
                        <div className={`${isPartialTest ? 'text-center' : 'lg:col-span-6 flex flex-col justify-between'} min-w-0 relative overflow-hidden card-premium !rounded-3xl p-7 md:p-8 border border-slate-200/90`}>
                            <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-blue-100/40 blur-2xl" />
                            <div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-slate-100/50 blur-2xl" />

                            <div className={`relative z-10 ${isPartialTest ? 'flex flex-col items-center' : ''}`}>
                                <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-[#08507f]">
                                    Practice Test Result (Unofficial)
                                </div>

                                <p className="text-lg md:text-xl font-semibold text-slate-600">{displayLabel}</p>

                                <div className={`mt-2 flex flex-wrap items-baseline gap-3 ${isPartialTest ? 'justify-center' : ''}`}>
                                    <span className={`font-black text-6xl md:text-7xl tracking-tight ${navyScoreClass}`}>
                                        {formatScore(Number(displayScore), scorePrecision)}
                                    </span>
                                    {displayCefr && (
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-wide ${displayCefr.badgeClass}`}>
                                            CEFR {displayCefr.level} · {displayCefr.descriptor}
                                        </span>
                                    )}
                                </div>

                                {displayCefr && displayScore != null && (
                                    <div className="mt-5 w-full">
                                        <CefrScaleTrack score={Number(displayScore)} cefr={displayCefr} />
                                        <p className="mt-2 text-xs text-slate-500">
                                            {displayCefr.nextTarget
                                                ? `+${displayCefr.nextTarget.pointsNeeded} points to reach CEFR ${displayCefr.nextTarget.level} (${displayCefr.thresholds[displayCefr.nextTarget.level.toLowerCase() as 'a2' | 'b1' | 'b2' | 'c1']}+)`
                                                : `CEFR C1 Proficient threshold achieved (${displayCefr.thresholds.c1}+)`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className={`relative z-10 mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 ${isPartialTest ? 'justify-center' : 'justify-between'}`}>
                                {attempt.completedAt ? (
                                    <p className="text-xs font-medium text-slate-500">Completed on {formatDate(attempt.completedAt)}</p>
                                ) : <span />}
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border border-slate-200 bg-white text-[#08507f] shadow-sm hover:-translate-y-0.5 hover:shadow transition-all"
                                >
                                    <HiShare className="w-3.5 h-3.5" />
                                    Share Result
                                </button>
                            </div>
                        </div>

                        {/* Section Diagnostic Cards */}
                        {!isPartialTest && sections.length > 0 && (
                            <div className="lg:col-span-6 min-w-0 grid grid-rows-3 gap-3.5 h-full">
                                {sections.map((section) => {
                                    const sectionCefr = getToeflItpCefr(section.score, section.type);
                                    const isFocus = focusSection?.type === section.type;
                                    return (
                                        <button
                                            key={section.type}
                                            type="button"
                                            onClick={() => setViewMode('analysis')}
                                            className={`w-full h-full min-w-0 text-left rounded-2xl px-5 py-4 border transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center justify-between gap-4 ${
                                                isFocus
                                                    ? 'bg-amber-50/70 border-amber-200 shadow-sm'
                                                    : 'bg-white border-slate-200/90 shadow-sm'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-[11px] font-bold text-[#08507f] uppercase tracking-wider">
                                                        {section.shortLabel}
                                                    </p>
                                                    {isFocus && (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                                                            Focus Area
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                                                    {section.raw != null && (
                                                        <span>{section.raw}/{section.total} correct</span>
                                                    )}
                                                    {section.raw != null && <span>·</span>}
                                                    <span className="text-[#08507f] font-medium">Review →</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                {sectionCefr && (
                                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sectionCefr.badgeClass}`}>
                                                        CEFR {sectionCefr.level}
                                                    </span>
                                                )}
                                                <span className="text-3xl font-black text-slate-800 tabular-nums w-10 text-right">
                                                    {section.score != null ? Math.round(section.score) : '-'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* CEFR Skill Benchmark */}
                    {!isPartialTest && sections.length > 0 && (
                        <SkillBenchmarkPanel
                            sections={sections}
                            focusSectionType={focusSection?.type ?? null}
                        />
                    )}

                    {/* ── Personalized Course CTA ──────────────────────────── */}
                    <div className="relative overflow-hidden rounded-3xl p-7 md:p-8 text-white shadow-xl border border-slate-900" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', transform: 'translate(20%, -20%)' }} />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner text-amber-400">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                                <div>
                                    {focusSection && focusCefr && (
                                        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                                            <HiOutlineSparkles className="w-3.5 h-3.5" />
                                            Recommended Focus: {focusSection.shortLabel} ({Math.round(focusSection.score)} · CEFR {focusCefr.level})
                                        </div>
                                    )}
                                    <h4 className="text-xl font-black tracking-tight mb-1.5">
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
                                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl font-black transition-all duration-200 text-sm shadow-xl shrink-0 active:scale-95"
                                style={{ color: '#063d61', backgroundColor: '#f59e0b' }}
                            >
                                {t('results_course_cta_btn')}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {!isPartialTest && (
                        <p className="text-center text-xs text-slate-500">
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
                <AnalysisView attempt={attempt} />
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
