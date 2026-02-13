'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ExamType } from '@/types/user';
import { examConfigs, getAllExamTypes } from '@/config/examConfig';
import { HiOutlineCheckCircle, HiOutlineArrowRight } from 'react-icons/hi';

export default function SelectExamPage() {
  const router = useRouter();
  const { user, updateExamPreference } = useAuth();
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(
    user?.preferredExamType || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectExam = async () => {
    if (!selectedExam) return;

    setIsLoading(true);
    try {
      await updateExamPreference(selectedExam);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to update exam preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const examTypes = getAllExamTypes();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Choose Your Exam
          </h1>
          <p className="text-gray-600 text-lg">
            Select the exam you&apos;re preparing for. You can change this anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {examTypes.map((examType) => {
            const config = examConfigs[examType];
            const isSelected = selectedExam === examType;

            return (
              <button
                key={examType}
                onClick={() => setSelectedExam(examType)}
                className="relative p-6 rounded-2xl border-2 text-left transition-all duration-200 bg-white hover:shadow-md"
                style={{
                  borderColor: isSelected ? config.theme.primary : '#e5e7eb',
                  backgroundColor: isSelected ? config.theme.heroTint1 : 'white',
                  boxShadow: isSelected ? `0 4px 20px ${config.theme.primary}20` : undefined,
                }}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <HiOutlineCheckCircle className="w-6 h-6" style={{ color: config.theme.primary }} />
                  </div>
                )}

                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${config.theme.gradient}`}
                >
                  <span className="text-white font-bold text-lg">
                    {config.shortName.charAt(0)}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {config.name}
                </h3>

                <p className="text-gray-600 text-sm mb-4">
                  {config.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {config.sections.map((section) => (
                    <span
                      key={section.key}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      <section.icon className="w-3.5 h-3.5 mr-1" />
                      {section.label}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: isSelected ? config.theme.border : '#f3f4f6' }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{config.scoreLabel}</span>
                    <span className="font-medium" style={{ color: isSelected ? config.theme.primary : '#111827' }}>
                      {config.scoreRange.min} – {config.scoreRange.max}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSelectExam}
            disabled={!selectedExam || isLoading}
            className="inline-flex items-center px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200"
            style={
              selectedExam && !isLoading
                ? {
                    backgroundColor: examConfigs[selectedExam].theme.primary,
                    color: 'white',
                    boxShadow: `0 8px 24px ${examConfigs[selectedExam].theme.primary}40`,
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
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
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
