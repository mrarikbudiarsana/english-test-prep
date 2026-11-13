'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Test, Section } from '@/types/test';
import { sectionTypeLabel, testTypeShortLabel, examNameFromTestType, sectionCountForTestType } from '@/lib/utils';
import {
  HiClock,
  HiVolumeUp,
  HiBookOpen,
  HiPencil,
  HiMicrophone,
  HiPlay,
  HiChevronLeft,
  HiSparkles,
  HiLockOpen,
  HiLockClosed,
  HiAcademicCap,
} from 'react-icons/hi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import TestCreditGateModal from '@/components/test/TestCreditGateModal';
import Link from 'next/link';

type AccessCheckResult = {
  canAccess: boolean;
  reason: 'free_test' | 'has_credits' | 'no_credits' | 'has_subscription' | 'no_access' | 'test_not_found';
  activeAttemptId?: string;
  requiredExamType?: string;
  creditsRemaining?: number;
};

const TOEFL_ITP_FORMAT = {
  totalQuestions: 140,
  totalMinutes: 115,
  sections: {
    listening: { questions: 50, minutes: 35, parts: 3, note: 'Audio plays once only' },
    structure: { questions: 40, minutes: 25, parts: 2, note: 'Sentence completion and error recognition' },
    reading: { questions: 50, minutes: 55, parts: 1, note: 'Line-numbered academic passages' },
  },
};

const sectionIcons: Record<string, React.ElementType> = {
  listening: HiVolumeUp,
  reading: HiBookOpen,
  writing: HiPencil,
  speaking: HiMicrophone,
  structure: HiPencil, // Structure logic/grammar
};

