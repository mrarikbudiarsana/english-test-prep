'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { HiMenu, HiX, HiUser, HiLogout, HiCog, HiSwitchHorizontal } from 'react-icons/hi';
import { examConfigs, getAllExamTypes } from '@/config/examConfig';
import { ExamType } from '@/types/user';

export default function Navbar() {
  const { user, logout, updateExamPreference } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [examMenuOpen, setExamMenuOpen] = useState(false);
  const [isChangingExam, setIsChangingExam] = useState(false);

  const currentExam = user?.preferredExamType ? examConfigs[user.preferredExamType] : null;

  const handleExamChange = async (examType: ExamType) => {
    if (examType === user?.preferredExamType) {
      setExamMenuOpen(false);
      return;
    }
    setIsChangingExam(true);
    try {
      await updateExamPreference(examType);
      setExamMenuOpen(false);
    } catch (error) {
      console.error('Failed to change exam:', error);
    } finally {
      setIsChangingExam(false);
    }
  };

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
                {/* Exam Switcher */}
                {currentExam && (
                  <div className="relative mr-2">
                    <button
                      onClick={() => setExamMenuOpen(!examMenuOpen)}
                      disabled={isChangingExam}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${
                        examMenuOpen
                          ? 'bg-gray-100 border-gray-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${currentExam.colors.gradient} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {currentExam.shortName.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-gray-700">
                        {currentExam.shortName}
                      </span>
                      <HiSwitchHorizontal className="w-4 h-4 text-gray-400" />
                    </button>

                    {examMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setExamMenuOpen(false)}
                        />
                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-20">
                          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Switch Exam
                          </p>
                          {getAllExamTypes().map((examType) => {
                            const config = examConfigs[examType];
                            const isActive = examType === user.preferredExamType;
                            return (
                              <button
                                key={examType}
                                onClick={() => handleExamChange(examType)}
                                disabled={isChangingExam}
                                className={`flex items-center gap-3 w-full px-4 py-2.5 transition-all ${
                                  isActive
                                    ? 'bg-gray-100'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.colors.gradient} flex items-center justify-center text-white text-sm font-bold`}
                                >
                                  {config.shortName.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold text-sm text-gray-800">
                                    {config.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {config.scoreLabel}: {config.scoreRange.min}-{config.scoreRange.max}
                                  </p>
                                </div>
                                {isActive && (
                                  <span className="ml-auto text-emerald-500 text-xs font-semibold">
                                    Active
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

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
                    <div className="w-9 h-9 bg-[#ffe5ea] rounded-xl flex items-center justify-center border border-[#e4002b]/20 overflow-hidden">
                      {user.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={user.displayName || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiUser className="w-5 h-5 text-[#e4002b]" />
                      )}
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
                {/* Mobile Exam Switcher */}
                {currentExam && (
                  <Link
                    href="/select-exam"
                    className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-xl border border-gray-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentExam.colors.gradient} flex items-center justify-center text-white font-bold`}
                    >
                      {currentExam.shortName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{currentExam.name}</p>
                      <p className="text-xs text-gray-500">Tap to change exam</p>
                    </div>
                    <HiSwitchHorizontal className="w-5 h-5 text-gray-400" />
                  </Link>
                )}

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
