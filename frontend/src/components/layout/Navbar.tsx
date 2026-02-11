'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { HiMenu, HiX, HiUser, HiLogout, HiCog } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-[#e8ecef] sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <img
                src="https://scobvornehcncgsqngag.supabase.co/storage/v1/object/public/Public/Logo%20fix.svg"
                alt="EnglishTest"
                className="h-12 w-auto group-hover:scale-105 transition-all"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-[#5a6c7d] hover:text-[#e4002b] hover:bg-[#ffe5ea]/30 rounded-xl font-semibold transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tests"
                  className="px-4 py-2 text-[#5a6c7d] hover:text-[#e4002b] hover:bg-[#ffe5ea]/30 rounded-xl font-semibold transition-all"
                >
                  Practice Tests
                </Link>
                <Link
                  href="/pricing"
                  className="px-4 py-2 text-[#5a6c7d] hover:text-[#e4002b] hover:bg-[#ffe5ea]/30 rounded-xl font-semibold transition-all"
                >
                  Pricing
                </Link>

                {/* User menu */}
                <div className="relative ml-3">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-[#2c3e50] hover:bg-[#f5f7f9] rounded-xl transition-all"
                  >
                    <div className="w-9 h-9 bg-[#ffe5ea] rounded-xl flex items-center justify-center border border-[#e4002b]/20">
                      <HiUser className="w-5 h-5 text-[#e4002b]" />
                    </div>
                    <span className="font-semibold text-sm max-w-[150px] truncate">
                      {user.displayName || user.email}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#e8ecef] py-2 z-20 overflow-hidden">
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="flex items-center px-4 py-2.5 text-sm font-semibold text-[#2c3e50] hover:bg-[#ffe5ea]/30 transition-all"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <HiCog className="w-4 h-4 mr-3 text-[#5a6c7d]" />
                            Admin Panel
                          </Link>
                        )}
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2.5 text-sm font-semibold text-[#2c3e50] hover:bg-[#ffe5ea]/30 transition-all"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <HiUser className="w-4 h-4 mr-3 text-[#5a6c7d]" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm font-semibold text-[#e4002b] hover:bg-[#ffe5ea]/50 transition-all"
                        >
                          <HiLogout className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[#5a6c7d] hover:text-[#e4002b] hover:bg-[#ffe5ea]/30 rounded-xl font-semibold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="ml-2 px-5 py-2.5 bg-[#e4002b] text-white rounded-xl hover:bg-[#e4002b]/90 transition-all font-semibold shadow-lg shadow-[#ffe5ea] hover:shadow-xl"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              {mobileMenuOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e8ecef] bg-white/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2.5 text-[#2c3e50] hover:bg-[#ffe5ea]/30 hover:text-[#e4002b] rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/tests"
                  className="block px-4 py-2.5 text-[#2c3e50] hover:bg-[#ffe5ea]/30 hover:text-[#e4002b] rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Practice Tests
                </Link>
                <Link
                  href="/pricing"
                  className="block px-4 py-2.5 text-[#2c3e50] hover:bg-[#ffe5ea]/30 hover:text-[#e4002b] rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2.5 text-[#2c3e50] hover:bg-[#ffe5ea]/30 hover:text-[#e4002b] rounded-xl font-semibold transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="block px-4 py-2.5 text-[#2c3e50] hover:bg-[#ffe5ea]/30 hover:text-[#e4002b] rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <div className="pt-2 mt-2 border-t border-[#e8ecef]">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2.5 text-[#e4002b] hover:bg-[#ffe5ea]/50 rounded-xl font-semibold transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2.5 text-[#2c3e50] hover:bg-[#f5f7f9] rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2.5 bg-[#e4002b] text-white rounded-xl text-center font-semibold shadow-lg shadow-[#ffe5ea] hover:shadow-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
