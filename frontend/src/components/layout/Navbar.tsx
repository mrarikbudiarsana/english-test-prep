'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinkClass =
    'px-4 py-2 text-slate-600 hover:text-[#08507f] hover:bg-[#e8f4fd] rounded-xl font-semibold transition-all text-sm';

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="English with Arik"
              width={40}
              height={40}
              className="rounded-full group-hover:scale-105 transition-transform"
              unoptimized
            />
            <div className="hidden sm:block leading-tight">
              <p className="font-extrabold text-[#08507f] text-sm tracking-tight">ITP Ready</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">by English with Arik</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link href="/dashboard" className={navLinkClass}>{t('nav_dashboard')}</Link>
                <Link href="/tests" className={navLinkClass}>{t('nav_practice_tests')}</Link>
                <Link href="/pricing" className={navLinkClass}>{t('nav_pricing')}</Link>

                {/* Language switcher */}
                <LanguageSwitcher className="ml-1" />

                {/* User dropdown */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#e8f4fd] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#08507f]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                      {user.displayName || user.email}
                    </span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-20">
                        <div className="px-4 py-2 border-b border-slate-100 mb-1">
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                        {user.role === 'admin' && (
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium" onClick={() => setUserMenuOpen(false)}>
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {t('nav_admin_panel')}
                          </Link>
                        )}
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium" onClick={() => setUserMenuOpen(false)}>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                          {t('nav_settings')}
                        </Link>
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={() => { setUserMenuOpen(false); logout(); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                            {t('nav_sign_out')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <LanguageSwitcher className="mr-1" />
                <Link href="/login" className={navLinkClass}>{t('nav_sign_in')}</Link>
                <Link
                  href="/register"
                  className="ml-1 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #08507f, #0a6aad)' }}
                >
                  {t('nav_get_started')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1">
          {user ? (
            <>
              <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#e8f4fd] hover:text-[#08507f] rounded-xl" onClick={() => setMobileMenuOpen(false)}>{t('nav_dashboard')}</Link>
              <Link href="/tests" className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#e8f4fd] hover:text-[#08507f] rounded-xl" onClick={() => setMobileMenuOpen(false)}>{t('nav_practice_tests')}</Link>
              <Link href="/pricing" className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#e8f4fd] hover:text-[#08507f] rounded-xl" onClick={() => setMobileMenuOpen(false)}>{t('nav_pricing')}</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#e8f4fd] hover:text-[#08507f] rounded-xl" onClick={() => setMobileMenuOpen(false)}>{t('nav_admin_panel')}</Link>
              )}
              <Link href="/settings" className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#e8f4fd] hover:text-[#08507f] rounded-xl" onClick={() => setMobileMenuOpen(false)}>{t('nav_settings')}</Link>
              <div className="px-4 py-2">
                <LanguageSwitcher />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl">{t('nav_sign_out')}</button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(false)}>{t('nav_sign_in')}</Link>
              <Link href="/register" className="block px-4 py-2.5 text-sm font-bold text-white text-center rounded-xl" style={{ background: 'linear-gradient(135deg, #08507f, #0a6aad)' }} onClick={() => setMobileMenuOpen(false)}>{t('nav_get_started')}</Link>
              <div className="px-4 py-2">
                <LanguageSwitcher />
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
