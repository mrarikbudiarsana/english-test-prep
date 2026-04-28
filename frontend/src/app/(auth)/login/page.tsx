'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { login, loginWithGoogle, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #063d61 0%, #08507f 50%, #0a6aad 100%)' }}
    >
      {/* decorative rings */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />

      {/* card */}
      <div className="relative w-full max-w-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[560px]">

        {/* ── left: brand panel ─────────────────────────────── */}
        <div
          className="hidden md:flex flex-col justify-between w-[42%] p-10 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #063d61 0%, #08507f 100%)' }}
        >
          {/* dot grid */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          {/* top: logo */}
          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="English with Arik" width={48} height={48} className="rounded-full shadow-lg" unoptimized />
              <div>
                <p className="font-extrabold text-white text-base leading-tight">ITP Ready</p>
                <p className="text-blue-200 text-xs">by English with Arik</p>
              </div>
            </Link>
          </div>

          {/* middle: headline */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl font-extrabold leading-snug">
              {t('login_brand_headline')}
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              {t('login_brand_sub')}
            </p>
          </div>

          {/* bottom: stats */}
          <div className="relative z-10 grid grid-cols-3 gap-3">
            {[
              { n: '310–677', l: t('login_stat_scale') },
              { n: '140', l: t('login_stat_questions') },
              { n: '115 min', l: t('login_stat_duration') },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <p className="text-lg font-black">{s.n}</p>
                <p className="text-[10px] text-blue-200 mt-0.5 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── right: form panel ──────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10">

          {/* mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 md:hidden">
            <Image src="/logo.png" alt="English with Arik" width={36} height={36} className="rounded-full" unoptimized />
            <p className="font-extrabold text-[#08507f] text-sm">ITP Ready</p>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900">{t('login_welcome')}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {t('login_subtitle')}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-sm disabled:opacity-50 mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('login_google')}
          </button>

          {/* divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">{t('login_or_email')}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* error */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <svg width="16" height="16" style={{ flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('login_email_label')}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#08507f] focus:ring-2 transition-all"
                style={{ '--tw-ring-color': 'rgba(8,80,127,0.15)' } as any}
              />
            </div>

            {/* password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">{t('login_password_label')}</label>
                <Link href="/forgot-password" className="text-xs font-medium text-[#08507f] hover:underline">
                  {t('login_forgot')}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm bg-slate-50 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#08507f] focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': 'rgba(8,80,127,0.15)' } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
              style={{ background: 'linear-gradient(135deg, #063d61, #08507f)' }}
            >
              {loading ? t('login_signing_in') : t('login_button')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('login_no_account')}{' '}
            <Link href="/register" className="font-bold text-[#08507f] hover:underline">
              {t('login_create_free')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
