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
} from 'react-icons/hi';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: HiHome, exact: true },
  { href: '/admin/tests', label: 'Manage Tests', icon: HiClipboardList },
  { href: '/admin/users', label: 'Users', icon: HiUsers },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-gray-50 lg:min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </Link>
        <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
