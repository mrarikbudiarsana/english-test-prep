'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  HiAcademicCap,
  HiLightningBolt,
  HiChartBar,
  HiClock,
  HiBookOpen,
  HiCheck,
  HiGlobeAlt,
} from 'react-icons/hi';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
                Now supporting TOEFL & PTE
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Master Your English <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Proficiency Exams
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
                The complete platform for IELTS, TOEFL, and PTE preparation.
                Get AI-powered feedback, realistic practice tests, and track your
                progress to your target score.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href={user ? '/tests' : '/register'}
                  className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                >
                  {user ? 'Browse Dashboard' : 'Start Free Practice'}
                </Link>
                <Link
                  href="/subscription"
                  className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200"
                >
                  View Plans
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <HiCheck className="w-5 h-5 text-green-500" />
                  <span>Free practice tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiCheck className="w-5 h-5 text-green-500" />
                  <span>Instant AI scores</span>
                </div>
              </div>
            </div>

            <div className="relative lg:h-[600px] w-full flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5 bg-slate-100">
                {/* 
                     Using standard img tag to ensure it works even without Next.js Image optimization configuration for simple static assets.
                     Object-cover ensures it fills the area nicely.
                  */}
                <img
                  src="/landing-hero.png"
                  alt="Students studying nicely"
                  className="w-full h-full object-cover"
                />

                {/* Floating badge branding element */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hidden sm:block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <HiAcademicCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Official Exam Format</div>
                      <div className="text-sm text-slate-500">Practice with real test simulations</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 top-10 -right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-10 -left-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Supported Exams Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Comprehensive Support for Major Exams
            </h2>
            <p className="text-lg text-slate-600">
              Whether you're targeting university admission or migration, we have the right preparation tools for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'IELTS',
                subtitle: 'Academic & General',
                desc: 'Complete practice for Listening, Reading, Writing, and Speaking with band score predictions.',
                color: 'blue',
                icon: HiAcademicCap,
                features: ['Band 0-9 Scoring', 'Task 1 & 2 Feedback', '4 Sections'],
              },
              {
                title: 'TOEFL iBT',
                subtitle: 'New 2026 Format',
                desc: 'Adaptive testing experience mirroring the latest TOEFL iBT format including the new Writing task.',
                color: 'indigo',
                icon: HiGlobeAlt,
                features: ['0-120 Score Scale', 'Adaptive Reading', 'Integrated Tasks'],
              },
              {
                title: 'TOEFL ITP',
                subtitle: 'Level 1',
                desc: 'Standardized paper-based style testing for institutional use. Focus on Structure & Reading.',
                color: 'rose',
                icon: HiBookOpen,
                features: ['Structure & Written', 'Reading Comp', 'Listening'],
              },
              {
                title: 'PTE Academic',
                subtitle: 'Computer-Based',
                desc: 'Fast, AI-scored practice for the Pearson Test of English with integrated skill questions.',
                color: 'orange',
                icon: HiLightningBolt,
                features: ['AI Speech Scoring', 'Integrated Skills', 'Fast Results'],
              },
            ].map((exam) => (
              <div
                key={exam.title}
                className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl hover:border-transparent transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${exam.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <exam.icon className={`w-7 h-7 text-${exam.color}-600`} />
                </div>

                <h3 className="text-xl font-bold text-slate-900">{exam.title}</h3>
                <p className={`text-sm font-semibold text-${exam.color}-600 mb-3`}>{exam.subtitle}</p>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  {exam.desc}
                </p>

                <ul className="space-y-2 border-t border-slate-100 pt-6">
                  {exam.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-slate-500 gap-2">
                      <HiCheck className={`w-5 h-5 text-${exam.color}-500 flex-shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <HiChartBar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Analytics & Tracking</h3>
              <p className="text-slate-600">
                Visualize your progress with detailed charts. Identify weak areas and track your improvement over time across all test sections.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <HiLightningBolt className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI-Powered Feedback</h3>
              <p className="text-slate-600">
                Get instant, detailed feedback on your Writing and Speaking. Our AI analyzes your response for grammar, vocabulary, and coherence.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <HiClock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Realistic Simulation</h3>
              <p className="text-slate-600">
                Practice under exam conditions with strict timers and authentic styling for IELTS, TOEFL, and PTE interfaces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Ready to achieve your target score?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of students practicing with our AI-powered platform today.
          </p>
          <Link
            href={user ? '/tests' : '/register'}
            className="inline-flex justify-center items-center px-10 py-5 text-lg font-bold text-blue-600 bg-white rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            {user ? 'Go to Dashboard' : 'Start Your Free Trial'}
          </Link>
          <p className="mt-6 text-sm text-slate-400">
            No credit card required for free tests.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
