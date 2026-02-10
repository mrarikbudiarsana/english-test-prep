'use client';

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isFocusMode } = useLayout();

  return (
    <div className="min-h-screen bg-gray-50">
      {!isFocusMode && <Navbar />}
      <div className="flex">
        {!isFocusMode && <Sidebar />}
        <main className={`flex-1 ${!isFocusMode ? 'p-4 sm:p-6 lg:p-8' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <LayoutProvider>
        <LayoutContent>{children}</LayoutContent>
      </LayoutProvider>
    </AuthGuard>
  );
}
