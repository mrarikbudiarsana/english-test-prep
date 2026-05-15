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
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';

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
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setMaintenanceMode(response.data.maintenanceMode);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const toggleMaintenance = async () => {
    try {
      setUpdatingSettings(true);
      const newValue = !maintenanceMode;
      await api.post('/admin/settings', { maintenanceMode: newValue });
      setMaintenanceMode(newValue);
      toast.success(newValue ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update maintenance mode');
    } finally {
      setUpdatingSettings(false);
    }
  };

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

        </div>
      </div>

      {/* System Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">System Management</h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-50 text-red-600">
                <HiOutlineWrenchScrewdriver className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Maintenance Mode</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md">
                  When enabled, all non-admin users will be redirected to a maintenance page. 
                  Admins can still access the entire platform for testing and configuration.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                maintenanceMode 
                  ? 'bg-red-100 text-red-700 animate-pulse' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {maintenanceMode ? 'Active (Site Blocked)' : 'Inactive (Live)'}
              </div>
              
              <button
                onClick={toggleMaintenance}
                disabled={updatingSettings}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  maintenanceMode
                    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                } disabled:opacity-50 flex items-center gap-2`}
              >
                {updatingSettings ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : null}
                {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
