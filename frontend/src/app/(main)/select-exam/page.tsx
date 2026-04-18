'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { examConfigs } from '@/config/examConfig';
import { HiOutlineArrowRight } from 'react-icons/hi';

export default function SelectExamPage() {
  const router = useRouter();
  const { user, updateExamPreference } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const config = examConfigs.toefl_itp;

  useEffect(() => {
    if (user?.preferredExamType === 'toefl_itp') {
      router.replace('/dashboard');
    }
  }, [router, user?.preferredExamType]);

  const handleSelectExam = async () => {
    setIsLoading(true);
    try {
      await updateExamPreference('toefl_itp');
      router.replace('/dashboard');
    } catch (error) {
      console.error('Failed to update exam preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            TOEFL ITP Setup
          </h1>
          <p className="text-gray-600 text-lg">
            This platform now focuses only on TOEFL ITP. Continue to set your account to the TOEFL ITP track.
          </p>
        </div>

        <div
          className="rounded-3xl border-2 bg-white p-8 shadow-sm mb-10"
          style={{
            borderColor: config.theme.border,
            boxShadow: `0 10px 30px ${config.theme.primary}12`,
          }}
        >
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${config.theme.gradient}`}>
            <span className="text-white font-bold text-lg">{config.shortName.charAt(0)}</span>
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 mb-2">{config.name}</h3>
          <p className="text-gray-600 mb-5">{config.description}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {config.sections.map((section) => (
              <span
                key={section.key}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: config.theme.heroTint1, color: config.theme.primary }}
              >
                <section.icon className="w-4 h-4 mr-1.5" />
                {section.label}
              </span>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500 mb-1">{config.scoreLabel}</p>
              <p className="text-lg font-semibold text-gray-900">
                {config.scoreRange.min} - {config.scoreRange.max}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500 mb-1">Format</p>
              <p className="text-lg font-semibold text-gray-900">3 sections, 140 questions</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSelectExam}
            disabled={isLoading}
            className="inline-flex items-center px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200"
            style={
              !isLoading
                ? {
                    backgroundColor: config.theme.primary,
                    color: 'white',
                    boxShadow: `0 8px 24px ${config.theme.primary}40`,
                  }
                : { backgroundColor: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' }
            }
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Setting up...
              </>
            ) : (
              <>
                Continue to Dashboard
                <HiOutlineArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
