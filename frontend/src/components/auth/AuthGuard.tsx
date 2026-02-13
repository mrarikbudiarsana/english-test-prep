'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && requireAdmin && user.role !== 'admin') {
      router.push('/dashboard');
    }
    // Redirect to exam selection if user hasn't selected an exam
    // (but not if they're already on the select-exam page)
    if (!loading && user && !user.preferredExamType && pathname !== '/select-exam') {
      router.push('/select-exam');
    }
  }, [user, loading, requireAdmin, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && user.role !== 'admin') return null;

  return <>{children}</>;
}
