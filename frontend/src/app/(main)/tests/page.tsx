'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Test } from '@/types/test';
import { useAuth } from '@/contexts/AuthContext';
import {
  HiClock,
  HiAcademicCap,
  HiLockOpen,
  HiSparkles,
  HiSearch,
  HiFilter,
  HiChevronRight,
  HiBookOpen,
} from 'react-icons/hi';

export default function TestCatalogPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'academic' | 'general_training'>('all');

  useEffect(() => {
    async function fetchTests() {
      try {
        const response = await api.get('/tests');
        const result = response.data;
        const testsArray = result?.rows || [];
        setTests(Array.isArray(testsArray) ? testsArray : []);
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Failed to load tests');
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  // Filtered tests logic
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || test.testType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Get featured/free tests for quick access
  const freeTests = filteredTests.filter(t => t.isFree);
  const premiumTests = filteredTests.filter(t => !t.isFree);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-slate-100 rounded w-1/4" />
          <div className="h-10 bg-slate-100 rounded w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#f8f9fa] to-[#f0f9ff] rounded-3xl p-8 md:p-10 border border-[#e8ecef]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#e8f4f8]/40 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#ffe5ea]/30 rounded-full blur-3xl -z-0" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <HiBookOpen className="w-6 h-6 text-[#e4002b]" />
            <p className="text-sm font-semibold text-[#e4002b] tracking-wide uppercase">Practice Library</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2c3e50] mb-4">
            Choose Your Test
          </h1>
          <p className="text-[#5a6c7d] text-lg max-w-2xl">
            Select from our collection of practice tests designed to help you achieve your target band score.
          </p>
        </div>
      </div>

      {/* Free Tests Remaining Banner */}
      {user && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <HiLockOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Free Access</p>
              <p className="text-slate-800 font-semibold">
                <span className="text-2xl text-emerald-600">{user.freeTestsRemaining}</span> tests remaining this month
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="hidden sm:block px-5 py-2.5 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 font-semibold transition-all border border-emerald-200 hover:border-emerald-300"
          >
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#e8ecef] focus:border-[#e4002b]/50 focus:ring-2 focus:ring-[#ffe5ea] focus:outline-none transition-all bg-white text-[#2c3e50] placeholder:text-[#5a6c7d]/50"
          />
        </div>
        <div className="relative">
          <HiFilter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="appearance-none w-full md:w-56 pl-12 pr-10 py-3.5 rounded-xl border border-[#e8ecef] bg-white focus:border-[#e4002b]/50 focus:ring-2 focus:ring-[#ffe5ea] focus:outline-none transition-all cursor-pointer text-[#2c3e50] font-medium"
          >
            <option value="all">All Types</option>
            <option value="academic">Academic</option>
            <option value="general_training">General Training</option>
          </select>
          <HiChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none rotate-90" />
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            ⚠️
          </div>
          {error}
        </div>
      )}

      {filteredTests.length === 0 && !error ? (
        <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
          <HiAcademicCap className="mx-auto h-20 w-20 text-slate-300 mb-6" />
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No tests found</h3>
          <p className="text-slate-500 mb-6">Try adjusting your filters or search query.</p>
          <button
            onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
            className="px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {/* Free Tests Section */}
          {freeTests.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <HiSparkles className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">Free Tests</h2>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                  {freeTests.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {freeTests.map((test) => (
                  <TestCard key={test.id} test={test} />
                ))}
              </div>
            </div>
          )}

          {/* Premium Tests Section */}
          {premiumTests.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <HiAcademicCap className="w-6 h-6 text-[#e4002b]" />
                <h2 className="text-2xl font-bold text-[#2c3e50]">Premium Tests</h2>
                <span className="px-3 py-1 bg-[#ffe5ea] text-[#e4002b] text-sm font-semibold rounded-full">
                  {premiumTests.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {premiumTests.map((test) => (
                  <TestCard key={test.id} test={test} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TestCard({ test }: { test: Test }) {
  // Determine gradient based on test type
  const gradients = {
    academic: {
      bg: 'from-[#e4002b] to-[#c40025]',
      light: 'from-[#ffe5ea] to-[#fff0f2]',
      border: 'border-[#e4002b]/20',
      text: 'text-[#e4002b]',
      badge: 'bg-[#ffe5ea] text-[#e4002b]',
    },
    general_training: {
      bg: 'from-[#3b82f6] to-[#2563eb]',
      light: 'from-[#e8f4f8] to-[#f0f9ff]',
      border: 'border-[#3b82f6]/20',
      text: 'text-[#2563eb]',
      badge: 'bg-[#e8f4f8] text-[#2563eb]',
    },
  };

  const theme = test.testType === 'academic' ? gradients.academic : gradients.general_training;

  return (
    <Link
      href={`/tests/${test.id}`}
      className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 flex flex-col"
    >
      {/* Gradient Header */}
      <div className={`h-2 bg-gradient-to-r ${theme.bg}`} />

      <div className="p-6 flex flex-col flex-1">
        {/* Top Section */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.bg} flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform`}>
            {test.testType === 'academic' ? 'A' : 'G'}
          </div>
          {test.isFree ? (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
              FREE
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm flex items-center gap-1">
              <HiSparkles className="w-3 h-3" />
              PRO
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-lg font-bold text-[#2c3e50] group-hover:${theme.text} transition-colors mb-2 line-clamp-2 min-h-[3.5rem]`}>
          {test.title}
        </h3>

        {/* Description */}
        {test.description && (
          <p className="text-[#5a6c7d] text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">
            {test.description}
          </p>
        )}

        {/* Footer */}
        <div className={`pt-4 mt-auto border-t ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2 text-[#5a6c7d]">
            <HiClock className="w-4 h-4" />
            <span className="text-sm font-semibold">{test.durationMinutes} min</span>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>
            {test.testType === 'general_training' ? 'General' : 'Academic'}
          </span>
        </div>
      </div>

      {/* Hover Effect - Subtle Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.light} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -z-10`} />
    </Link>
  );
}
