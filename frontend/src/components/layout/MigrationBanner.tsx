'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { HiOutlineInformationCircle } from 'react-icons/hi';

export default function MigrationBanner() {
  const pathname = usePathname();
  const isTestPage = pathname?.includes('/take');

  if (isTestPage) return null;

  return (
    <div className="bg-[#f59e0b] text-white py-2.5 px-4 relative z-[60] shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
        <div className="flex items-center gap-2">
          <HiOutlineInformationCircle className="w-5 h-5 opacity-90 shrink-0" />
          <p className="text-sm font-bold tracking-tight">
            Important Migration Notice
          </p>
        </div>
        
        <div className="hidden sm:block w-px h-4 bg-white/30" />
        
        <p className="text-[13px] sm:text-sm font-medium">
          ITP Ready will be moving to <span className="font-extrabold underline underline-offset-2 tracking-tight">toeflitp.englishwitharik.com</span> on June 1st.
        </p>
        
        <div className="sm:ml-2">
          <span className="inline-block bg-white/20 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em]">
            Save the link
          </span>
        </div>
      </div>
    </div>
  );
}
