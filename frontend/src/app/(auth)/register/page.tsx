'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const NAVY = '#08507f';
const NAVY_DARK = '#063d61';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-[#08507f] focus:ring-2 focus:ring-[#08507f]/20 bg-white placeholder:text-slate-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

export default function RegisterPage() {
  const { register, loginWithGoogle, user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(email, password, displayName);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)` }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 text-white">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="English with Arik" width={44} height={44} className="rounded-full" unoptimized />
          <div>
            <p className="font-extrabold text-white text-sm">ITP Ready</p>
            <p className="text-[11px] text-blue-200">by English with Arik</p>
          </div>
        </Link>

        <div>
          <h2 className="text-3xl font-extrabold mb-4 leading-snug">
            Start your TOEFL ITP<br />
            <span style={{ color: '#f59e0b' }}>journey today.</span>
          </h2>
          <ul className="space-y-3 text-sm text-blue-100">
            {[
              'Full-length Listening, Structure & Reading tests',
              'Authentic 310–677 scaled scoring',
              'Audio plays once — just like the real exam',
              'Instant score breakdown after each test',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <svg width="16" height="16" className="shrink-0 mt-0.5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { n: '310–677', l: 'Score Scale' },
            { n: '140 Qs', l: 'Per Full Test' },
            { n: '115 min', l: 'Total Duration' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-4">
              <p className="text-xl font-black">{s.n}</p>
              <p className="text-xs text-blue-200 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#f8fafc]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <Image src="/logo.png" alt="English with Arik" width={40} height={40} className="rounded-full" unoptimized />
            <div>
              <p className="font-extrabold text-[#08507f] text-sm">ITP Ready</p>
              <p className="text-[11px] text-slate-400">by English with Arik</p>
            </div>
          </Link>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-8">
            Free to start. Practice TOEFL ITP today.{' '}
            <Link href="/login" className="font-semibold" style={{ color: NAVY }}>Sign in instead</Link>
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <svg width="16" height="16" className="mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>Full Name</label>
              <input id="name" type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email address</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="At least 6 characters" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
              <input id="confirmPassword" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Repeat your password" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})` }}
            >
              {loading ? 'Creating account…' : 'Create Free Account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-3 px-4 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 disabled:opacity-50 font-semibold text-slate-700 text-sm transition-all flex items-center justify-center gap-3 bg-white shadow-sm"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
