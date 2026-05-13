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
  HiClock,
  HiFilter,
  HiChartBar,
  HiTrendingUp,
  HiTrendingDown,
} from 'react-icons/hi';
import { LayoutDashboard, Target, Trophy, ChevronRight, Filter, SortDesc, Calendar, Trash2 } from 'lucide-react';

type FilterStatus = 'all' | AttemptStatus;
type SortBy = 'date' | 'score';

function getSectionScaledScore(attempt: Attempt): number | null {
  if (attempt.practiceSectionType === 'listening') return attempt.listeningScore;
  if (attempt.practiceSectionType === 'reading') return attempt.readingScore;
  if (attempt.practiceSectionType === 'structure') return attempt.structureScore;
  return null;
}

function getComparableScore(attempt: Attempt): number | null {
  return attempt.mode === 'section_practice' ? getSectionScaledScore(attempt) : attempt.overallScore;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const userExamType = 'toefl_itp'; // Default for this platform
  const examConfig = getExamConfig(userExamType);
  const { theme, testTypes: allowedTestTypes } = examConfig;

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const [activeCategory, setActiveCategory] = useState<'full' | 'section_practice'>('full');
  const [activeTestType, setActiveTestType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);

  const [stats, setStats] = useState<{ fullCount: number; sectionCount: number; fullHigh: string; fullAvg: string; sectionHigh: string; sectionAvg: string }>({
    fullCount: 0, sectionCount: 0, fullHigh: '-', fullAvg: '-', sectionHigh: '-', sectionAvg: '-'
  });

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Attempt>>('/attempts', {
        params: {
          offset,
          limit,
          examType: userExamType,
          mode: activeCategory,
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
        filteredAttempts.sort((a, b) => (getComparableScore(b) ?? 0) - (getComparableScore(a) ?? 0));
      }

      setAttempts(filteredAttempts);
      setTotal(res.data.total);
    } catch {
      console.error('Failed to fetch attempts');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeTestType, allowedTestTypes, filterStatus, offset, sortBy]);

  // Fetch summary stats once
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get<PaginatedResponse<Attempt>>('/attempts', {
          params: { limit: 100, examType: userExamType }
        });
        const all = res.data.data.filter(a => a.status === 'completed');
        const full = all.filter(a => a.mode === 'full');
        const section = all.filter(a => a.mode === 'section_practice');

        const highest = (list: Attempt[]) => {
          const scored = list
            .map(getComparableScore)
            .filter((score): score is number => score !== null);
          if (!scored.length) return '-';
          return Math.round(Math.max(...scored)).toString();
        };
        const average = (list: Attempt[]) => {
          const scored = list
            .map(getComparableScore)
            .filter((score): score is number => score !== null);
          if (!scored.length) return '-';
          return Math.round(scored.reduce((s, score) => s + score, 0) / scored.length).toString();
        };

        setStats({
          fullCount: full.length,
          sectionCount: section.length,
          fullHigh: highest(full),
          fullAvg: average(full),
          sectionHigh: highest(section),
          sectionAvg: average(section),
        });
      } catch (e) {
        console.error('Failed to fetch summary stats', e);
      }
    };
    fetchSummary();
  }, [userExamType]);

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
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
      scoring: 'bg-amber-50 text-amber-600 border-amber-100',
      abandoned: 'bg-slate-50 text-slate-500 border-slate-100',
    };

    const labels = {
      completed: 'Completed',
      in_progress: 'In Progress',
      scoring: 'Scoring',
      abandoned: 'Abandoned',
    };

    return (
      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  }

  function getScoreChange(index: number) {
    if (index >= attempts.length - 1) return null;
    const current = getComparableScore(attempts[index]);
    const previous = getComparableScore(attempts[index + 1]);

    if (current === null || current === undefined || previous === null || previous === undefined) return null;

    const change = current - previous;
    return Math.abs(change) < 1 ? null : change;
  }

  const getDisplayScore = (attempt: Attempt) => {
    if (attempt.mode === 'section_practice') {
      return getSectionScaledScore(attempt);
    }
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

  const StatsHero = ({
    activeCategory,
    stats,
    theme,
    onCategoryChange
  }: {
    activeCategory: 'full' | 'section_practice';
    stats: any;
    theme: any;
    onCategoryChange: (cat: 'full' | 'section_practice') => void;
  }) => {
    const isFull = activeCategory === 'full';
    const high = isFull ? stats.fullHigh : stats.sectionHigh;
    const avg = isFull ? stats.fullAvg : stats.sectionAvg;
    const count = isFull ? stats.fullCount : stats.sectionCount;
    const accentColor = isFull ? theme.primary : '#0e7490';

    return (
      <div className="space-y-6">
        {/* Segmented Control */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/50 shadow-inner">
            <button
              onClick={() => onCategoryChange('full')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                isFull ? 'bg-white text-slate-800 shadow-sm scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Trophy className={`w-4 h-4 ${isFull ? '' : 'opacity-40'}`} style={isFull ? { color: theme.primary } : {}} />
              Full Practice
            </button>
            <button
              onClick={() => onCategoryChange('section_practice')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                !isFull ? 'bg-white text-slate-800 shadow-sm scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Target className={`w-4 h-4 ${!isFull ? '' : 'opacity-40'}`} style={!isFull ? { color: '#0e7490' } : {}} />
              Section Practice
            </button>
          </div>
        </div>

        {/* Stats Hero Card */}
        <div 
          className="relative overflow-hidden rounded-3xl p-8 md:p-10 border border-white/20 shadow-xl transition-all duration-500"
          style={{ 
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Main Metric */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3 mb-2 opacity-80">
                <Trophy className="w-5 h-5 text-white" />
                <span className="text-xs font-semibold text-white uppercase tracking-[0.2em]">Highest Scaled Score</span>
              </div>
              <div className="text-6xl md:text-7xl font-extrabold text-white tracking-tighter leading-none mb-4 drop-shadow-lg">
                {high}
              </div>
              <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
                Based on your best performance
              </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 text-white">
                  <HiTrendingUp className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Average Score</p>
                <p className="text-3xl font-extrabold text-white">{avg}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 text-white">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Tests Taken</p>
                <p className="text-3xl font-extrabold text-white">{count}</p>
              </div>

              <div className="col-span-2 bg-black/10 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center gap-3">
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Performance Overview</span>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/30" />)}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-40 right-[-10%] w-[40%] h-96 bg-blue-50/40 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-80 left-[-10%] w-[30%] h-80 bg-indigo-50/30 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4 group">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mr-3 group-hover:bg-slate-50 transition-colors">
                <HiArrowLeft className="w-4 h-4" />
              </div>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Test Results</h1>
            <p className="text-slate-500 text-base max-w-2xl font-medium leading-relaxed">
              Review your TOEFL ITP performance and track your score over time with detailed analytics.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-sm">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Performance Dashboard</span>
          </div>
        </div>

        <StatsHero 
          activeCategory={activeCategory}
          stats={stats}
          theme={theme}
          onCategoryChange={(cat) => { setActiveCategory(cat); setOffset(0); }}
        />

        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Filter className="w-5 h-5" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'completed', 'in_progress', 'scoring'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    filterStatus === status 
                      ? 'text-white shadow-md scale-[1.05]' 
                      : 'bg-slate-100/50 text-slate-500 hover:bg-slate-200/70'
                  }`}
                  style={filterStatus === status ? { 
                    backgroundColor: theme.primary,
                    boxShadow: `0 8px 15px -3px ${theme.primary}40`
                  } : {}}
                >
                  {status === 'all' ? 'All Results' : status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pl-4 lg:pl-0 lg:border-l border-slate-200">
            <div className="flex items-center gap-2 ml-auto lg:ml-4">
              <SortDesc className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
              >
                <option value="date">Most Recent</option>
                <option value="score">Highest Score</option>
              </select>
            </div>
          </div>
        </div>

      {attempts.length === 0 ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-inner">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 mx-auto border shadow-lg" style={{ backgroundColor: theme.secondary, borderColor: `${theme.primary}20` }}>
            <HiChartBar className="h-10 w-10" style={{ color: theme.primary }} />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">No test results yet</h3>
          <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium leading-relaxed">Start your journey today. Take a practice test to see where you stand and how you can improve.</p>
          <Link
            href="/tests"
            className="inline-flex items-center px-8 py-4 text-white rounded-xl font-semibold transition-all hover:scale-[1.05] active:scale-[0.98] shadow-lg"
            style={{ 
              backgroundColor: theme.primary, 
              boxShadow: `0 10px 20px -5px ${theme.primary}40` 
            }}
          >
            Browse Practice Tests
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt, index) => {
            const scoreChange = getScoreChange(index);
            const score = getDisplayScore(attempt);
            const isCompleted = attempt.status === 'completed';

            return (
              <Link
                key={attempt.id}
                href={attempt.status === 'in_progress'
                  ? `/tests/${attempt.testId}/take?attemptId=${attempt.id}&mode=${attempt.mode}${attempt.practiceSectionType ? `&section=${attempt.practiceSectionType}` : ''}`
                  : `/results/${attempt.id}`
                }
                className="block group"
              >
                <div
                  className="relative p-6 bg-white rounded-2xl border border-slate-200/60 transition-all duration-500 hover:shadow-md hover:-translate-y-1 group-hover:border-slate-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      {/* Circular Score Indicator */}
                      <div
                        className="relative w-16 h-16 rounded-full flex flex-col items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110"
                        style={score !== null ? {
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 100%)`,
                          boxShadow: `0 8px 15px -3px ${theme.primary}40`
                        } : { 
                          background: '#f1f5f9',
                          border: '2px dashed #e2e8f0'
                        }}
                      >
                        {score !== null ? (
                          <>
                            <span className="text-xl font-extrabold text-white leading-none mb-0.5">{score}</span>
                            <span className="text-[8px] font-bold text-white/80 uppercase tracking-widest leading-none">
                              {attempt.mode === 'section_practice' ? 'Scaled' : 'Score'}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center px-2">
                            TBD
                          </span>
                        )}
                        
                        {/* Decorative ring */}
                        <div className="absolute inset-[-4px] rounded-full border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-extrabold text-slate-800 truncate group-hover:text-blue-900 transition-colors">
                            {attempt.test?.title || 'Untitled Test'}
                          </h3>
                          {scoreChange !== null && (
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${
                              scoreChange > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {scoreChange > 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                              {Math.abs(Number(scoreChange)).toFixed(0)}
                            </div>
                          )}
                          {getStatusBadge(attempt.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-slate-400 mb-4">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(attempt.completedAt || attempt.startedAt)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="uppercase tracking-widest text-[10px] text-slate-500">{attempt.mode?.replace('_', ' ')}</span>
                          {attempt.practiceSectionType && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="uppercase tracking-widest text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">{attempt.practiceSectionType}</span>
                            </>
                          )}
                        </div>

                        {isCompleted && (
                          <div className="flex gap-2">
                            {[
                              { label: 'L', val: attempt.listeningScore, color: 'indigo' },
                              { label: 'S', val: attempt.structureScore, color: 'blue' },
                              { label: 'R', val: attempt.readingScore, color: 'cyan' }
                            ].map(s => (
                              <div key={s.label} className="flex items-center gap-2 bg-slate-50/80 border border-slate-100 px-3 py-1.5 rounded-xl">
                                <span className={`text-[10px] font-bold text-${s.color}-600 w-4`}>{s.label}</span>
                                <span className="text-sm font-bold text-slate-700 tabular-nums">{s.val || '-'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 shrink-0">
                      <div className="flex items-center gap-2">
                        {attempt.status === 'in_progress' && (
                          <button
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!deletingAttemptId) {
                                handleDeleteAttempt(attempt.id);
                              }
                            }}
                            disabled={deletingAttemptId === attempt.id}
                            title="Delete Draft"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                        <div className="w-10 h-10 rounded-full border border-slate-100 bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50 transition-all duration-500">
                          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                      
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest hidden md:block">
                        {attempt.status === 'in_progress' ? 'Resume Test' : 'View Report'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-6 pt-12">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <HiArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {offset + 1} — {Math.min(offset + limit, total)} <span className="text-slate-300 mx-1">of</span> {total}
             </span>
          </div>

          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  </div>
  );
}
