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
  HiVolumeUp,
  HiBookOpen,
  HiPencil,
  HiMicrophone,
  HiCheck,
} from 'react-icons/hi';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Ace Your IELTS Exam with{' '}
              <span className="text-blue-200">AI-Powered</span> Practice
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Practice all four IELTS sections with realistic tests, get instant AI feedback
              on your Writing and Speaking, and track your progress toward your target band score.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={user ? '/tests' : '/register'}
                className="px-8 py-3.5 bg-white text-blue-700 rounded-xl hover:bg-blue-50 font-semibold text-lg transition-colors shadow-lg"
              >
                {user ? 'Browse Tests' : 'Start Free Practice'}
              </Link>
              <Link
                href="/subscription"
                className="px-8 py-3.5 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 font-semibold text-lg transition-colors"
              >
                View Plans
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-200">
              2 free practice tests included. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* IELTS Sections */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Practice All 4 IELTS Sections</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">
              Complete practice tests designed to mirror the real IELTS exam experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: HiVolumeUp,
                title: 'Listening',
                desc: '40 questions across 4 sections with authentic audio recordings',
                color: 'blue',
              },
              {
                icon: HiBookOpen,
                title: 'Reading',
                desc: '40 questions with 3 academic passages and varied question types',
                color: 'green',
              },
              {
                icon: HiPencil,
                title: 'Writing',
                desc: 'Task 1 & Task 2 with AI-powered band scoring and detailed feedback',
                color: 'purple',
              },
              {
                icon: HiMicrophone,
                title: 'Speaking',
                desc: 'Record your responses for all 3 parts with AI evaluation',
                color: 'orange',
              },
            ].map((section) => (
              <div
                key={section.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 bg-${section.color}-50 rounded-xl flex items-center justify-center mb-4`}>
                  <section.icon className={`w-6 h-6 text-${section.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-500 text-sm">{section.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Our Platform</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: HiLightningBolt,
                title: 'AI-Powered Feedback',
                desc: 'Get detailed band scores and personalized improvement suggestions for Writing and Speaking powered by advanced AI.',
              },
              {
                icon: HiChartBar,
                title: 'Progress Tracking',
                desc: 'Monitor your band score trends over time, identify weak areas, and track improvement across all sections.',
              },
              {
                icon: HiClock,
                title: 'Realistic Timing',
                desc: 'Practice with real exam timers for each section. Auto-submit when time runs out, just like the real test.',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to improve your IELTS score?
          </h2>
          <p className="text-blue-100 mb-8">
            Start with 2 free practice tests. No credit card required.
          </p>
          <Link
            href={user ? '/tests' : '/register'}
            className="inline-block px-8 py-3.5 bg-white text-blue-700 rounded-xl hover:bg-blue-50 font-semibold text-lg transition-colors shadow-lg"
          >
            {user ? 'Go to Tests' : 'Get Started Free'}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
