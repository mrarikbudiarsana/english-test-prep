'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, Sparkles, ExternalLink, MessageCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export interface TestCreditGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  testTitle?: string;
  mode: 'full' | 'section_practice';
  sectionType?: string;
  isFree?: boolean;
  onConfirmStart: (email: string) => Promise<void>;
}

export default function TestCreditGateModal({
  isOpen,
  onClose,
  defaultEmail = '',
  testTitle = 'TOEFL ITP Mock Test',
  mode,
  sectionType,
  isFree = false,
  onConfirmStart,
}: TestCreditGateModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(defaultEmail);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [checkedEmail, setCheckedEmail] = useState<string>('');

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    if (isOpen && email && email.includes('@')) {
      checkBalance(email);
    }
  }, [isOpen]);

  const checkBalance = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.includes('@')) return;
    setChecking(true);
    try {
      const response = await api.get(`/credits/balance?email=${encodeURIComponent(targetEmail.trim())}`);
      const data = response.data?.data || response.data;
      setCreditBalance(data?.credits ?? 0);
      setCheckedEmail(targetEmail.trim().toLowerCase());
    } catch (err) {
      console.error('Failed to check credit balance:', err);
      setCreditBalance(0);
      setCheckedEmail(targetEmail.trim().toLowerCase());
    } finally {
      setChecking(false);
    }
  };

  const handleStart = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setStarting(true);
    try {
      await onConfirmStart(email.trim().toLowerCase());
      onClose();
    } catch (err: any) {
      console.error('Failed to start test:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Failed to start test';
      toast.error(errMsg);
      // Recheck credits on failure
      checkBalance(email);
    } finally {
      setStarting(false);
    }
  };

  const packages = [
    {
      title: '1 Test Credit',
      price: 'Rp 49,000',
      url: 'https://lynk.id/englishwitharik/rx9lj8kjey71',
      popular: false,
    },
    {
      title: '3 Test Credits (Popular)',
      price: 'Rp 99,000',
      url: 'https://lynk.id/englishwitharik/j6jxzpdynron',
      popular: true,
    },
    {
      title: '5 Test Credits (Intensive)',
      price: 'Rp 149,000',
      url: 'https://lynk.id/englishwitharik/y9l4x3rpmyk5',
      popular: false,
    },
    {
      title: 'VIP Option (1 Test + 60-min Review)',
      price: 'Rp 175,000',
      url: 'https://wa.me/6282144223581?text=Hi%20Arik%2C%20I%20would%20like%20to%20book%20the%20VIP%20Mock%20Test%20Option%20(Rp%20175%2C000)%20with%201%20Test%20%2B%2060-min%20Review%20Session.',
      isWhatsapp: true,
      popular: false,
    },
  ];

  const hasCredits = (creditBalance ?? 0) > 0 || isFree;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-2 sm:p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f4fd] text-[#08507f]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#020617] tracking-tight">
              {t('gate_modal_title')}
            </h3>
            <p className="text-xs text-slate-500 font-medium line-clamp-1">
              {testTitle} {sectionType ? `· ${sectionType.toUpperCase()} Section` : '· Full Test'}
            </p>
          </div>
        </div>

        {/* Free Test Notice */}
        {isFree ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <p className="font-bold">Free Practice Test</p>
              <p className="mt-0.5 text-emerald-700">This test is free to take. No credits will be deducted.</p>
            </div>
          </div>
        ) : (
          /* Email Input Card */
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('gate_enter_email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => checkBalance(email)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      checkBalance(email);
                    }
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-24 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#08507f] focus:ring-2 focus:ring-[#08507f]/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => checkBalance(email)}
                  disabled={checking || !email}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition-colors disabled:opacity-50"
                >
                  {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
                </button>
              </div>
            </div>

            {/* Credit Balance Status */}
            {checking ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-[#08507f]" />
                Checking test credit balance...
              </div>
            ) : creditBalance !== null && checkedEmail === email.trim().toLowerCase() ? (
              creditBalance > 0 ? (
                /* Success: Has Credits */
                <div className="p-4 rounded-2xl bg-[#e8f4fd] border border-[#08507f]/20 text-[#08507f] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#08507f]">
                        {creditBalance} {creditBalance === 1 ? 'Credit' : 'Credits'} Available
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Ready to Start
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Starting will deduct <strong>1 credit</strong>. You will have <strong>{creditBalance - 1}</strong> credits remaining.
                    </p>
                  </div>
                </div>
              ) : (
                /* Warning: 0 Credits */
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-sm text-amber-900">{t('gate_no_credits_title')}</p>
                      <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                        {t('gate_no_credits_desc')}
                      </p>
                    </div>
                  </div>

                  {/* Compact Lynk.id Packages */}
                  <div className="mt-3.5 space-y-2">
                    {packages.map((pkg, i) => (
                      <a
                        key={i}
                        href={pkg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border',
                          pkg.popular
                            ? 'bg-[#08507f] text-white border-[#08507f] hover:bg-[#064066] shadow-sm'
                            : 'bg-white text-slate-800 border-amber-200 hover:border-amber-400 hover:shadow-sm'
                        )}
                      >
                        <span className="truncate pr-2">{pkg.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={pkg.popular ? 'text-amber-300' : 'text-[#08507f]'}>{pkg.price}</span>
                          {pkg.isWhatsapp ? (
                            <MessageCircle className="w-3.5 h-3.5" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Recheck button */}
                  <button
                    type="button"
                    onClick={() => checkBalance(email)}
                    disabled={checking}
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', checking && 'animate-spin')} />
                    <span>{t('gate_recheck_btn')}</span>
                  </button>
                </div>
              )
            ) : null}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={starting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={starting || (!hasCredits && !isFree)}
            className={cn(
              'w-full sm:flex-1 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md',
              hasCredits
                ? 'bg-[#08507f] text-white hover:bg-[#064066] active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            )}
          >
            {starting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Test...</span>
              </>
            ) : isFree ? (
              <span>Start Free Test</span>
            ) : (
              <span>{t('gate_start_button')}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
