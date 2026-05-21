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
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStatus = async () => {
      // Don't fetch if we're already on the maintenance page
      if (pathname.startsWith('/maintenance')) {
        return;
      }
      
      try {
        const response = await api.get('/system/status');
        if (isMounted) {
          setIsMaintenanceMode(response.data.maintenanceMode);
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        if (isMounted) {
          setIsMaintenanceMode(false);
        }
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/maintenance')) {
      setChecking(false);
      return;
    }

    if (isMaintenanceMode === null) {
      return; // Still fetching
    }

    if (!isMaintenanceMode) {
      setChecking(false);
      return;
    }

    // It is maintenance mode, wait for auth to check if user is admin
    if (authLoading) {
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/maintenance');
    } else {
      setChecking(false);
    }
  }, [pathname, isMaintenanceMode, authLoading, user, router]);

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
