'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Attempt, AttemptStatus } from '@/types/test';
import { PaginatedResponse } from '@/types/api';
import { formatBand, formatDate, getBandColor, getBandBgColor } from '@/lib/utils';
import {
  HiArrowLeft,
  HiChartBar,
  HiClock,
  HiCheckCircle,
  HiRefresh,
  HiFilter,
  HiTrendingUp,
  HiTrendingDown,
} from 'react-icons/hi';

type FilterStatus = 'all' | AttemptStatus;
type SortBy = 'date' | 'score';

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const limit = 10;

  useEffect(() => {
    fetchAttempts();
  }, [offset, filterStatus, sortBy]);

  async function fetchAttempts() {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Attempt>>('/attempts', {
        params: { offset, limit }
      });

      let filteredAttempts = res.data.data;

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
        filteredAttempts.sort((a, b) => (b.overallBand || 0) - (a.overallBand || 0));
      }

      setAttempts(filteredAttempts);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch attempts');
    } finally {
      setLoading(false);
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
    const current = attempts[index].overallBand;
    const previous = attempts[index + 1].overallBand;

    if (!current || !previous) return null;

    const change = current - previous;
    if (Math.abs(change) < 0.1) return null;

    return change;
  }

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
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <HiArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">Test Results</h1>
          <p className="text-slate-600 mt-1">
            Review your performance and track your progress over time
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <HiCheckCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Tests</p>
            <p className="text-3xl font-bold text-slate-800">{total}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <HiTrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Highest Score</p>
            <p className="text-3xl font-bold text-slate-800">
              {Math.max(...attempts.filter(a => a.overallBand).map(a => a.overallBand!)).toFixed(1) || '-'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <HiChartBar className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-slate-800">
              {attempts.filter(a => a.overallBand).length > 0
                ? (attempts.filter(a => a.overallBand).reduce((sum, a) => sum + (a.overallBand || 0), 0) /
                   attempts.filter(a => a.overallBand).length).toFixed(1)
                : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-3">
          <HiFilter className="w-5 h-5 text-slate-500" />
          <div className="flex gap-2">
            {(['all', 'completed', 'in_progress', 'scoring'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="date">Most Recent</option>
            <option value="score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      {attempts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-indigo-200/50">
            <HiChartBar className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No test results yet</h3>
          <p className="text-slate-600 mb-6">
            Start practicing to track your progress and see detailed feedback
          </p>
          <Link
            href="/tests"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all shadow-lg shadow-indigo-200/50"
          >
            Browse Tests
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt, index) => {
            const scoreChange = getScoreChange(index);

            return (
              <Link
                key={attempt.id}
                href={`/results/${attempt.id}`}
                className="block bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Score Badge */}
                    <div className="flex items-start gap-5">
                      <div className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center font-bold transition-all border-2 ${
                        attempt.overallBand
                          ? `${getBandBgColor(attempt.overallBand)} ${attempt.overallBand >= 7 ? 'border-emerald-300' : attempt.overallBand >= 5 ? 'border-blue-300' : 'border-amber-300'}`
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        {attempt.overallBand ? (
                          <>
                            <span className={`text-2xl ${attempt.overallBand ? getBandColor(attempt.overallBand) : 'text-slate-400'}`}>
                              {formatBand(attempt.overallBand)}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Overall</span>
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs text-center px-2">
                            {attempt.status === 'scoring' ? 'Scoring...' : 'No score'}
                          </span>
                        )}
                      </div>

                      {/* Test Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {attempt.test?.title || 'Untitled Test'}
                          </h3>
                          {scoreChange !== null && (
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                              scoreChange > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {scoreChange > 0 ? (
                                <HiTrendingUp className="w-3 h-3" />
                              ) : (
                                <HiTrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(scoreChange).toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                          <span className="flex items-center gap-1.5">
                            <HiClock className="w-4 h-4" />
                            {formatDate(attempt.completedAt || attempt.startedAt)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="capitalize">{attempt.mode.replace('_', ' ')}</span>
                          {attempt.practiceSectionType && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="capitalize">{attempt.practiceSectionType}</span>
                            </>
                          )}
                        </div>

                        {/* Section Scores */}
                        {attempt.overallBand && (
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { label: 'L', score: attempt.listeningBand },
                              { label: 'R', score: attempt.readingBand },
                              { label: 'W', score: attempt.writingBand },
                              { label: 'S', score: attempt.speakingBand },
                            ].map((section, i) => (
                              <div key={i} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium mb-0.5">{section.label}</p>
                                <p className={`text-base font-bold ${section.score ? getBandColor(section.score) : 'text-slate-400'}`}>
                                  {formatBand(section.score)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status */}
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(attempt.status)}
                      <button className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                        View Details
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
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 px-4">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
