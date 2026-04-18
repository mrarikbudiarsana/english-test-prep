'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Attempt, AttemptStatus, TestType } from '@/types/test';
import { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { getExamConfig } from '@/config/examConfig';
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
  const searchParams = useSearchParams();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);
  const limit = 10;
  const userExamType = 'toefl_itp';
  const { theme } = getExamConfig(userExamType);
  const allowedTestTypes = useMemo(() => ['toefl_itp'], []);
  const queryTestType = searchParams.get('testType') as TestType | null;
  const activeTestType = queryTestType === 'toefl_itp' ? queryTestType : null;

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Attempt>>('/attempts', {
        params: {
          offset,
          limit,
          examType: userExamType,
          ...(activeTestType ? { testType: activeTestType } : {}),
        },
      });

      let filteredAttempts = res.data.data;
      const allowedSet = new Set(allowedTestTypes);
      filteredAttempts = filteredAttempts.filter((attempt) =>
        attempt.test?.testType ? allowedSet.has(attempt.test.testType) : false
      );

      if (filterStatus !== 'all') {
        filteredAttempts = filteredAttempts.filter((attempt) => attempt.status === filterStatus);
      }

      if (sortBy === 'date') {
        filteredAttempts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      } else {
        filteredAttempts.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));
      }

      setAttempts(filteredAttempts);
      setTotal(res.data.total);
    } catch {
      console.error('Failed to fetch attempts');
    } finally {
      setLoading(false);
    }
  }, [activeTestType, allowedTestTypes, filterStatus, offset, sortBy]);

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
      setAttempts((prev) => prev.filter((attempt) => attempt.id !== attemptId));
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

    return <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${styles[status]}`}>{labels[status]}</span>;
  }

  function getScoreChange(index: number) {
    if (index >= attempts.length - 1) return null;
    const current = attempts[index].overallScore;
    const previous = attempts[index + 1].overallScore;

    if (current === null || current === undefined || previous === null || previous === undefined) return null;

    const change = current - previous;
    return Math.abs(change) < 1 ? null : change;
  }

  const getDisplayScore = (attempt: Attempt) => {
    const value = attempt.overallScore;
    return value !== null && value !== undefined ? value : null;
  };

  if (loading && attempts.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-16 bg-gray-200 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm text-[#5a6c7d] hover:text-[#2c3e50] mb-3">
            <HiArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#2c3e50]">Test Results</h1>
          <p className="text-[#5a6c7d] mt-1">Review your TOEFL ITP performance and track your score over time.</p>
        </div>
      </div>

      {attempts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl p-6 border border-[#e8ecef]" style={{ backgroundColor: `${theme.secondary}50` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: theme.secondary, color: theme.primary }}>
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
              {attempts.some((attempt) => getDisplayScore(attempt) !== null)
                ? Math.max(...attempts.map((attempt) => Number(getDisplayScore(attempt) || 0))).toFixed(0)
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
                const scoredAttempts = attempts.filter((attempt) => getDisplayScore(attempt) !== null);
                if (scoredAttempts.length === 0) return '-';
                const sum = scoredAttempts.reduce((acc, attempt) => acc + Number(getDisplayScore(attempt)), 0);
                return (sum / scoredAttempts.length).toFixed(0);
              })()}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-xl p-4 border border-[#e8ecef]">
        <div className="flex items-center gap-3">
          <HiFilter className="w-5 h-5 text-[#5a6c7d]" />
          <div className="flex gap-2">
            {(['all', 'completed', 'in_progress', 'scoring'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status ? 'text-white shadow-sm' : 'bg-[#f8f9fa] text-[#5a6c7d] hover:bg-[#e8ecef]'
                }`}
                style={filterStatus === status ? { backgroundColor: theme.primary } : {}}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
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

      {attempts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#e8ecef]">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto border" style={{ backgroundColor: theme.secondary, borderColor: `${theme.primary}33` }}>
            <HiChartBar className="h-8 w-8" style={{ color: theme.primary }} />
          </div>
          <h3 className="text-xl font-bold text-[#2c3e50] mb-2">No test results yet</h3>
          <p className="text-[#5a6c7d] mb-6">Start practicing to track your TOEFL ITP progress and see detailed feedback.</p>
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

            return (
              <Link key={attempt.id} href={`/results/${attempt.id}`} className="block bg-white rounded-xl border border-[#e8ecef] hover:shadow-lg transition-all group">
                <div
                  className="p-6 border border-[#e8ecef] rounded-xl transition-colors"
                  style={{ borderColor: '#e8ecef' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${theme.primary}4D`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8ecef'; }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5">
                      <div
                        className="w-20 h-20 rounded-xl flex flex-col items-center justify-center font-bold transition-all border-2 bg-[#f8f9fa]"
                        style={score !== null ? {
                          backgroundColor: theme.secondary,
                          color: theme.primary,
                          borderColor: Number(score) >= 600 ? '#86efac' : Number(score) >= 500 ? '#93c5fd' : '#fcd34d',
                        } : { borderColor: '#e8ecef' }}
                      >
                        {score !== null ? (
                          <>
                            <span className="text-2xl" style={{ color: theme.primary }}>{score}</span>
                            <span className="text-xs text-[#5a6c7d] font-medium">Score</span>
                          </>
                        ) : (
                          <span className="text-[#5a6c7d] text-xs text-center px-2">
                            {'No score'}
                          </span>
                        )}
                      </div>

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
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                              scoreChange > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {scoreChange > 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                              {Math.abs(Number(scoreChange)).toFixed(0)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#5a6c7d] mb-3">
                          <span className="flex items-center gap-1.5">
                            <HiClock className="w-4 h-4" />
                            {formatDate(attempt.completedAt || attempt.startedAt)}
                          </span>
                          <span className="text-[#e8ecef]">|</span>
                          <span className="capitalize">{attempt.mode?.replace('_', ' ')}</span>
                          {attempt.practiceSectionType && (
                            <>
                              <span className="text-[#e8ecef]">|</span>
                              <span className="capitalize">{attempt.practiceSectionType}</span>
                            </>
                          )}
                        </div>

                        {score !== null && (
                          <div className="grid grid-cols-3 gap-3">
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
                          </div>
                        )}
                      </div>
                    </div>

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
                      <button className="text-sm font-semibold flex items-center gap-1 transition-colors" style={{ color: theme.primary }}>
                        {score !== null ? 'View Score Report' : 'View Details'}
                        <span className="group-hover:translate-x-1 transition-transform">-&gt;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 border border-[#e8ecef] rounded-lg text-sm font-medium text-[#2c3e50] hover:bg-[#f8f9fa] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[#5a6c7d] px-4">Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}</span>
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
