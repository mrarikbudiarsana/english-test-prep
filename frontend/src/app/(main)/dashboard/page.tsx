'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardStats } from '@/types/api';
import { formatDate, formatScore } from '@/lib/utils';
import { DashboardCharts } from './DashboardCharts';
import { getTier } from '@/lib/tier';
import type { Subscription } from '@/types/user';

const NAVY = '#08507f';
const NAVY_DARK = '#063d61';
const NAVY_LIGHT = '#e8f4fd';

/* ── helpers ────────────────────────────────────────────────── */
function scaledScore(raw: number | null | undefined): string {
  if (raw === null || raw === undefined) return '—';
  return Math.round(Number(raw)).toString();
}

function getSectionScaledScore(attempt: any): number | null {
  if (attempt.practiceSectionType === 'listening') return attempt.listeningScore ?? null;
  if (attempt.practiceSectionType === 'reading') return attempt.readingScore ?? null;
  if (attempt.practiceSectionType === 'structure') return attempt.structureScore ?? null;
  return null;
}

function getAttemptScore(attempt: any): number | null {
  return attempt.mode === 'section_practice'
    ? getSectionScaledScore(attempt)
    : attempt.overallScore ?? null;
}

/* ── tiny icons ─────────────────────────────────────────────── */
const IconTests = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;
const IconStar = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
const IconChart = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconArrow = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>;
const IconClock = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconBadge = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;

/* ── stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon: React.ReactNode; accent: string; }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: accent + '20', color: accent }}>
        {icon}
      </div>
      <p className="text-sm text-slate-500 font-medium mb-0.5">{label}</p>
      <p className="text-3xl font-extrabold" style={{ color: NAVY }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── main component ─────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const tier = getTier(user, subscription);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, subRes] = await Promise.allSettled([
          api.get('/dashboard/stats?examType=toefl_itp'),
          api.get('/subscriptions/current'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (subRes.status === 'fulfilled') setSubscription(subRes.value.data?.data);
      } catch {}
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const totalTests = stats?.totalAttempts || 0;
  const avgScore = stats?.averageBand;
  const bestScore = stats?.bestBand;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">

      {/* ── Hero banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white" style={{ background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 60%, #0a6aad 100%)` }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', transform: 'translate(30%,-40%)' }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">{t('dash_welcome_back')}</p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              {user?.displayName?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-blue-100 max-w-lg">
              {t('dash_subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/tests" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-[#08507f] bg-white hover:bg-blue-50 transition-all shadow-lg text-sm">
              {t('dash_start_practice')} <IconArrow />
            </Link>
            {subscription ? (
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-sm">
                <IconBadge />
                <span className="font-semibold capitalize">{subscription.planType} Plan</span>
              </div>
            ) : (
              <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition-all">
                {t('dash_upgrade_plan')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label={t('dash_tests_completed')} value={totalTests.toString()} sub={t('dash_tests_sub')} icon={<IconTests />} accent={NAVY} />
        <StatCard label={t('dash_avg_score')} value={avgScore ? scaledScore(avgScore) : '—'} sub={t('dash_avg_sub')} icon={<IconChart />} accent="#2563eb" />
        <StatCard label={t('dash_best_score')} value={bestScore ? scaledScore(bestScore) : '—'} sub={t('dash_best_sub')} icon={<IconStar />} accent="#d97706" />
      </div>

      {/* ── Course CTA Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A5.905 5.905 0 018 3.443m4 3.785v3.382m0 0a1.5 1.5 0 001.832 1.457l3.15-.788a1.5 1.5 0 001.123-1.457V7.228m-6.105 0a3.001 3.001 0 012.222-2.476m5.602 4.41c1.295-.333 2.428-1.066 3.14-2.07M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight mb-1">
                {t('cta_title_1')} <span style={{ color: '#f59e0b' }}>{t('cta_title_2')}</span>
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
                {t('cta_body')}
              </p>
            </div>
          </div>
          <a
            href="https://englishwitharik.com/toefl-itp"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-[#08507f] hover:text-[#063d61] bg-[#f59e0b] hover:bg-amber-400 transition-all duration-200 text-sm shadow-md shrink-0 active:scale-[0.98]"
            style={{ color: '#063d61', backgroundColor: '#f59e0b' }}
          >
            {t('cta_button')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Charts + Recent activity ──────────────────────────── */}
      <DashboardCharts
        recentAttempts={stats?.recentAttempts || []}
        sectionAverages={stats?.sectionAverages || {}}
        examType="toefl_itp"
        tier={tier}
      />

      {/* ── Recent tests ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{t('dash_recent_tests')}</h2>
          <Link href="/results" className="text-sm font-semibold hover:underline" style={{ color: NAVY }}>{t('dash_view_all')}</Link>
        </div>

        {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentAttempts.slice(0, 6).map(attempt => (
              <Link key={attempt.id} href={`/results/${attempt.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})` }}>
                    {getAttemptScore(attempt) ? Math.round(Number(getAttemptScore(attempt))) : '—'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{attempt.testTitle}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <IconClock />
                      {attempt.completedAt ? formatDate(attempt.completedAt) : t('dash_in_progress')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: NAVY_LIGHT, color: NAVY }}>
                  TOEFL ITP
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: NAVY_LIGHT }}>
              <IconTests />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">{t('dash_no_tests_title')}</p>
            <p className="text-slate-500 text-sm mb-6 max-w-xs">{t('dash_no_tests_body')}</p>
            <Link href="/tests" className="px-6 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all" style={{ background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})` }}>
              {t('dash_browse_tests')}
            </Link>
          </div>
        )}
      </div>

      {/* ── Study tips ────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { title: t('dash_tip_listening_title'), tip: t('dash_tip_listening_body'), color: '#2563eb' },
          { title: t('dash_tip_structure_title'), tip: t('dash_tip_structure_body'), color: NAVY },
          { title: t('dash_tip_reading_title'), tip: t('dash_tip_reading_body'), color: '#7c3aed' },
        ].map(tip => (
          <div key={tip.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow">
            <div className="w-2 h-2 rounded-full mb-4" style={{ backgroundColor: tip.color }} />
            <h3 className="font-bold text-slate-900 text-sm mb-2">{tip.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{tip.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
