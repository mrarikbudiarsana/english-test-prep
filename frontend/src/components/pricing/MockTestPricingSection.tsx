'use client';

import React from 'react';
import { Check, Sparkles, ShieldCheck, ExternalLink, MessageCircle, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface MockTestPricingSectionProps {
  className?: string;
  id?: string;
}

export default function MockTestPricingSection({ className, id = 'pricing-packages' }: MockTestPricingSectionProps) {
  const { t } = useLanguage();

  const packages = [
    {
      id: '1-credit',
      title: t('mock_pack_1_title'),
      badge: null,
      price: 'Rp 49,000',
      priceRaw: 49000,
      description: t('mock_pack_1_desc'),
      checkoutUrl: 'https://lynk.id/englishwitharik/rx9lj8kjey71',
      isPopular: false,
      isVip: false,
      buttonText: t('buy_on_lynkid'),
      buttonIcon: ExternalLink,
      features: [
        t('feat_1_credit'),
        t('feat_scoring'),
        t('feat_breakdown'),
        t('feat_answer_keys'),
        t('feat_audio_timer'),
        t('feat_instant_activation'),
      ],
    },
    {
      id: '3-credits',
      title: t('mock_pack_3_title'),
      badge: t('mock_pack_3_badge'), // Value Pack - Popular
      price: 'Rp 99,000',
      priceRaw: 99000,
      savings: 'Save ~33%',
      description: t('mock_pack_3_desc'),
      checkoutUrl: 'https://lynk.id/englishwitharik/j6jxzpdynron',
      isPopular: true,
      isVip: false,
      buttonText: t('buy_on_lynkid'),
      buttonIcon: ExternalLink,
      features: [
        t('feat_3_credits'),
        t('feat_scoring'),
        t('feat_breakdown'),
        t('feat_answer_keys'),
        t('feat_audio_timer'),
        t('feat_progress'),
        t('feat_validity'),
      ],
    },
    {
      id: '5-credits',
      title: t('mock_pack_5_title'),
      badge: t('mock_pack_5_badge'), // Intensive Pack
      price: 'Rp 149,000',
      priceRaw: 149000,
      savings: 'Best Value',
      description: t('mock_pack_5_desc'),
      checkoutUrl: 'https://lynk.id/englishwitharik/y9l4x3rpmyk5',
      isPopular: false,
      isVip: false,
      buttonText: t('buy_on_lynkid'),
      buttonIcon: ExternalLink,
      features: [
        t('feat_5_credits'),
        t('feat_scoring'),
        t('feat_breakdown'),
        t('feat_answer_keys'),
        t('feat_audio_timer'),
        t('feat_progress'),
        t('feat_validity'),
      ],
    },
    {
      id: 'vip-option',
      title: t('mock_pack_vip_title'),
      badge: t('mock_pack_vip_badge'), // 1-on-1 Mentorship
      price: 'Rp 175,000',
      priceRaw: 175000,
      description: t('mock_pack_vip_desc'),
      checkoutUrl: 'https://wa.me/6282144223581?text=Hi%20Arik%2C%20I%20would%20like%20to%20book%20the%20VIP%20Mock%20Test%20Option%20(1%20Test%20%2B%2060-min%20Review%20Session%20with%20Arik)%20for%20Rp%20175%2C000.',
      isPopular: false,
      isVip: true,
      buttonText: t('book_via_whatsapp'),
      buttonIcon: MessageCircle,
      features: [
        t('feat_1_credit'),
        t('feat_vip_review'),
        t('feat_vip_analysis'),
        t('feat_vip_strategy'),
        t('feat_vip_qa'),
        t('feat_answer_keys'),
      ],
    },
  ];

  return (
    <section id={id} className={cn('py-12 scroll-mt-24', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f4fd] border border-[#08507f]/20 text-[#08507f] text-xs font-bold uppercase tracking-widest mb-4">
            <Zap className="w-3.5 h-3.5 text-[#08507f] fill-[#08507f]" />
            Instant Activation via Lynk.id
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#020617] tracking-tight">
            {t('mock_pricing_heading')}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            {t('mock_pricing_subheading')}
          </p>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {packages.map((pkg) => {
            const isPopular = pkg.isPopular;
            const isVip = pkg.isVip;
            const Icon = pkg.buttonIcon;

            return (
              <div
                key={pkg.id}
                className={cn(
                  'relative bg-white rounded-3xl p-7 flex flex-col transition-all duration-300 border h-full',
                  isPopular
                    ? 'border-[#08507f] shadow-2xl ring-2 ring-[#08507f]/10 lg:-translate-y-2 z-10'
                    : isVip
                    ? 'border-amber-400/80 shadow-lg ring-1 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 to-white'
                    : 'border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300'
                )}
              >
                {/* Floating Badge */}
                {pkg.badge && (
                  <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md',
                        isPopular
                          ? 'bg-[#08507f] text-white ring-2 ring-white'
                          : isVip
                          ? 'bg-amber-500 text-white ring-2 ring-white'
                          : 'bg-emerald-600 text-white ring-2 ring-white'
                      )}
                    >
                      {isPopular && <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />}
                      {pkg.badge}
                    </span>
                  </div>
                )}

                {/* Title & Description */}
                <div className="mb-6 pt-1">
                  <h3 className="text-xl font-extrabold text-[#020617]">{pkg.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed min-h-[2.5rem]">
                    {pkg.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#020617] tracking-tight">{pkg.price}</span>
                  </div>
                  {pkg.savings && (
                    <span className="inline-block mt-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {pkg.savings}
                    </span>
                  )}
                  {isVip && (
                    <span className="inline-block mt-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      Includes 60-min Review
                    </span>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-1">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-xs text-slate-600 leading-tight">
                      <div
                        className={cn(
                          'h-4 w-4 rounded-full flex items-center justify-center shrink-0 mr-2.5 mt-0.5',
                          isPopular
                            ? 'bg-[#e8f4fd] text-[#08507f]'
                            : isVip
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 text-emerald-600'
                        )}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <a
                  href={pkg.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'w-full py-3.5 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] mt-auto flex items-center justify-center gap-2 text-center shadow-md',
                    isPopular
                      ? 'bg-[#08507f] text-white hover:bg-[#064066] hover:shadow-lg'
                      : isVip
                      ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg'
                      : 'bg-[#e8f4fd] text-[#08507f] hover:bg-[#08507f] hover:text-white border border-[#08507f]/20'
                  )}
                >
                  <span>{pkg.buttonText}</span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            );
          })}
        </div>

        {/* 100% Mock Test Fee Back Guarantee Banner */}
        <div className="mt-12 max-w-4xl mx-auto rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md border border-emerald-100">
            <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              Risk-Free Guarantee
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {t('mock_guarantee_title')}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {t('mock_guarantee_desc')}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
