'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const year = new Date().getFullYear();

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
              Authentic TOEFL ITP practice tests with official-style scoring. Your gateway to global success.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Practice Tests', href: '/tests' },
                { label: 'Pricing & Plans', href: '/pricing' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Settings', href: '/settings' },
              ].map(l => (
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
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Support</h3>
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
          <p>© {year} English with Arik · ITP Ready. All rights reserved.</p>
          <p>TOEFL ITP® is a registered trademark of ETS. This platform is not affiliated with ETS.</p>
        </div>
      </div>
    </footer>
  );
}
