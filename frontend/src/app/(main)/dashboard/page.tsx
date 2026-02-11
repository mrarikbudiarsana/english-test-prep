'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStats } from '@/types/api';
import { formatBand, formatDate } from '@/lib/utils';
import {
  HiClipboardList,
  HiStar,
  HiClock,
  HiFire,
  HiLightBulb,
  HiChartBar,
  HiCheckCircle,
  HiArrowRight,
} from 'react-icons/hi';
import { DashboardCharts } from './DashboardCharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const totalTests = stats?.totalAttempts || 0;
  const avgBand = stats?.averageBand;
  const bestBand = stats?.bestBand;

  // Calculate streak (mock for now - should come from backend)
  const currentStreak = Math.min(totalTests, 7);
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(totalTests % 10, weeklyGoal);

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 md:p-10 border border-indigo-100/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-indigo-600 mb-2 tracking-wide uppercase">Welcome back</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
              {user?.displayName?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-slate-600 text-lg max-w-xl leading-relaxed">
              Your IELTS goal is within reach. Track your progress and improve your performance step by step.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/tests"
              className="group px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 flex items-center justify-center gap-2"
            >
              Start Practice
              <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/results"
              className="px-6 py-3.5 bg-white/80 backdrop-blur text-slate-700 rounded-xl hover:bg-white font-semibold transition-all border border-slate-200 flex items-center justify-center"
            >
              View Results
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid - 4 columns with calmer colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Tests Completed"
          value={totalTests}
          icon={<HiClipboardList className="w-6 h-6" />}
          gradient="from-emerald-500 to-teal-500"
          bgColor="bg-emerald-50/50"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Average Score"
          value={avgBand ? formatBand(avgBand) : '-'}
          subtitle={avgBand ? 'Band Score' : 'No data'}
          icon={<HiChartBar className="w-6 h-6" />}
          gradient="from-violet-500 to-purple-500"
          bgColor="bg-violet-50/50"
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <StatCard
          title="Best Score"
          value={bestBand ? formatBand(bestBand) : '-'}
          subtitle={bestBand ? 'Your record!' : 'No data'}
          icon={<HiStar className="w-6 h-6" />}
          gradient="from-amber-500 to-orange-500"
          bgColor="bg-amber-50/50"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Study Streak"
          value={currentStreak}
          subtitle={currentStreak > 0 ? `${currentStreak} days 🔥` : 'Start today!'}
          icon={<HiFire className="w-6 h-6" />}
          gradient="from-rose-500 to-pink-500"
          bgColor="bg-rose-50/50"
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
        />
      </div>

      {/* Weekly Goal Progress */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HiCheckCircle className="w-5 h-5 text-blue-600" />
              Weekly Goal
            </h3>
            <p className="text-sm text-slate-600 mt-1">Complete {weeklyGoal} practice tests this week</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{weeklyProgress}/{weeklyGoal}</p>
            <p className="text-xs text-slate-500 font-medium">tests completed</p>
          </div>
        </div>
        <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="w-full">
        <DashboardCharts
          recentAttempts={stats?.recentAttempts || []}
          sectionAverages={stats?.sectionAverages || {}}
        />
      </div>

      {/* Bottom Grid - Recent Activity & Tips */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Activity - 2/3 width */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HiClock className="w-5 h-5 text-slate-600" />
              Recent Activity
            </h3>
            <Link href="/results" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </Link>
          </div>
          <div className="p-3">
            {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
              <div className="space-y-2">
                {stats.recentAttempts.slice(0, 5).map((attempt) => (
                  <Link
                    key={attempt.id}
                    href={`/results/${attempt.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 rounded-xl transition-all group border border-transparent hover:border-indigo-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                        attempt.overallBand
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {displayScore(attempt.overallBand)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {attempt.testTitle}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                          <HiClock className="w-3.5 h-3.5" />
                          {attempt.completedAt ? formatDate(attempt.completedAt) : 'In progress'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-500 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 group-hover:bg-white group-hover:border-indigo-200 transition-all">
                        IELTS
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 border border-indigo-200/50">
                  <HiClock className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-slate-800 font-semibold text-lg">No tests taken yet</p>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                  Start your first practice test to track your progress and see analytics.
                </p>
                <Link
                  href="/tests"
                  className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200/50"
                >
                  Browse Tests
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Study Tips & Recommendations - 1/3 width */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <HiLightBulb className="w-5 h-5 text-amber-500" />
            Study Tips
          </h3>
          <div className="space-y-4">
            <TipCard
              title="Practice Reading Daily"
              description="Consistency is key. Even 20 minutes a day can significantly improve your score."
              color="from-sky-500 to-blue-500"
              bgColor="bg-sky-50/50"
            />
            <TipCard
              title="Time Management"
              description="Practice under timed conditions to build speed and confidence."
              color="from-purple-500 to-violet-500"
              bgColor="bg-purple-50/50"
            />
            <TipCard
              title="Review Mistakes"
              description="Learn from your errors. Each mistake is a learning opportunity."
              color="from-emerald-500 to-teal-500"
              bgColor="bg-emerald-50/50"
            />

            {/* Quick Action */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                href="/tests?type=academic"
                className="block p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-all group"
              >
                <p className="font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                  Try a Full Mock Test
                </p>
                <p className="text-sm text-slate-600 mb-3">
                  Simulate real exam conditions with a complete IELTS test.
                </p>
                <div className="flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                  Start Now <HiArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  bgColor,
  iconBg,
  iconColor
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  bgColor: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className={`${bgColor} backdrop-blur p-6 rounded-2xl border border-slate-200/50 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} ${iconColor} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
        <h3 className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function TipCard({
  title,
  description,
  color,
  bgColor
}: {
  title: string;
  description: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} p-4 rounded-xl border border-slate-200/50 hover:border-slate-300 transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${color} mt-2 flex-shrink-0`} />
        <div>
          <h4 className="font-semibold text-slate-800 mb-1 text-sm">{title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function displayScore(score: number | null | undefined) {
  if (score === null || score === undefined) return '-';
  return score % 1 === 0 ? score : score.toFixed(1);
}