const sectionColors = {
  listening: {
    bg: 'from-blue-500 to-cyan-500',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  reading: {
    bg: 'from-violet-500 to-purple-500',
    light: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-600',
    iconBg: 'bg-violet-100',
  },
  writing: {
    bg: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  speaking: {
    bg: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  structure: {
    bg: 'from-indigo-500 to-purple-500',
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
  },
};

export default function TestOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [access, setAccess] = useState<AccessCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [autoStarted, setAutoStarted] = useState(false);

  // Credit Gate Modal State
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<{ mode: 'full' | 'section_practice'; sectionType?: string }>({
    mode: 'full',
  });

  const [mode, setMode] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    setMode(modeParam);
  }, [searchParams]);

  const examName = test ? examNameFromTestType(test.testType) : 'TOEFL ITP';
  const fullSectionCount = test ? sectionCountForTestType(test.testType) : 3;
  const badgeLabel = test ? testTypeShortLabel(test.testType) : '';

  useEffect(() => {
    async function fetchTest() {
      try {
        const [testRes, sectionsRes, accessRes] = await Promise.all([
          api.get(`/tests/${testId}`),
          api.get(`/tests/${testId}/sections`),
          api.get(`/tests/${testId}/access`),
        ]);
        setTest(testRes.data);
        setSections(sectionsRes.data);
        setAccess(accessRes.data?.data || accessRes.data);
      } catch {
        setError('Failed to load test');
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [testId]);

  const executeStartAttempt = useCallback(async (
    startMode: 'full' | 'section_practice',
    sectionType?: string,
    email?: string
  ) => {
    setStarting(true);
    
    try {
      const response = await api.post('/attempts', {
        testId,
        mode: startMode,
        practiceSectionType: sectionType,
        email: email || user?.email,
      });
      const resData = (response.data as any)?.data || (response.data as any);
      const attemptId = resData?.id || resData?.attemptId;

      if (!attemptId || attemptId === 'undefined') {
        console.error('Failed to get attempt ID from response:', response.data);
        throw new Error('Invalid server response');
      }

      if (resData?.creditsRemaining !== undefined) {
        toast.success(`Test started! 1 test credit deducted (${resData.creditsRemaining} remaining).`);
      } else {
        toast.success('Test started! Good luck.');
      }

      router.push(`/tests/${testId}/take?attemptId=${encodeURIComponent(attemptId)}&mode=${startMode}${sectionType ? `&section=${sectionType}` : ''}`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || 'Failed to start test';
      setError(errMsg);
      setStarting(false);
      throw err;
    }
  }, [testId, user?.email, router]);

  const handleStartClick = useCallback((startMode: 'full' | 'section_practice', sectionType?: string) => {
    // If there is an active attempt in progress, resume directly
    if (access?.activeAttemptId) {
      executeStartAttempt(startMode, sectionType);
      return;
    }

    // If it's a free test, start immediately
    if (test?.isFree) {
      executeStartAttempt(startMode, sectionType);
      return;
    }

    // Otherwise, open the email credit gate modal
    setPendingStart({ mode: startMode, sectionType });
    setIsGateOpen(true);
  }, [access?.activeAttemptId, test?.isFree, executeStartAttempt]);

  const handleStartTest = handleStartClick;

  useEffect(() => {
    if (!loading && test && access?.canAccess && !autoStarted) {
      const sectionType = searchParams.get('section');
      if (sectionType) {
        setAutoStarted(true);
        handleStartTest('section_practice', sectionType);
      }
    }
  }, [loading, test, access, autoStarted, searchParams, handleStartTest]);

  const sectionGroups = sections.reduce((acc, section) => {
    if (!acc[section.sectionType]) {
      acc[section.sectionType] = [];
    }
    acc[section.sectionType].push(section);
    return acc;
  }, {} as Record<string, Section[]>);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-10 bg-slate-100 rounded-lg w-1/3" />
        <div className="h-48 bg-slate-100 rounded-3xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (starting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#08507f]"></div>
          <div className="absolute h-8 w-8 rounded-full bg-slate-50"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 animate-pulse">
          {t('test_preparing_practice')}
        </h2>
        <p className="text-sm text-slate-500">
          {t('test_preparing_wait')}
        </p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HiAcademicCap className="w-10 h-10 text-slate-300" />
        </div>
        <p className="text-slate-500 font-semibold">{t('test_overview_test_not_found')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link
        href={mode === 'practice' ? '/tests?tab=sections' : '/tests?tab=full'}
        className="inline-flex items-center gap-2 text-slate-500 text-sm font-semibold transition-colors hover:text-[#08507f] group"
      >
        <HiChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t('test_overview_back')}
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#e8f4fd] text-[#08507f] text-xs font-bold uppercase tracking-wide">
            <HiAcademicCap className="w-3.5 h-3.5" />
            {badgeLabel}
          </span>
          {test.isFree && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide">
              <HiLockOpen className="w-3.5 h-3.5" />
              {t('test_overview_free')}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
            <HiClock className="w-3.5 h-3.5" />
            {test.durationMinutes} {t('tests_min_label')}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          {test.title}
        </h1>
        {test.description && (
          <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
            {test.description}
          </p>
        )}
      </div>

      {error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            ⚠️
          </div>
          {error}
        </div>
      )}

      {(mode === 'full' || !mode) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-start gap-4 mb-5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: access?.canAccess ? '#08507f' : '#94a3b8' }}
            >
              {access?.canAccess ? (
                <HiPlay className="w-5 h-5 text-white" />
              ) : (
                <HiLockClosed className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">{t('test_overview_full_test')}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('test_overview_full_desc')}
              </p>
            </div>
          </div>

          {access?.canAccess ? (
            <>
              <button
                onClick={() => handleStartTest('full')}
                disabled={starting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#08507f] text-white text-sm font-bold hover:bg-[#063d61] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {access.activeAttemptId ? (
                  <>
                    <HiSparkles className="w-4 h-4" />
                    {starting ? t('test_overview_starting') : 'Resume Test'}
                  </>
                ) : (
                  <>
                    <HiPlay className="w-4 h-4" />
                    {starting ? t('test_overview_starting') : t('test_overview_start_full')}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <HiLockClosed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Mock Test Credit Required</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Starting this test requires 1 test credit. If you already purchased on Lynk.id, enter your checkout email to start.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleStartTest('full')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#08507f] text-white text-xs font-bold hover:bg-[#063d61] transition-all shadow-md active:scale-95"
                >
                  <HiPlay className="w-4 h-4" />
                  Enter Email to Start Test
                </button>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <HiSparkles className="w-3.5 h-3.5 text-amber-500" />
                  Buy Credits on Lynk.id
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {(mode === 'practice' || !mode) && (
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <HiSparkles className="w-5 h-5 text-[#08507f]" />
            <h2 className="text-xl font-bold text-slate-900">{t('test_overview_practice_by_section')}</h2>
          </div>
          <p className="text-slate-500 text-sm mb-5 leading-relaxed">
            {t('test_overview_practice_desc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const sectionOrder = test.testType === 'toefl_itp'
                ? ['listening', 'structure', 'reading'] as const
                : ['listening', 'reading', 'writing', 'speaking'] as const;
              const toeflCanonicalParts: Partial<Record<(typeof sectionOrder)[number], number>> = {
                listening: 3,
                structure: 2,
                reading: 1,
              };

              return sectionOrder.map((type) => {
                const Icon = sectionIcons[type];
                const colors = sectionColors[type];
                const typeSections = sectionGroups[type] || [];
                const totalDuration = typeSections.reduce((sum, s) => sum + s.durationMinutes, 0);
                const toeflMeta =
                  test.testType === 'toefl_itp' && type in TOEFL_ITP_FORMAT.sections
                    ? TOEFL_ITP_FORMAT.sections[type as keyof typeof TOEFL_ITP_FORMAT.sections]
                    : undefined;
                const questionCount =
                  test.testType === 'toefl_itp' ? toeflMeta?.questions : undefined;
                const isAvailable = typeSections.length > 0;
                const displayedPartCount =
                  test.testType === 'toefl_itp'
                    ? (toeflCanonicalParts[type] ?? typeSections.length)
                    : typeSections.length;

                return (
                  <div
                    key={type}
                    className={`group rounded-xl border bg-white p-5 transition-all duration-200 ${
                      isAvailable
                        ? 'border-slate-200 hover:border-[#08507f] hover:shadow-md'
                        : 'border-slate-200 opacity-60'
                    }`}
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      {isAvailable && (
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wide">
                          {displayedPartCount} {displayedPartCount === 1 ? 'part' : 'parts'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {sectionTypeLabel(type)}
                    </h3>
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                      <HiClock className="w-3.5 h-3.5" />
                      {totalDuration} min{questionCount && ` · ${questionCount} questions`}
                    </p>
                    {test.testType === 'toefl_itp' && isAvailable && (
                      <p className="mb-4 text-[11px] text-slate-400">
                        {type === 'listening' && t('test_overview_listening_note')}
                        {type === 'structure' && t('test_overview_structure_note')}
                        {type === 'reading' && t('test_overview_reading_note')}
                      </p>
                    )}

                    {access?.canAccess ? (
                      <button
                        onClick={() => handleStartTest('section_practice', type)}
                        disabled={starting || !isAvailable}
                        className={`mt-3 w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                          isAvailable
                            ? 'bg-[#e8f4fd] text-[#08507f] hover:bg-[#08507f] hover:text-white border border-[#08507f]/20'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? t('test_overview_practice_btn') : t('test_overview_not_available')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTest('section_practice', type)}
                        disabled={starting || !isAvailable}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 rounded-lg bg-[#e8f4fd] text-[#08507f] hover:bg-[#08507f] hover:text-white border border-[#08507f]/20 text-xs font-bold transition-colors shadow-sm"
                      >
                        <HiPlay className="w-3.5 h-3.5" />
                        {t('test_overview_practice_btn')} (1 Credit)
                      </button>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#e8f4fd] text-[#08507f]">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">{t('test_overview_before_begin')}</h3>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-500 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-px text-[#08507f] font-black">·</span>
            <span>{t('test_overview_tip_internet')}</span>
          </li>
          {test.testType === 'toefl_itp' && (
            <li className="flex items-start gap-2">
              <span className="mt-px text-[#08507f] font-black">·</span>
              <span>{t('test_overview_tip_listening')}</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="mt-px text-[#08507f] font-black">·</span>
            <span>{t('test_overview_tip_quiet')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-px text-[#08507f] font-black">·</span>
            <span>{t('test_overview_tip_simulate')}</span>
          </li>
        </ul>
      </div>

      {/* ── Test Credit Gate Modal ────────────────────────────── */}
      <TestCreditGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        defaultEmail={user?.email || ''}
        testTitle={test.title}
        mode={pendingStart.mode}
        sectionType={pendingStart.sectionType}
        isFree={test.isFree}
        onConfirmStart={async (email) => {
          await executeStartAttempt(pendingStart.mode, pendingStart.sectionType, email);
        }}
      />
    </div>
  );
}
