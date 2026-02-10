'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStats } from '@/types/api';
import { formatBand, formatDate, getBandColor, sectionTypeLabel } from '@/lib/utils';
import {
  HiClipboardList,
  HiTrendingUp,
  HiStar,
  HiClock,
} from 'react-icons/hi';

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
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.displayName || 'Student'}
          </h1>
          <p className="text-gray-500 mt-1">Track your IELTS preparation progress</p>
        </div>
        <Link
          href="/tests"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Take a Test
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <HiClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tests Taken</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalAttempts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <HiTrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Band Score</p>
              <p className={`text-2xl font-bold ${stats?.averageBand ? getBandColor(stats.averageBand) : 'text-gray-400'}`}>
                {stats?.averageBand ? formatBand(stats.averageBand) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <HiStar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Band Score</p>
              <p className={`text-2xl font-bold ${stats?.bestBand ? getBandColor(stats.bestBand) : 'text-gray-400'}`}>
                {stats?.bestBand ? formatBand(stats.bestBand) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Averages */}
      {stats?.sectionAverages && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Performance</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(['listening', 'reading', 'writing', 'speaking'] as const).map((section) => {
              const avg = stats.sectionAverages[section];
              return (
                <div key={section} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{sectionTypeLabel(section)}</p>
                  <p className={`text-2xl font-bold ${avg ? getBandColor(avg) : 'text-gray-400'}`}>
                    {avg ? formatBand(avg) : '-'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tests</h2>
        {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {stats.recentAttempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/results/${attempt.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{attempt.testTitle}</p>
                  <p className="text-sm text-gray-500">
                    {attempt.completedAt ? formatDate(attempt.completedAt) : 'In progress'}
                  </p>
                </div>
                <div className="text-right">
                  {attempt.overallBand ? (
                    <span className={`text-lg font-bold ${getBandColor(attempt.overallBand)}`}>
                      {formatBand(attempt.overallBand)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 capitalize">{attempt.status}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <HiClock className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-gray-500">No tests taken yet</p>
            <Link
              href="/tests"
              className="mt-3 inline-block text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Take your first test
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
