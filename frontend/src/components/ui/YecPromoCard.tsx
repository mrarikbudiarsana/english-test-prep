'use client';

import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function YecPromoCard() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const promoCode = 'ITPARIK';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [promoCode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden flex flex-col lg:flex-row items-stretch transition-all duration-300 hover:shadow-xl">
        
        {/* Left/Main Side: Banner copy & features */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-xs font-bold text-orange-600 mb-6 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Official TOEFL iTP Partner Promotion
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-3 sm:mb-4">
              {t('yec_promo_title')}
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8 max-w-2xl">
              {t('yec_promo_subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/70">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
                    {t(`yec_promo_feat${num}` as any)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {/* IIEF & ETS logo badges */}
              <div className="px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] font-black text-blue-700 uppercase tracking-wider">
                IIEF Approved
              </div>
              <div className="px-3 py-1.5 bg-orange-50/50 border border-orange-100 rounded-xl text-[10px] font-black text-orange-700 uppercase tracking-wider">
                ETS Official
              </div>
            </div>
            <p className="text-xs text-slate-400 sm:ml-auto">
              * Valid in collaboration with YEC.co.id and IIEF Indonesia
            </p>
          </div>
        </div>

        {/* Divider lines with ticket-notch circles for physical voucher look */}
        <div className="relative flex lg:flex-col justify-center items-center w-full lg:w-auto bg-slate-50 lg:bg-white">
          <div className="hidden lg:block absolute -top-4 w-8 h-8 rounded-full bg-[#f8fafc] border-b border-slate-200/80" />
          <div className="hidden lg:block h-full border-l-2 border-dashed border-slate-200" />
          <div className="hidden lg:block absolute -bottom-4 w-8 h-8 rounded-full bg-[#f8fafc] border-t border-slate-200/80" />
          
          <div className="lg:hidden absolute -left-4 w-8 h-8 rounded-full bg-[#f8fafc] border-r border-slate-200/80" />
          <div className="lg:hidden w-full border-t-2 border-dashed border-slate-200" />
          <div className="lg:hidden absolute -right-4 w-8 h-8 rounded-full bg-[#f8fafc] border-l border-slate-200/80" />
        </div>

        {/* Right Side: The Ticket Stub Voucher */}
        <div className="w-full lg:w-[350px] bg-slate-50/70 p-6 sm:p-8 lg:p-10 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Voucher Diskon
            </p>

            {/* Ticket Price Box */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                SAVE 20K
              </div>
              
              <div className="text-left">
                <span className="text-xs text-slate-400 block mb-0.5">{t('yec_promo_normal_price')}</span>
                <span className="text-sm font-semibold text-slate-400 line-through">Rp 599.000</span>
              </div>
              
              <div className="text-left mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 block mb-0.5 font-medium">{t('yec_promo_discount_price')}</span>
                <span className="text-3xl font-black text-rose-600 tracking-tight">Rp 579.000</span>
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-500 block mb-2">
                {t('yec_promo_code_label')}
              </span>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-1">
                <div className="flex-1 font-mono font-black text-xl text-slate-800 tracking-wider flex items-center justify-center py-2.5 select-all">
                  {promoCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-5 py-2.5 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 flex items-center gap-1 ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-emerald-100'
                      : 'bg-[#08507f] text-white hover:bg-[#063d61]'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t('yec_promo_copied')}
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.25 2.25 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.375z" />
                      </svg>
                      {t('yec_promo_copy')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <a
            href="https://shop.yec.co.id/?ref=536"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {t('yec_promo_cta')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

      </div>
    </div>
  );
}
