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
  HiBadgeCheck,
} from 'react-icons/hi';
import { DashboardCharts } from './DashboardCharts';
import { examConfigs, getExamConfig } from '@/config/examConfig';
import { ExamType } from '@/types/user';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ planType: string; expiresAt: string } | null>(null);

  // Get exam config based on user's preference
  const examType = user?.preferredExamType || 'ielts';
  const examConfig = getExamConfig(examType);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch stats filtered by exam type
        const res = await api.get(`/dashboard/stats?examType=${examType}`);
        setStats(res.data);
      } catch {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    async function fetchSubscription() {
      try {
        const res = await api.get('/subscriptions/current');
        setSubscription(res.data.data);
      } catch {
        // no active subscription — that's fine
      }
    }
    fetchStats();
    fetchSubscription();
  }, [examType]);

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

  const t = examConfig.theme;

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 border"
        style={{ background: `linear-gradient(135deg, white, ${t.heroTint1}, ${t.heroTint2})`, borderColor: t.border }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -z-0 opacity-40" style={{ backgroundColor: t.blob1 }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl -z-0 opacity-30" style={{ backgroundColor: t.blob2 }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium mb-2 tracking-wide uppercase" style={{ color: t.primary }}>Welcome back</p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#2c3e50] mb-3">
              {user?.displayName?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-[#5a6c7d] text-lg max-w-xl leading-relaxed">
              Your {examConfig.name} goal is within reach. Track your progress and improve your performance step by step.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/tests"
              className="group px-6 py-3.5 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: t.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = t.primaryDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = t.primary)}
            >
              Start Practice
              <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/results"
              className="px-6 py-3.5 bg-white/80 backdrop-blur text-[#2c3e50] rounded-xl hover:bg-white font-semibold transition-all border border-[#e8ecef] flex items-center justify-center"
            >
              View Results
            </Link>
          </div>
          {subscription ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl w-fit">
              <HiBadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 capitalize">{subscription.planType} Plan</p>
                <p className="text-xs text-emerald-600">Expires {formatDate(subscription.expiresAt)}</p>
              </div>
            </div>
          ) : (
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-fit hover:opacity-90 transition-all border"
              style={{ backgroundColor: t.heroTint1, borderColor: t.border }}
            >
              <HiBadgeCheck className="w-5 h-5 flex-shrink-0" style={{ color: t.primary }} />
              <div>
                <p className="text-sm font-semibold text-gray-800">Free Plan</p>
                <p className="text-xs" style={{ color: t.primary }}>Upgrade for full access →</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1 - branded with exam color */}
        <div
          className="backdrop-blur p-6 rounded-2xl border hover:shadow-lg transition-all duration-300 group"
          style={{ backgroundColor: `${t.stat1Bg}80`, borderColor: `${t.border}80` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: t.secondary, color: t.primary }}
            >
              <HiClipboardList className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Tests Completed</p>
            <h3 className="text-3xl font-bold" style={{ color: t.primary }}>{totalTests}</h3>
          </div>
        </div>

        <StatCard
          title="Average Score"
          value={avgBand ? formatBand(avgBand) : '-'}
          subtitle={avgBand ? examConfig.scoreLabel : 'No data'}
          icon={<HiChartBar className="w-6 h-6" />}
          gradient="from-[#3b82f6] to-[#2563eb]"
          bgColor="bg-blue-50/50"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Best Score"
          value={bestBand ? formatBand(bestBand) : '-'}
          subtitle={bestBand ? examConfig.scoreLabel : 'No data'}
          icon={<HiStar className="w-6 h-6" />}
          gradient="from-amber-500 to-yellow-500"
          bgColor="bg-amber-50/50"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Study Streak"
          value={currentStreak}
          subtitle={currentStreak > 0 ? `${currentStreak} days 🔥` : 'Start today!'}
          icon={<HiFire className="w-6 h-6" />}
          gradient="from-emerald-500 to-teal-500"
          bgColor="bg-emerald-50/50"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Weekly Goal Progress */}
      <div className="rounded-2xl p-6 border" style={{ background: `linear-gradient(135deg, ${t.heroTint1}, white)`, borderColor: t.border }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#2c3e50] flex items-center gap-2">
              <HiCheckCircle className="w-5 h-5" style={{ color: t.primary }} />
              Weekly Goal
            </h3>
            <p className="text-sm text-[#5a6c7d] mt-1">Complete {weeklyGoal} practice tests this week</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: t.primary }}>{weeklyProgress}/{weeklyGoal}</p>
            <p className="text-xs text-[#5a6c7d] font-medium">tests completed</p>
          </div>
        </div>
        <div className="w-full rounded-full h-3 overflow-hidden border" style={{ backgroundColor: t.secondary, borderColor: t.border }}>
          <div
            className="h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%`, backgroundColor: t.progressBar }}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="w-full">
        <DashboardCharts
          recentAttempts={stats?.recentAttempts || []}
          sectionAverages={stats?.sectionAverages || {}}
          examType={examType}
        />
      </div>

      {/* Bottom Grid - Recent Activity & Tips */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#e8ecef] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#e8ecef] flex justify-between items-center bg-gradient-to-r from-[#f8f9fa] to-white">
            <h3 className="text-lg font-bold text-[#2c3e50] flex items-center gap-2">
              <HiClock className="w-5 h-5 text-[#5a6c7d]" />
              Recent Activity
            </h3>
            <Link href="/results" className="text-sm font-semibold transition-colors hover:opacity-70" style={{ color: t.primary }}>
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
                    className="flex items-center justify-between p-4 rounded-xl transition-all group border border-transparent"
                    style={{ ['--hover-bg' as any]: `${t.secondary}50` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${t.secondary}50`;
                      e.currentTarget.style.borderColor = `${t.primary}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${attempt.overallBand
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                        {displayScore(attempt.overallBand)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#2c3e50] transition-colors">
                          {attempt.testTitle}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                          <HiClock className="w-3.5 h-3.5" />
                          {attempt.completedAt ? formatDate(attempt.completedAt) : 'In progress'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
                        style={{ color: t.primary, backgroundColor: t.secondary, borderColor: t.border }}
                      >
                        {examConfig.shortName}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border" style={{ backgroundColor: t.secondary, borderColor: t.border }}>
                  <HiClock className="h-8 w-8 opacity-60" style={{ color: t.primary }} />
                </div>
                <p className="text-[#2c3e50] font-semibold text-lg">No tests taken yet</p>
                <p className="text-sm text-[#5a6c7d] mt-2 max-w-xs mx-auto">
                  Start your first practice test to track your progress and see analytics.
                </p>
                <Link
                  href="/tests"
                  className="mt-6 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:opacity-90"
                  style={{ backgroundColor: t.primary }}
                >
                  Browse Tests
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Study Tips */}
        <div className="bg-white rounded-2xl border border-[#e8ecef] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#2c3e50] mb-5 flex items-center gap-2">
            <HiLightBulb className="w-5 h-5 text-amber-500" />
            Study Tips
          </h3>
          <div className="space-y-4">
            <TipCard
              title="Practice Reading Daily"
              description="Consistency is key. Even 20 minutes a day can significantly improve your score."
              color="from-blue-500 to-blue-600"
              bgColor="bg-blue-50/50"
            />
            <TipCard
              title="Time Management"
              description="Practice under timed conditions to build speed and confidence."
              color="from-amber-500 to-orange-500"
              bgColor="bg-amber-50/50"
            />
            <TipCard
              title="Review Mistakes"
              description="Learn from your errors. Each mistake is a learning opportunity."
              color="from-emerald-500 to-teal-500"
              bgColor="bg-emerald-50/50"
            />

            {/* Quick Action */}
            <div className="pt-4 mt-4 border-t border-[#e8ecef]">
              <Link
                href="/tests"
                className="block p-4 rounded-xl border transition-all group bg-gradient-to-br from-[#f8f9fa] to-white hover:opacity-90"
                style={{ borderColor: t.border }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${t.secondary}40`; e.currentTarget.style.borderColor = `${t.primary}50`; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = t.border; }}
              >
                <p className="font-semibold text-[#2c3e50] mb-1">
                  Try a Full Mock Test
                </p>
                <p className="text-sm text-[#5a6c7d] mb-3">
                  Simulate real exam conditions with a complete {examConfig.name} test.
                </p>
                <div className="flex items-center text-sm font-semibold" style={{ color: t.primary }}>
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

function displayScore(score: any) {
  if (score === null || score === undefined) return '-';
  const numScore = Number(score);
  return numScore % 1 === 0 ? numScore : numScore.toFixed(1);
}
