'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Attempt, AttemptStatus, TestType } from '@/types/test';
import { PaginatedResponse } from '@/types/api';
import { formatBand, formatDate, getBandColor, getBandBgColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getTestTypesForExam, getExamConfig } from '@/config/examConfig';
import { ExamType } from '@/types/user';
import {
  HiArrowLeft,
  HiChartBar,
  HiClock,
  HiCheckCircle,
  HiFilter,
  HiTrendingUp,
  HiTrendingDown,
} from 'react-icons/hi';

type FilterStatus = 'all' | AttemptStatus;
type SortBy = 'date' | 'score';

export default function ResultsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);
  const limit = 10;

  // Determine config based on user preference or default to IELTS (preserves existing behavior)
  const userExamType = user?.preferredExamType || 'ielts';
  const { theme, scoreLabel, sections: examSections } = getTestTypesForExam(userExamType).length ? getExamConfig(userExamType) : getExamConfig('ielts');

  const allowedTestTypes = useMemo(
    () => (user?.preferredExamType ? getTestTypesForExam(user.preferredExamType) : []),
    [user?.preferredExamType]
  );
  const queryTestType = searchParams.get('testType') as TestType | null;
  const activeTestType =
    queryTestType && allowedTestTypes.includes(queryTestType)
      ? queryTestType
      : null;

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Attempt>>('/attempts', {
        params: {
          offset,
          limit,
          examType: user?.preferredExamType,
          ...(activeTestType ? { testType: activeTestType } : {}),
        }
      });

      let filteredAttempts = res.data.data;
      const allowedSet = new Set(allowedTestTypes);
      if (allowedSet.size > 0) {
        filteredAttempts = filteredAttempts.filter((a) =>
          a.test?.testType ? allowedSet.has(a.test.testType) : false
        );
      }

      // Filter by status
      if (filterStatus !== 'all') {
        filteredAttempts = filteredAttempts.filter(a => a.status === filterStatus);
      }

      // Sort
      if (sortBy === 'date') {
        filteredAttempts.sort((a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
      } else if (sortBy === 'score') {
        filteredAttempts.sort((a, b) => {
          const scoreA = a.overallBand ?? a.overallScore ?? 0;
          const scoreB = b.overallBand ?? b.overallScore ?? 0;
          return scoreB - scoreA;
        });
      }

      setAttempts(filteredAttempts);
      setTotal(res.data.total);
    } catch {
      console.error('Failed to fetch attempts');
    } finally {
      setLoading(false);
    }
  }, [offset, filterStatus, sortBy, user?.preferredExamType, activeTestType, allowedTestTypes]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  async function handleDeleteAttempt(attemptId: string) {
    if (!window.confirm('Delete this in-progress attempt? This cannot be undone.')) {
      return;
    }

    setDeletingAttemptId(attemptId);
    try {
      await api.delete(`/attempts/${attemptId}`);
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      console.error('Failed to delete attempt');
      alert('Failed to delete attempt. Please try again.');
    } finally {
      setDeletingAttemptId(null);
    }
  }

  function getStatusBadge(status: AttemptStatus) {
    const styles = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
      scoring: 'bg-amber-50 text-amber-700 border-amber-200',
      abandoned: 'bg-gray-50 text-gray-600 border-gray-200',
    };

    const labels = {
      completed: 'Completed',
      in_progress: 'In Progress',
      scoring: 'Scoring',
      abandoned: 'Abandoned',
    };

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  }

  function getScoreChange(index: number) {
    if (index >= attempts.length - 1) return null;
    const current = attempts[index].overallBand ?? attempts[index].overallScore;
    const previous = attempts[index + 1].overallBand ?? attempts[index + 1].overallScore;

    if (current === null || current === undefined || previous === null || previous === undefined) return null;

    const change = current - previous;
    if (Math.abs(change) < 0.1) return null;

    return change;
  }

  // Helper to get score display
  const getDisplayScore = (attempt: Attempt) => {
    const val = attempt.overallBand ?? attempt.overallScore;
    return val !== null && val !== undefined ? val : null;
  };

  const getReviewText = (hasScore: boolean) => hasScore
    ? (userExamType === 'toefl_itp' ? 'View Score Report' : 'Review Results')
    : 'View Details';

  if (loading && attempts.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-16 bg-gray-200 rounded-xl" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-[#5a6c7d] hover:text-[#2c3e50] mb-3"
          >
            <HiArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#2c3e50]">Test Results</h1>
          <p className="text-[#5a6c7d] mt-1">
            Review your performance and track your progress over time
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className="rounded-xl p-6 border border-[#e8ecef]"
            style={{ backgroundColor: `${theme.secondary}50` }} // 50% opacity
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: theme.secondary, color: theme.primary }}
              >
                <HiCheckCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-[#5a6c7d] mb-1">Total Tests</p>
            <p className="text-3xl font-bold text-[#2c3e50]">{total}</p>
          </div>

          <div className="bg-emerald-50/50 rounded-xl p-6 border border-[#e8ecef]">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <HiTrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-[#5a6c7d] mb-1">Highest Score</p>
            <p className="text-3xl font-bold text-[#2c3e50]">
              {attempts.some(a => getDisplayScore(a) !== null)
                ? Math.max(...attempts.map(a => Number(getDisplayScore(a) || 0))).toFixed(userExamType === 'ielts' ? 1 : 0)
                : '-'}
            </p>
          </div>

          <div className="bg-amber-50/50 rounded-xl p-6 border border-[#e8ecef]">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <HiChartBar className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-[#5a6c7d] mb-1">Average Score</p>
            <p className="text-3xl font-bold text-[#2c3e50]">
              {(() => {
                const scoredAttempts = attempts.filter(a => getDisplayScore(a) !== null);
                if (scoredAttempts.length === 0) return '-';
                const sum = scoredAttempts.reduce((acc, a) => acc + Number(getDisplayScore(a)), 0);
                return (sum / scoredAttempts.length).toFixed(userExamType === 'ielts' ? 1 : 0);
              })()}
            </p>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-xl p-4 border border-[#e8ecef]">
        <div className="flex items-center gap-3">
          <HiFilter className="w-5 h-5 text-[#5a6c7d]" />
          <div className="flex gap-2">
            {(['all', 'completed', 'in_progress', 'scoring'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                  ? 'text-white shadow-sm'
                  : 'bg-[#f8f9fa] text-[#5a6c7d] hover:bg-[#e8ecef]'
                  }`}
                style={filterStatus === status ? { backgroundColor: theme.primary } : {}}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[#5a6c7d]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-2 bg-[#f8f9fa] border border-[#e8ecef] rounded-lg text-sm font-medium text-[#2c3e50] focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
          >
            <option value="date">Most Recent</option>
            <option value="score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      {attempts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#e8ecef]">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto border"
            style={{ backgroundColor: theme.secondary, borderColor: `${theme.primary}33` }}
          >
            <HiChartBar className="h-8 w-8" style={{ color: theme.primary }} />
          </div>
          <h3 className="text-xl font-bold text-[#2c3e50] mb-2">No test results yet</h3>
          <p className="text-[#5a6c7d] mb-6">
            Start practicing to track your progress and see detailed feedback
          </p>
          <Link
            href="/tests"
            className="inline-flex items-center px-6 py-3 text-white rounded-xl font-semibold transition-all shadow-lg"
            style={{ backgroundColor: theme.primary, boxShadow: `0 10px 15px -3px ${theme.secondary}` }}
          >
            Browse Tests
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt, index) => {
            const scoreChange = getScoreChange(index);
            const score = getDisplayScore(attempt);
            const isToeflItp = attempt.test?.testType === 'toefl_itp';

            // Determine border color for score badge
            let scoreBorderColor = 'border-amber-300';
            let scoreTextColor = 'text-[#5a6c7d]';
            let scoreBgColor = '#f8f9fa';

            if (score !== null) {
              // For IELTS, logic uses band levels. For TOEFL, we might just use primary/theme colors or generic ranges
              if (isToeflItp) {
                scoreTextColor = theme.primary; // Dynamic text color
                scoreBgColor = theme.secondary;
                if (Number(score) >= 600) scoreBorderColor = 'border-emerald-300';
                else if (Number(score) >= 500) scoreBorderColor = 'border-blue-300';
              } else {
                // Fallback to utils for IELTS/others
                scoreBgColor = getBandBgColor(Number(score)); // This util might return tailwind classes. If so, fine.
                // Actually getBandBgColor returns tailwind classes like 'bg-red-50'
                // But since we want to respect the user's "Don't touch other tests", 
                // we should probably stick to the util functions for IELTS. DANGER: check utils implementation? 
                // The original code used: 
                // attempt.overallBand ? `${getBandBgColor(attempt.overallBand)} ${attempt.overallBand >= 7 ? 'border-emerald-300' : ...}` : ...
              }
            }

            return (
              <Link
                key={attempt.id}
                href={`/results/${attempt.id}`}
                className="block bg-white rounded-xl border border-[#e8ecef] hover:shadow-lg transition-all group"
                style={{ borderColor: 'transparent' }} // use hover effect class or just default
              >
                <div className="p-6 border border-[#e8ecef] rounded-xl hover:border-opacity-50 transition-colors"
                  style={{ borderColor: '#e8ecef' }} // Using style to avoid overriding tailwind hover?
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${theme.primary}4D`; }} // 30%
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8ecef'; }}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Score Badge */}
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center font-bold transition-all border-2 ${!isToeflItp && score
                            ? `${getBandBgColor(Number(score))} ${Number(score) >= 7 ? 'border-emerald-300' : Number(score) >= 5 ? 'border-blue-300' : 'border-amber-300'}`
                            : 'bg-[#f8f9fa] border-[#e8ecef]'
                          }`}
                        style={
                          isToeflItp && score ? {
                            backgroundColor: theme.secondary,
                            color: theme.primary,
                            borderColor: Number(score) >= 600 ? '#86efac' : Number(score) >= 500 ? '#93c5fd' : '#fcd34d'
                          } : { /* Handled by classes for IELTS */ }
                        }
                      >
                        {score !== null ? (
                          <>
                            <span
                              className={`text-2xl ${!isToeflItp && score ? getBandColor(Number(score)) : ''}`}
                              style={isToeflItp ? { color: theme.primary } : {}}
                            >
                              {isToeflItp && !attempt.overallScore && attempt.status === 'completed' ? score : (isToeflItp ? score : formatBand(Number(score)))}
                            </span>
                            <span className="text-xs text-[#5a6c7d] font-medium">
                              {isToeflItp ? 'Score' : 'Overall'}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#5a6c7d] text-xs text-center px-2">
                            {attempt.status === 'scoring' ? 'Scoring...' : 'No score'}
                          </span>
                        )}
                      </div>

                      {/* Test Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3
                            className="text-lg font-bold text-[#2c3e50] transition-colors"
                            style={{ color: '#2c3e50' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = theme.primary; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#2c3e50'; }}
                          >
                            {attempt.test?.title || 'Untitled Test'}
                          </h3>
                          {scoreChange !== null && (
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${scoreChange > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                              {scoreChange > 0 ? (
                                <HiTrendingUp className="w-3 h-3" />
                              ) : (
                                <HiTrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(Number(scoreChange)).toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#5a6c7d] mb-3">
                          <span className="flex items-center gap-1.5">
                            <HiClock className="w-4 h-4" />
                            {formatDate(attempt.completedAt || attempt.startedAt)}
                          </span>
                          <span className="text-[#e8ecef]">•</span>
                          <span className="capitalize">{attempt.mode?.replace('_', ' ')}</span>
                          {attempt.practiceSectionType && (
                            <>
                              <span className="text-[#e8ecef]">•</span>
                              <span className="capitalize">{attempt.practiceSectionType}</span>
                            </>
                          )}
                        </div>

                        {/* Section Scores */}
                        {score !== null && (
                          <div className="grid grid-cols-4 gap-3">
                            {isToeflItp ? (
                              <>
                                <div className="bg-[#f8f9fa] rounded-lg p-2 text-center border border-[#e8ecef]">
                                  <p className="text-xs text-[#5a6c7d] font-medium mb-0.5">L</p>
                                  <p className="text-base font-bold text-[#5a6c7d]">{attempt.listeningScore}</p>
                                </div>
                                <div className="bg-[#f8f9fa] rounded-lg p-2 text-center border border-[#e8ecef]">
                                  <p className="text-xs text-[#5a6c7d] font-medium mb-0.5">S</p>
                                  <p className="text-base font-bold text-[#5a6c7d]">{attempt.structureScore}</p>
                                </div>
                                <div className="bg-[#f8f9fa] rounded-lg p-2 text-center border border-[#e8ecef]">
                                  <p className="text-xs text-[#5a6c7d] font-medium mb-0.5">R</p>
                                  <p className="text-base font-bold text-[#5a6c7d]">{attempt.readingScore}</p>
                                </div>
                              </>
                            ) : (
                              [
                                { label: 'L', score: attempt.listeningBand },
                                { label: 'R', score: attempt.readingBand },
                                { label: 'W', score: attempt.writingBand },
                                { label: 'S', score: attempt.speakingBand },
                              ].map((section, i) => (
                                <div key={i} className="bg-[#f8f9fa] rounded-lg p-2 text-center border border-[#e8ecef]">
                                  <p className="text-xs text-[#5a6c7d] font-medium mb-0.5">{section.label}</p>
                                  <p className={`text-base font-bold ${section.score ? getBandColor(section.score) : 'text-[#5a6c7d]'}`}>
                                    {formatBand(section.score)}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status */}
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(attempt.status)}
                      {attempt.status === 'in_progress' && (
                        <button
                          className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!deletingAttemptId) {
                              handleDeleteAttempt(attempt.id);
                            }
                          }}
                          disabled={deletingAttemptId === attempt.id}
                          aria-label="Delete in-progress attempt"
                        >
                          {deletingAttemptId === attempt.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      <button
                        className="text-sm font-semibold flex items-center gap-1 transition-colors"
                        style={{ color: theme.primary }}
                      >
                        {getReviewText(!!score)}
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 border border-[#e8ecef] rounded-lg text-sm font-medium text-[#2c3e50] hover:bg-[#f8f9fa] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[#5a6c7d] px-4">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 border border-[#e8ecef] rounded-lg text-sm font-medium text-[#2c3e50] hover:bg-[#f8f9fa] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
