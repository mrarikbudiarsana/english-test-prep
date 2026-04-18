'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HiHome,
  HiClipboardList,
  HiUsers,
  HiArrowLeft,
  HiCurrencyDollar,
  HiChartBar,
} from 'react-icons/hi';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: HiHome, exact: true },
  { href: '/admin/tests', label: 'Manage Tests', icon: HiClipboardList },
  { href: '/admin/users', label: 'Users', icon: HiUsers },
  { href: '/admin/results', label: 'Results', icon: HiChartBar },
  { href: '/admin/pricing', label: 'Pricing', icon: HiCurrencyDollar },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white lg:min-h-[calc(100vh-4rem)] shadow-sm">
      <div className="p-4 border-b border-gray-100 mb-2">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-[#08507f] mb-4 transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to Student App</span>
        </Link>
        <h2 className="text-xl font-bold text-[#08507f] tracking-tight">Admin Portal</h2>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Institutional Management</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {adminNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-[#08507f] text-white shadow-md shadow-[#08507f]/20 translate-x-1'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#08507f]'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#08507f] flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Administrator</p>
            <p className="text-[10px] text-slate-400">ITP Ready Platform</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
