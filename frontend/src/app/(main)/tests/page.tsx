'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Test } from '@/types/test';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HiClock,
  HiAcademicCap,
  HiLockOpen,
  HiSparkles,
  HiSearch,
  HiBookOpen,
  HiOutlineVolumeUp,
  HiOutlineTemplate,
} from 'react-icons/hi';
import { getExamConfig } from '@/config/examConfig';


export default function TestCatalogPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tests, setTests]           = useState<Test[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState<'full' | 'sections'>('full');
  const examConfig = getExamConfig('toefl_itp');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'sections') {
        setActiveTab('sections');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchTests() {
      try {
        const response   = await api.get('/tests');
        const testsArray = response.data?.rows || [];
        setTests(Array.isArray(testsArray) ? testsArray : []);
      } catch {
        setError('Failed to load tests');
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  const filteredTests = tests.filter((test) =>
    test.testType === 'toefl_itp' &&
    (test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const freeTests    = filteredTests.filter((test) => test.isFree);
  const premiumTests = filteredTests.filter((test) => !test.isFree);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-6xl mx-auto">
        <div className="h-48 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-100 rounded-lg w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-slate-100 rounded-xl h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white bg-brand-gradient shadow-2xl">
        {/* decorative dots & glows */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', transform: 'translate(30%, -40%)' }} />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8 lg:items-center">
          {/* Left Side: Title */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                <HiBookOpen className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-100">{t('tests_library_label')}</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-0 tracking-tight">
              {t('tests_choose_title')}
            </h1>
          </div>

          {/* Right Side: Free access banner / Upgrade */}
          {user && (
            <div className="flex-shrink-0 lg:max-w-xs w-full lg:w-auto flex items-center justify-between lg:justify-start gap-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-5 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#08507f] shadow-lg">
                  <HiLockOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200">{t('tests_free_access')}</p>
                  <p className="text-sm font-bold text-white">
                    <span className="text-lg font-black text-amber-400">{user.freeTestsRemaining}</span>{' '}
                    {t('tests_remaining')}
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-sm font-bold text-[#08507f] hover:bg-blue-50 transition-all shadow-lg active:scale-95"
              >
                {t('tests_upgrade')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('tests_search_placeholder').replace('{exam}', examConfig.name)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:border-[#08507f] focus:ring-2 focus:ring-[#e8f4fd] focus:outline-none transition-all"
        />
      </div>

      {/* ── Tabs Selector ────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('full')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'full'
              ? 'border-[#08507f] text-[#08507f]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tests_tab_full')}
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'sections'
              ? 'border-[#08507f] text-[#08507f]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tests_tab_sections')}
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          <span className="shrink-0 font-bold">!</span>
          {error}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {filteredTests.length === 0 && !error ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-slate-200 bg-white">
          <HiAcademicCap className="mx-auto h-14 w-14 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">{t('tests_no_found_title')}</h3>
          <p className="text-slate-500 text-sm mb-5">{t('tests_no_found_body')}</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-5 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {t('tests_clear_search')}
          </button>
        </div>
      ) : activeTab === 'full' ? (
        <>
          {/* Free tests */}
          {freeTests.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <HiSparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">{t('tests_free_section')}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
                  {freeTests.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {freeTests.map((test) => <TestCard key={test.id} test={test} minLabel={t('tests_min_label')} />)}
              </div>
            </div>
          )}

          {/* Premium tests */}
          {premiumTests.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <HiAcademicCap className="w-5 h-5 text-[#08507f]" />
                <h2 className="text-xl font-bold text-slate-900">{t('tests_premium_section')}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e8f4fd] border border-[#08507f]/10 text-[#08507f] text-xs font-bold">
                  {premiumTests.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {premiumTests.map((test) => <TestCard key={test.id} test={test} minLabel={t('tests_min_label')} />)}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Section practice tabs view */
        <div className="space-y-12 animate-fadeIn">
          {/* Listening Group */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <HiOutlineVolumeUp className="w-5 h-5 text-blue-600 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-900">{t('tests_group_listening')}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                {filteredTests.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTests.map((test) => (
                <SectionPracticeCard
                  key={`listening-${test.id}`}
                  test={test}
                  sectionType="listening"
                  icon={HiOutlineVolumeUp}
                  accentColor="bg-blue-500"
                  iconBg="bg-blue-100 text-blue-700"
                  detailText="50 questions · 35 min"
                />
              ))}
            </div>
          </div>

          {/* Structure Group */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <HiOutlineTemplate className="w-5 h-5 text-teal-600 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-900">{t('tests_group_structure')}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold">
                {filteredTests.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTests.map((test) => (
                <SectionPracticeCard
                  key={`structure-${test.id}`}
                  test={test}
                  sectionType="structure"
                  icon={HiOutlineTemplate}
                  accentColor="bg-teal-500"
                  iconBg="bg-teal-100 text-teal-700"
                  detailText="40 questions · 25 min"
                />
              ))}
            </div>
          </div>

          {/* Reading Group */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <HiBookOpen className="w-5 h-5 text-violet-600 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-900">{t('tests_group_reading')}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold">
                {filteredTests.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTests.map((test) => (
                <SectionPracticeCard
                  key={`reading-${test.id}`}
                  test={test}
                  sectionType="reading"
                  icon={HiBookOpen}
                  accentColor="bg-violet-500"
                  iconBg="bg-violet-100 text-violet-700"
                  detailText="50 questions · 55 min"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TestCard({ test, minLabel }: { test: Test; minLabel: string }) {
  const metadata = ['3 Sections', '140 Questions', '310–677 Scale'];

  return (
    <Link
      href={`/tests/${test.id}?mode=full`}
      className="group card-premium flex flex-col overflow-hidden"
    >
      {/* Top accent gradient */}
      <div className="h-1.5 w-full bg-brand-gradient" />

      <div className="flex flex-col flex-1 p-6">
        {/* Avatar + badge row */}
        <div className="flex items-start justify-between mb-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white text-lg font-black shadow-lg"
            style={{ background: 'linear-gradient(135deg, #08507f 0%, #063d61 100%)' }}
          >
            T
          </div>
          {test.isFree ? (
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
              Free
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
              <HiSparkles className="w-3 h-3" />
              Pro
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-slate-900 mb-4 line-clamp-2 min-h-[3rem] group-hover:text-[#08507f] transition-colors leading-tight">
          {test.title}
        </h3>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {metadata.map((item) => (
            <span
              key={item}
              className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-500 border border-slate-100"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <HiClock className="w-4 h-4" />
            <span className="text-xs font-bold">{test.durationMinutes} {minLabel}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#08507f]/40 group-hover:text-[#08507f] transition-colors">
            TOEFL ITP
          </span>
        </div>
      </div>
    </Link>
  );
}

function SectionPracticeCard({
  test,
  sectionType,
  icon: Icon,
  accentColor,
  iconBg,
  detailText,
}: {
  test: Test;
  sectionType: string;
  icon: React.ElementType;
  accentColor: string;
  iconBg: string;
  detailText: string;
}) {
  return (
    <Link
      href={`/tests/${test.id}?mode=practice&section=${sectionType}`}
      className="group card-premium flex flex-col overflow-hidden"
    >
      {/* Accent top gradient line */}
      <div className={`h-1.5 w-full ${accentColor}`} />

      <div className="flex flex-col flex-1 p-6">
        {/* Icon + Badge */}
        <div className="flex items-start justify-between mb-5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          {test.isFree ? (
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
              Free
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
              <HiSparkles className="w-3.5 h-3.5" />
              Pro
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-slate-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-[#08507f] transition-colors leading-tight">
          {test.title}
        </h3>

        {/* Detail text */}
        <p className="text-xs text-slate-400 mb-6 font-bold flex items-center gap-2">
          <HiClock className="w-4 h-4" />
          {detailText}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#08507f] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Start Practice <HiSearch className="rotate-90 w-3 h-3" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#08507f]/40">
            TOEFL ITP
          </span>
        </div>
      </div>
    </Link>
  );
}
