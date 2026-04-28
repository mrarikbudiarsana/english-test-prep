'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();

  const links = [
    { label: t('footer_link_tests'), href: '/tests' },
    { label: t('footer_link_pricing'), href: '/pricing' },
    { label: t('footer_link_dashboard'), href: '/dashboard' },
    { label: t('footer_link_settings'), href: '/settings' },
  ];

  return (
    <footer className="bg-[#063d61] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="English with Arik" width={44} height={44} className="rounded-full" unoptimized />
              <div>
                <p className="font-extrabold text-white text-sm">ITP Ready</p>
                <p className="text-[11px] text-blue-200">by English with Arik</p>
              </div>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              {t('footer_tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">{t('footer_quick_links')}</h3>
            <ul className="space-y-2.5 text-sm">
              {links.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-blue-200 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">{t('footer_support')}</h3>
            <ul className="space-y-2.5 text-sm text-blue-200">
              <li>English with Arik</li>
              <li>TOEFL ITP Level 1 Practice</li>
              <li className="pt-2">
                <a href="mailto:info@englishwitharik.com" className="hover:text-white transition-colors">
                  info@englishwitharik.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-300">
          <p>{t('footer_copyright').replace('{year}', String(year))}</p>
          <div className="flex items-center gap-4">
            <p className="text-center sm:text-right">{t('footer_trademark')}</p>
            <LanguageSwitcher className="border-white/20 !bg-white/10 !text-white hover:!bg-white/20" />
          </div>
        </div>
      </div>
    </footer>
  );
}
