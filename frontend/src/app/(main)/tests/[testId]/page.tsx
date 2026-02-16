'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import Link from 'next/link';

type AccessCheckResult = {
  canAccess: boolean;
  reason: 'free_test' | 'has_subscription' | 'has_free_tests' | 'no_access' | 'test_not_found';
  freeTestsRemaining?: number;
  requiredExamType?: string;
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
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [access, setAccess] = useState<AccessCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const examName = test ? examNameFromTestType(test.testType) : 'English';
  const fullSectionCount = test ? sectionCountForTestType(test.testType) : 4;
  const badgeLabel = test ? testTypeShortLabel(test.testType) : '';
  const brandColor =
    test?.testType === 'toefl_ibt' ? '#7B6FD4'
      : test?.testType === 'toefl_itp' ? '#5848B8'
        : test?.testType === 'pte_academic' ? '#0097A7'
          : '#e4002b';

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

  const handleStartTest = async (mode: 'full' | 'section_practice', sectionType?: string) => {
    setStarting(true);
    try {
      const response = await api.post('/attempts', {
        testId,
        mode,
        practiceSectionType: sectionType,
      });
      const attemptId =
        (response.data as any)?.data?.id ||
        (response.data as any)?.id ||
        (response.data as any)?.data?.attemptId ||
        (response.data as any)?.attemptId;

      if (!attemptId || attemptId === 'undefined') {
        console.error('Failed to get attempt ID from response:', response.data);
        throw new Error('Invalid server response');
      }

      router.push(`/tests/${testId}/take?attemptId=${encodeURIComponent(attemptId)}&mode=${mode}${sectionType ? `&section=${sectionType}` : ''}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start test');
      setStarting(false);
    }
  };

  // Group sections by type for display
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

  if (!test) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HiAcademicCap className="w-10 h-10 text-slate-300" />
        </div>
        <p className="text-slate-500 font-semibold">Test not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Back Button */}
      <Link
        href="/tests"
        className="inline-flex items-center gap-2 text-[#5a6c7d] font-semibold transition-colors group"
        style={{ color: '#5a6c7d' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = brandColor; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#5a6c7d'; }}
      >
        <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Tests
      </Link>

      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#f8f9fa] to-[#f0f9ff] rounded-3xl p-8 md:p-10 border border-[#e8ecef] shadow-lg shadow-[#e8ecef]/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#e8f4f8]/40 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ffe5ea]/30 rounded-full blur-3xl -z-0" />

        <div className="relative z-10">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm text-white"
              style={{ backgroundColor: brandColor }}
            >
              <HiAcademicCap className="w-4 h-4" />
              {badgeLabel}
            </span>
            {test.isFree && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-sm">
                <HiLockOpen className="w-4 h-4" />
                Free
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur text-[#2c3e50] rounded-xl text-sm font-semibold border border-[#e8ecef]">
              <HiClock className="w-4 h-4" />
              {test.durationMinutes} minutes
            </span>
          </div>

          {/* Title & Description */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#2c3e50] mb-3">
            {test.title}
          </h1>
          {test.description && (
            <p className="text-[#5a6c7d] text-lg max-w-2xl leading-relaxed">
              {test.description}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            ⚠️
          </div>
          {error}
        </div>
      )}

      {/* Start Full Test Card */}
      <div className="bg-white rounded-2xl border-2 border-[#e8ecef] p-8 shadow-sm hover:shadow-lg transition-all">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ backgroundColor: access?.canAccess ? brandColor : '#94a3b8', boxShadow: `0 10px 25px ${access?.canAccess ? brandColor : '#94a3b8'}33` }}
          >
            {access?.canAccess ? (
              <HiPlay className="w-7 h-7 text-white" />
            ) : (
              <HiLockClosed className="w-7 h-7 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">Full Test</h2>
            <p className="text-[#5a6c7d] leading-relaxed">
              Take the complete {examName} test with all {fullSectionCount} sections in order. Timer will run for each section to simulate real exam conditions.
            </p>
          </div>
        </div>

        {access?.canAccess ? (
          <>
            {access.reason === 'has_free_tests' && (
              <p className="text-sm text-amber-600 mb-4 flex items-center gap-2">
                <HiSparkles className="w-4 h-4" />
                This will use 1 of your {access.freeTestsRemaining} free tests remaining
              </p>
            )}
            <button
              onClick={() => handleStartTest('full')}
              disabled={starting}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: brandColor, boxShadow: `0 10px 25px ${brandColor}33` }}
            >
              <HiPlay className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {starting ? 'Starting...' : 'Start Full Test'}
            </button>
          </>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HiLockClosed className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 mb-1">Premium Test</h3>
                <p className="text-sm text-amber-700">
                  Subscribe to access this test or use your free tests.
                  {access?.freeTestsRemaining === 0 && ' You have no free tests remaining.'}
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
            >
              <HiSparkles className="w-5 h-5" />
              View Subscription Plans
            </Link>
          </div>
        )}
      </div>

      {/* Section Practice */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <HiSparkles className="w-6 h-6" style={{ color: brandColor }} />
          <h2 className="text-2xl font-bold text-[#2c3e50]">Practice by Section</h2>
        </div>
        <p className="text-[#5a6c7d] mb-6 leading-relaxed">
          Focus on specific skills by practicing individual sections. Perfect for targeted improvement.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              const questionCount = type === 'listening' || type === 'reading' || type === 'structure' ? 40 : undefined; // Approximate for structure
              const isAvailable = typeSections.length > 0;
              const displayedPartCount =
                test.testType === 'toefl_itp'
                  ? (toeflCanonicalParts[type] ?? typeSections.length)
                  : typeSections.length;

              return (
                <div
                  key={type}
                  className={`group bg-white rounded-2xl border-2 p-6 transition-all ${isAvailable
                    ? `${colors.border} hover:shadow-lg hover:border-opacity-100 border-opacity-30`
                    : 'border-slate-200 opacity-60'
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center ${isAvailable ? 'group-hover:scale-110' : ''} transition-transform`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {isAvailable && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {displayedPartCount} {displayedPartCount === 1 ? 'part' : 'parts'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    {sectionTypeLabel(type)}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 flex items-center gap-2">
                    <HiClock className="w-4 h-4" />
                    {totalDuration} minutes
                    {questionCount && ` • ${questionCount} questions`}
                  </p>

                  {access?.canAccess ? (
                    <button
                      onClick={() => handleStartTest('section_practice', type)}
                      disabled={starting || !isAvailable}
                      className={`w-full px-5 py-2.5 rounded-xl font-semibold transition-all ${isAvailable
                        ? `${colors.text} ${colors.light} hover:bg-gradient-to-r hover:${colors.bg} hover:text-white border-2 ${colors.border}`
                        : 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed'
                        }`}
                    >
                      {isAvailable ? 'Practice' : 'Not Available'}
                    </button>
                  ) : (
                    <Link
                      href="/pricing"
                      className="w-full px-5 py-2.5 rounded-xl font-semibold transition-all bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200"
                    >
                      <HiLockClosed className="w-4 h-4" />
                      Upgrade to Practice
                    </Link>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-[#e8f4f8] to-white rounded-2xl p-6 border border-[#e8ecef]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#e8f4f8] rounded-xl flex items-center justify-center flex-shrink-0">
            💡
          </div>
          <div>
            <h3 className="font-bold text-[#2c3e50] mb-2">Preparation Tips</h3>
            <ul className="text-sm text-[#5a6c7d] space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#3b82f6] font-bold">•</span>
                <span>Ensure you have a stable internet connection before starting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Find a quiet environment to minimize distractions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>For best results, simulate real exam conditions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
