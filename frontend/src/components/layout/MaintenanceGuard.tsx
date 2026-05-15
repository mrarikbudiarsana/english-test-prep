'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      // Don't check on maintenance page itself
      if (pathname.startsWith('/maintenance')) {
        setChecking(false);
        return;
      }

      try {
        const response = await api.get('/system/status');
        const isMaintenance = response.data.maintenanceMode;

        if (isMaintenance && user?.role !== 'admin') {
          router.push('/maintenance');
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        setChecking(false);
      }
    };

    if (!authLoading) {
      checkMaintenance();
    }
  }, [pathname, user, authLoading, router]);

  if (checking && !pathname.startsWith('/maintenance')) {
    // Show nothing or a small loader while checking
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#08507f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
