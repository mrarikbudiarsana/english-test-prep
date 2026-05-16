'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';
import AnnouncementBanner from '@/components/layout/AnnouncementBanner';

import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isFocusMode } = useLayout();
  const pathname = usePathname();

  // Check if we are on a test taking page
  // Pattern: /tests/[testId]/take
  const isTestTakingPage = pathname?.match(/\/tests\/[^/]+\/take/);

  // Show Navbar if NOT in focus mode AND NOT on a test taking page
  const showNavbar = !isFocusMode && !isTestTakingPage;

  return (
    <div className="min-h-screen bg-gray-50">
      <AnnouncementBanner />
      {showNavbar && <Navbar />}
      <div className="flex">
        <main
          className={`flex-1 ${
            // If it's a test page, we want full width/height (no padding)
            // If it's a normal page, we add standard padding
            // Focus mode also traditionally removes padding/navbar, so we can respect that too if needed,
            // but primarily we care about isTestTakingPage here.
            isTestTakingPage ? '' : (!isFocusMode ? 'p-4 sm:p-6 lg:p-8' : '')
            }`}
        >
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
