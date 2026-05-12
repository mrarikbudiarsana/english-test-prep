'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  HiUsers, 
  HiClipboardList, 
  HiChartBar, 
  HiCurrencyDollar,
  HiPlus
} from 'react-icons/hi';

interface AdminDashboardStats {
  totalTests: number;
  totalUsers: number;
  totalAttempts: number;
  locationStats?: {
    countries: Array<{ country: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.data || response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#08507f]">Admin Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#08507f]">Admin Overview</h1>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="text-[#08507f] hover:underline font-medium text-sm"
            >
              Try again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tests',
      value: stats?.totalTests ?? 0,
      icon: <HiClipboardList className="w-6 h-6 text-white" />,
      href: '/admin/tests',
      linkText: 'Manage Tests',
      colorClass: 'bg-[#08507f]',
    },
    {
      label: 'Registered Users',
      value: stats?.totalUsers ?? 0,
      icon: <HiUsers className="w-6 h-6 text-white" />,
      href: '/admin/users',
      linkText: 'Manage Users',
      colorClass: 'bg-orange-500',
    },
    {
      label: 'Test Attempts',
      value: stats?.totalAttempts ?? 0,
      icon: <HiChartBar className="w-6 h-6 text-white" />,
      href: '/admin/results',
      linkText: 'View Activity',
      colorClass: 'bg-slate-700',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#08507f]">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Management dashboard for ITP Ready institutional tests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.colorClass} shadow-lg shadow-black/5`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <Link
                href={card.href}
                className="text-sm font-bold text-[#08507f] hover:text-[#08507f]/80 transition-colors"
              >
                {card.linkText}
              </Link>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Geolocation Stats */}
      {stats?.locationStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Countries card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-[#08507f]" />
              Users by Country
            </h3>
            <div className="space-y-4">
              {stats.locationStats.countries.slice(0, 5).map((item) => {
                const percent = stats.totalUsers > 0 ? (item.count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={item.country} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">{item.country}</span>
                      <span className="text-slate-500 font-medium text-xs">
                        {item.count} {item.count === 1 ? 'user' : 'users'} ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#08507f] to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.locationStats.countries.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No location data available.</p>
              )}
            </div>
          </div>

          {/* Cities card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-orange-500" />
              Users by City
            </h3>
            <div className="space-y-4">
              {stats.locationStats.cities.slice(0, 5).map((item) => {
                const percent = stats.totalUsers > 0 ? (item.count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={item.city} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">{item.city}</span>
                      <span className="text-slate-500 font-medium text-xs">
                        {item.count} {item.count === 1 ? 'user' : 'users'} ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.locationStats.cities.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No location data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Quick Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/admin/tests/new"
              className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#08507f] to-[#0a629b] text-white shadow-lg shadow-blue-900/10 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                  <HiPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Create New Mock Test</p>
                  <p className="text-xs text-blue-100/70">Start building a new TOEFL ITP set</p>
                </div>
              </div>
              <HiPlus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <HiUsers className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">Review New Registrations</p>
                <p className="text-xs text-slate-400">Manage student access and roles</p>
              </div>
            </Link>

            <Link
              href="/admin/pricing"
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <HiCurrencyDollar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">Subscription Plans</p>
                <p className="text-xs text-slate-400">Configure institutional access levels</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
