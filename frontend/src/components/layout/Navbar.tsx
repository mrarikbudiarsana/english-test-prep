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
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50 group-hover:shadow-xl group-hover:shadow-indigo-300/50 transition-all group-hover:scale-105">
                <span className="text-white font-bold text-sm">ET</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                EnglishTest
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl font-semibold transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tests"
                  className="px-4 py-2 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl font-semibold transition-all"
                >
                  Practice Tests
                </Link>
                <Link
                  href="/subscription"
                  className="px-4 py-2 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl font-semibold transition-all"
                >
                  Pricing
                </Link>

                {/* User menu */}
                <div className="relative ml-3">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center border border-indigo-200/50">
                      <HiUser className="w-5 h-5 text-indigo-600" />
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-20 overflow-hidden">
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="flex items-center px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <HiCog className="w-4 h-4 mr-3 text-slate-500" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
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
                  className="px-4 py-2 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl font-semibold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="ml-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50"
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
        <div className="md:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/tests"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Practice Tests
                </Link>
                <Link
                  href="/subscription"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2.5 text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 rounded-xl font-semibold transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <div className="pt-2 mt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-center font-semibold shadow-lg shadow-indigo-200/50 hover:shadow-xl"
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
