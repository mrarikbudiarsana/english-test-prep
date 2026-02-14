'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PlanConfig, Subscription } from '@/types/user';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HiCheck, HiStar, HiClock } from 'react-icons/hi';
import { getExamConfig } from '@/config/examConfig';

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const examConfig = user?.preferredExamType ? getExamConfig(user.preferredExamType) : null;
  const examName = examConfig?.name || 'English';
  const scoreLabel = examConfig?.scoreLabel || 'score';
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentAvailable, setPaymentAvailable] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subRes, availRes] = await Promise.all([
          api.get('/subscriptions/plans'),
          api.get('/subscriptions/current').catch(() => ({ data: null })),
          api.get('/payments/availability').catch(() => ({ data: { available: false } })),
        ]);
        setPlans(plansRes.data);
        setCurrentSub(subRes.data);
        setPaymentAvailable(availRes.data?.available ?? false);
      } catch {
        console.error('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Load Midtrans Snap.js only if configured
    const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (snapUrl && clientKey && clientKey !== 'your_client_key') {
      const script = document.createElement('script');
      script.src = snapUrl;
      script.setAttribute('data-client-key', clientKey);
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    }
  }, []);

  const handleSubscribe = async (planType: string) => {
    if (!paymentAvailable) return;

    setProcessing(true);
    setMessage('');
    try {
      const res = await api.post('/payments/create', { planType });
      const { snapToken } = res.data;

      window.snap.pay(snapToken, {
        onSuccess: () => {
          setMessage('Payment successful! Your subscription is now active.');
          setProcessing(false);
          // Refresh subscription status
          api.get('/subscriptions/current').then(r => setCurrentSub(r.data));
        },
        onPending: () => {
          setMessage('Payment is pending. We\'ll activate your subscription once payment is confirmed.');
          setProcessing(false);
        },
        onError: () => {
          setMessage('Payment failed. Please try again.');
          setProcessing(false);
        },
        onClose: () => {
          setProcessing(false);
        },
      });
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to process payment');
      setProcessing(false);
    }
  };

  const features = [
    `Unlimited ${examName} practice tests`,
    'AI-powered Writing feedback',
    'AI-powered Speaking evaluation',
    `Detailed ${scoreLabel.toLowerCase()} breakdowns`,
    'Progress tracking & analytics',
    'Section-by-section practice',
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-72 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-gray-500">
          Unlock unlimited practice tests with AI-powered feedback
        </p>
      </div>

      {/* Current subscription banner */}
      {currentSub && currentSub.status === 'active' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-800 font-medium">
            You have an active {currentSub.planType} subscription (expires {formatDate(currentSub.expiresAt)})
          </p>
        </div>
      )}

      {/* Payment not available banner */}
      {!paymentAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <HiClock className="w-6 h-6 text-amber-600 mr-2" />
            <h3 className="text-lg font-semibold text-amber-800">Payment Coming Soon</h3>
          </div>
          <p className="text-amber-700">
            Online payment is being set up. In the meantime, you can enjoy your free practice tests.
            Contact the administrator if you need a subscription activated.
          </p>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-center ${
          message.includes('successful') ? 'bg-green-50 text-green-800 border border-green-200' :
          message.includes('pending') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.type === 'quarterly';
          const monthlyPrice = Math.round(plan.price / (plan.durationDays / 30));

          return (
            <div
              key={plan.type}
              className={`bg-white rounded-xl border-2 p-6 relative ${
                isPopular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              } ${!paymentAvailable ? 'opacity-75' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                    <HiStar className="w-3 h-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.label}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    /{plan.durationDays} days
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatCurrency(monthlyPrice)}/month
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start text-sm">
                    <HiCheck className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.type)}
                disabled={processing || !paymentAvailable || (currentSub?.status === 'active')}
                className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                  isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {currentSub?.status === 'active'
                  ? 'Current Plan'
                  : !paymentAvailable
                    ? 'Coming Soon'
                    : 'Subscribe'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Free tier info */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-600">
          Free tier: {user?.freeTestsRemaining || 0} practice tests remaining.
          {paymentAvailable
            ? ' Subscribe to unlock unlimited access.'
            : ' Payment integration coming soon - stay tuned!'}
        </p>
      </div>
    </div>
  );
}
