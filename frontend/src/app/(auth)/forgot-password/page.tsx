'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #063d61 0%, #08507f 50%, #0a6aad 100%)' }}
    >
      {/* decorative rings */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8">
          <Image src="/logo.png" alt="English with Arik" width={40} height={40} className="rounded-full" unoptimized />
          <div>
            <p className="font-extrabold text-[#08507f] text-sm">ITP Ready</p>
            <p className="text-[11px] text-slate-400">by English with Arik</p>
          </div>
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{t('forgot_title')}</h1>
        <p className="text-slate-500 text-sm mb-8">{t('forgot_subtitle')}</p>

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-medium">
              {t('forgot_success')}
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all shadow-lg hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #063d61, #08507f)' }}
            >
              ← {t('forgot_back')}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('forgot_email_label')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#08507f] focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': 'rgba(8,80,127,0.15)' } as any}
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{ background: 'linear-gradient(135deg, #063d61, #08507f)' }}
              >
                {loading ? t('forgot_sending') : t('forgot_send_btn')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                ← {t('forgot_back')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
