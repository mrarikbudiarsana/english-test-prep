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
} from 'react-icons/hi';

const sectionIcons: Record<string, React.ElementType> = {
  listening: HiVolumeUp,
  reading: HiBookOpen,
  writing: HiPencil,
  speaking: HiMicrophone,
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
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Test not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
        {test.description && (
          <p className="mt-2 text-gray-500">{test.description}</p>
        )}
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <HiClock className="w-4 h-4 mr-1" />
            {test.durationMinutes} minutes total
          </span>
          <span className="capitalize px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
            {test.testType === 'general_training' ? 'General Training' : 'Academic'}
          </span>
          {test.isFree && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
              Free
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Start Full Test Button */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Full Test</h2>
        <p className="text-gray-500 text-sm mb-4">
          Take the complete IELTS test with all 4 sections in order. Timer will run for each section.
        </p>
        <button
          onClick={() => handleStartTest('full')}
          disabled={starting}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          <HiPlay className="w-5 h-5 mr-2" />
          {starting ? 'Starting...' : 'Start Full Test'}
        </button>
      </div>

      {/* Section Practice */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Practice by Section</h2>
        <div className="space-y-3">
          {(['listening', 'reading', 'writing', 'speaking'] as const).map((type) => {
            const Icon = sectionIcons[type];
            const typeSections = sectionGroups[type] || [];
            const totalDuration = typeSections.reduce((sum, s) => sum + s.durationMinutes, 0);
            const questionCount = type === 'listening' || type === 'reading' ? 40 : undefined;

            return (
              <div
                key={type}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{sectionTypeLabel(type)}</h3>
                    <p className="text-sm text-gray-500">
                      {totalDuration} min
                      {questionCount && ` - ${questionCount} questions`}
                      {typeSections.length > 0 && ` - ${typeSections.length} parts`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartTest('section_practice', type)}
                  disabled={starting || typeSections.length === 0}
                  className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  Practice
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
