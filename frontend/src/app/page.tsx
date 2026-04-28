'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/* ── tiny inline icons ────────────────────────────────────── */
const IconCheck = () => (
  <svg width="20" height="20" style={{ flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const IconHeadphones = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5A8.25 8.25 0 0120.25 7.5M3 14.25v1.5A2.25 2.25 0 005.25 18H7.5v-4.5H5.25A2.25 2.25 0 003 15.75v-1.5zm18 0v1.5A2.25 2.25 0 0118.75 18H16.5v-4.5h2.25A2.25 2.25 0 0121 15.75v-1.5z" />
  </svg>
);
const IconPencil = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
const IconBook = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);
const IconChart = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const IconClock = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ── component ────────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const SECTIONS = [
    {
      icon: <IconHeadphones />,
      name: 'Listening Comprehension',
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-100 text-blue-700',
      parts: ['Part A — Short Conversations (30 Qs)', 'Part B — Longer Conversations (8 Qs)', 'Part C — Talks & Lectures (12 Qs)'],
      stats: '50 questions · 35 minutes',
      scaled: '31–68',
    },
    {
      icon: <IconPencil />,
      name: 'Structure & Written Expression',
      color: 'bg-teal-50 text-teal-700 border-teal-100',
      iconBg: 'bg-teal-100 text-teal-700',
      parts: ['Part 1 — Structure (15 Qs)', 'Part 2 — Written Expression (25 Qs)'],
      stats: '40 questions · 25 minutes',
      scaled: '31–68',
    },
    {
      icon: <IconBook />,
      name: 'Reading Comprehension',
      color: 'bg-violet-50 text-violet-700 border-violet-100',
      iconBg: 'bg-violet-100 text-violet-700',
      parts: ['Multiple reading passages', 'Academic & informational texts', 'Inference & vocabulary questions'],
      stats: '50 questions · 55 minutes',
      scaled: '31–67',
    },
  ];

  const STEPS = [
    { n: '01', title: t('step1_title'), body: t('step1_body') },
    { n: '02', title: t('step2_title'), body: t('step2_body') },
    { n: '03', title: t('step3_title'), body: t('step3_body') },
    { n: '04', title: t('step4_title'), body: t('step4_body') },
  ];

  const FEATURES = [
    { icon: <IconChart />, title: t('feat_score_title'), body: t('feat_score_body') },
    { icon: <IconClock />, title: t('feat_timed_title'), body: t('feat_timed_body') },
    { icon: <IconBook />, title: t('feat_lines_title'), body: t('feat_lines_body') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #063d61 0%, #08507f 50%, #0a6aad 100%)' }}>
        {/* decorative dots */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', transform: 'translate(30%, -40%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* left */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-8">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
                {t('hero_badge')}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
                {t('hero_title_1')}<br />
                <span style={{ color: '#f59e0b' }}>TOEFL ITP</span><br />
                {t('hero_title_3')}
              </h1>

              <p className="text-lg text-blue-100 mb-10 max-w-lg leading-relaxed">
                {t('hero_subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-[#08507f] bg-white hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  {user ? t('hero_cta_dashboard') : t('hero_cta_start')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white border-2 border-white/30 hover:bg-white/10 transition-all"
                >
                  {t('hero_cta_plans')}
                </Link>
              </div>

              {/* trust row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-blue-100">
                {[t('hero_trust_1'), t('hero_trust_2'), t('hero_trust_3')].map(trust => (
                  <span key={trust} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    {trust}
                  </span>
                ))}
              </div>
            </div>

            {/* right — score card mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <Image src="/logo.png" alt="English with Arik" width={44} height={44} className="rounded-full" unoptimized />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">ITP Ready</p>
                    <p className="text-xs text-slate-500">by English with Arik</p>
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Scaled Score</p>
                <div className="text-7xl font-black tracking-tight mb-1" style={{ color: '#08507f' }}>567</div>
                <p className="text-sm text-slate-500 mb-6">out of 677</p>
                <div className="space-y-3">
                  {[
                    { label: 'Listening', raw: 47, scaled: 56, max: 68 },
                    { label: 'Structure', raw: 34, scaled: 58, max: 68 },
                    { label: 'Reading', raw: 43, scaled: 55, max: 67 },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{s.label}</span>
                        <span className="font-bold text-slate-900">{s.scaled}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(s.scaled / s.max) * 100}%`, background: 'linear-gradient(90deg, #08507f, #2563eb)' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <span className="text-xs text-slate-400">Practice result · TOEFL ITP Level 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DISCLAIMER NOTICE BAR ══════════════════════════ */}
      <div className="bg-amber-50 border-y border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-center gap-3">
          <svg width="18" height="18" style={{ flexShrink: 0, color: '#d97706' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <p className="text-sm text-amber-800">
            <span className="font-bold">{t('disclaimer_text')}</span>
            {' '}{t('disclaimer_sub')}
          </p>
        </div>
      </div>

      {/* ═══ HOW IT WORKS ════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">{t('how_label')}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t('how_title')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-slate-200 z-0" style={{ width: 'calc(100% - 2rem)', left: '60%' }} />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-5" style={{ background: 'linear-gradient(135deg, #08507f, #0a6aad)' }}>
                    {step.n}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEST SECTIONS ═══════════════════════════════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">{t('sections_label')}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t('sections_title')}</h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
              {t('sections_subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {SECTIONS.map(s => (
              <div key={s.name} className={`card p-8 border ${s.color.split(' ').slice(2).join(' ')} hover:shadow-md transition-shadow`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${s.iconBg}`}>
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{s.name}</h3>
                <p className="text-sm font-medium text-slate-400 mb-5">{s.stats}</p>
                <ul className="space-y-2.5 mb-6">
                  {s.parts.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <IconCheck />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">{t('sections_score_range_item')}<span className="font-bold text-slate-600">{s.scaled}</span></p>
                </div>
              </div>
            ))}
          </div>

          {/* total score */}
          <div className="mt-10 text-center">
            <div className="inline-block bg-white rounded-2xl border border-slate-200 shadow-sm px-10 py-5">
              <p className="text-sm text-slate-400 mb-1">{t('sections_score_range_label')}</p>
              <p className="text-4xl font-black" style={{ color: '#08507f' }}>310 – 677</p>
              <p className="text-xs text-slate-400 mt-1">{t('sections_score_level')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-white" style={{ background: 'linear-gradient(135deg, #08507f, #2563eb)' }}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #063d61 0%, #08507f 100%)' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-8">
            <Image src="/logo.png" alt="English with Arik" width={72} height={72} className="rounded-full shadow-lg" unoptimized />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            {t('cta_title_1')}<br />
            <span style={{ color: '#f59e0b' }}>{t('cta_title_2')}</span>
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {t('cta_body')}
          </p>
          <a
            href="https://englishwitharik.com/toefl-itp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-bold text-[#08507f] bg-white hover:bg-yellow-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-[0.98]"
          >
            {t('cta_button')}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
