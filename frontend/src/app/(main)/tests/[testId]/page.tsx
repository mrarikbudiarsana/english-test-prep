'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Test, Section } from '@/types/test';
import { useAuth } from '@/contexts/AuthContext';
import { sectionTypeLabel } from '@/lib/utils';
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
  HiAcademicCap,
} from 'react-icons/hi';
import Link from 'next/link';

const sectionIcons: Record<string, React.ElementType> = {
  listening: HiVolumeUp,
  reading: HiBookOpen,
  writing: HiPencil,
  speaking: HiMicrophone,
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
};

export default function TestOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTest() {
      try {
        const [testRes, sectionsRes] = await Promise.all([
          api.get(`/tests/${testId}`),
          api.get(`/tests/${testId}/sections`),
        ]);
        setTest(testRes.data);
        setSections(sectionsRes.data);
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
      const attemptId = response.data.id;
      router.push(`/tests/${testId}/take?attemptId=${attemptId}&mode=${mode}${sectionType ? `&section=${sectionType}` : ''}`);
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
        className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition-colors group"
      >
        <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Tests
      </Link>

      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 md:p-10 border border-indigo-100/50 shadow-lg shadow-indigo-100/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl -z-0" />

        <div className="relative z-10">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm ${
              test.testType === 'academic'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            }`}>
              <HiAcademicCap className="w-4 h-4" />
              {test.testType === 'general_training' ? 'General Training' : 'Academic'}
            </span>
            {test.isFree && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-sm">
                <HiLockOpen className="w-4 h-4" />
                Free
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur text-slate-700 rounded-xl text-sm font-semibold border border-slate-200/50">
              <HiClock className="w-4 h-4" />
              {test.durationMinutes} minutes
            </span>
          </div>

          {/* Title & Description */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            {test.title}
          </h1>
          {test.description && (
            <p className="text-slate-600 text-lg max-w-2xl leading-relaxed">
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
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200/50">
            <HiPlay className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Full Test</h2>
            <p className="text-slate-600 leading-relaxed">
              Take the complete IELTS test with all 4 sections in order. Timer will run for each section to simulate real exam conditions.
            </p>
          </div>
        </div>
        <button
          onClick={() => handleStartTest('full')}
          disabled={starting}
          className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50"
        >
          <HiPlay className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {starting ? 'Starting...' : 'Start Full Test'}
        </button>
      </div>

      {/* Section Practice */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <HiSparkles className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-800">Practice by Section</h2>
        </div>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Focus on specific skills by practicing individual sections. Perfect for targeted improvement.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['listening', 'reading', 'writing', 'speaking'] as const).map((type) => {
            const Icon = sectionIcons[type];
            const colors = sectionColors[type];
            const typeSections = sectionGroups[type] || [];
            const totalDuration = typeSections.reduce((sum, s) => sum + s.durationMinutes, 0);
            const questionCount = type === 'listening' || type === 'reading' ? 40 : undefined;
            const isAvailable = typeSections.length > 0;

            return (
              <div
                key={type}
                className={`group bg-white rounded-2xl border-2 p-6 transition-all ${
                  isAvailable
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
                      {typeSections.length} {typeSections.length === 1 ? 'part' : 'parts'}
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

                <button
                  onClick={() => handleStartTest('section_practice', type)}
                  disabled={starting || !isAvailable}
                  className={`w-full px-5 py-2.5 rounded-xl font-semibold transition-all ${
                    isAvailable
                      ? `${colors.text} ${colors.light} hover:bg-gradient-to-r hover:${colors.bg} hover:text-white border-2 ${colors.border}`
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isAvailable ? 'Practice' : 'Not Available'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            💡
          </div>
          <div>
            <h3 className="font-bold text-slate-800 mb-2">Preparation Tips</h3>
            <ul className="text-sm text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
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
