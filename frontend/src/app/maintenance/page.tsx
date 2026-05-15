'use client';

import React from 'react';
import Link from 'next/link';
import { HiOutlineWrenchScrewdriver, HiChevronRight } from 'react-icons/hi2';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-50 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Animated Icon */}
        <div className="mb-12 relative inline-block">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl scale-150 animate-pulse" />
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-blue-50/50 transform hover:scale-105 transition-transform duration-500">
            <HiOutlineWrenchScrewdriver className="w-20 h-20 text-[#08507f] animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Floating decorative elements */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-orange-400 rounded-xl shadow-lg shadow-orange-500/20 animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 animate-bounce" style={{ animationDelay: '1.2s' }} />
        </div>

        {/* Content */}
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
          System <span className="text-[#08507f] bg-clip-text">Maintenance</span>
        </h1>
        
        <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg mx-auto font-medium">
          ITP Ready is currently undergoing scheduled maintenance to improve your learning experience. We'll be back shortly!
        </p>

        {/* Status card */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-xl shadow-black/5 mb-12 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Current Status</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Upgrade in Progress</h3>
          <p className="text-slate-500 text-sm">We are updating our question engine and licensing systems.</p>
        </div>

        {/* Footer/Contact */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link 
            href="/"
            className="flex items-center gap-2 text-[#08507f] font-bold hover:underline group"
          >
            Refresh Platform <HiChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-300" />
          <p className="text-sm text-slate-400">
            Need urgent help? <a href="mailto:arik@example.com" className="text-slate-600 hover:text-[#08507f] transition-colors font-medium">Contact Support</a>
          </p>
        </div>
      </div>
      
      {/* Bottom text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">ITP Ready — by English with Arik</p>
      </div>
    </div>
  );
}
