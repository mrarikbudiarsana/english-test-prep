'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface PricingPlan {
    id: number;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
    perks: string[];
    isPopular: boolean;
}

export default function PricingPage() {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [checkingOut, setCheckingOut] = useState<number | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pricing`);
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching pricing plans:', error);
            toast.error('Failed to load pricing plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan: PricingPlan) => {
        if (plan.priceMonthly === 0) return; // free plan — no payment needed

        // Derive planType from plan name (e.g. "Monthly Plan" → "monthly")
        const nameLower = plan.name.toLowerCase();
        let planType: 'monthly' | 'quarterly' | 'yearly';
        if (nameLower.includes('yearly') || nameLower.includes('annual') || billingCycle === 'yearly') {
            planType = 'yearly';
        } else if (nameLower.includes('quarterly')) {
            planType = 'quarterly';
        } else {
            planType = 'monthly';
        }

        setCheckingOut(plan.id);
        try {
            const { data } = await api.post('/payments/create', { planType });
            const snapToken: string = data.snapToken;

            // Load Midtrans Snap if not already loaded
            if (!(window as any).snap) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL!;
                    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!);
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Midtrans Snap'));
                    document.head.appendChild(script);
                });
            }

            (window as any).snap.pay(snapToken, {
                onSuccess: () => {
                    toast.success('Payment successful!');
                    window.location.href = '/payment/finish?transaction_status=settlement';
                },
                onPending: () => {
                    toast('Payment pending. We will notify you once confirmed.');
                    window.location.href = '/payment/finish?transaction_status=pending';
                },
                onError: () => {
                    toast.error('Payment failed. Please try again.');
                },
                onClose: () => {
                    toast('Checkout closed.');
                },
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to start checkout');
        } finally {
            setCheckingOut(null);
        }
    };

    const formatPrice = (amount: number, currency: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex justify-center items-center bg-[#f8f9fa]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e4002b]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fa] pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-[#2c3e50] mb-4 sm:text-5xl">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-[#5a6c7d] mb-8">
                        Choose the plan that best fits your needs. Upgrade or downgrade at any time.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center space-x-4">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-[#2c3e50]' : 'text-[#5a6c7d]'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e4002b] focus:ring-offset-2 bg-[#e8ecef]"
                            role="switch"
                            aria-checked={billingCycle === 'yearly'}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-[#2c3e50]' : 'text-[#5a6c7d]'}`}>
                            Yearly <span className="text-emerald-600 font-bold ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl shadow-sm border p-8 flex flex-col ${plan.isPopular ? 'border-[#e4002b] ring-2 ring-[#e4002b] ring-opacity-50' : 'border-[#e8ecef]'
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2">
                                    <span className="inline-block bg-[#e4002b] text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-[#2c3e50]">{plan.name}</h3>
                                <p className="mt-2 text-sm text-[#5a6c7d]">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-[#2c3e50]">
                                    {formatPrice(
                                        billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly,
                                        plan.currency
                                    )}
                                </span>
                                <span className="text-[#5a6c7d] ml-2">
                                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                                </span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.perks.map((perk, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mr-3" />
                                        <span className="text-[#5a6c7d] text-sm">{perk}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.isPopular ? 'primary' : 'outline'}
                                className="w-full"
                                onClick={() => handleSubscribe(plan)}
                                disabled={checkingOut === plan.id}
                            >
                                {checkingOut === plan.id
                                    ? 'Loading...'
                                    : plan.priceMonthly === 0
                                    ? 'Get Started'
                                    : 'Subscribe Now'}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-4xl mx-auto">
                    <div className="bg-white border border-[#e8ecef] rounded-2xl p-8 sm:p-10 shadow-sm">
                        <div className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e4002b] mb-3">FAQ</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-[#2c3e50]">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-[#5a6c7d] mt-3">
                                Everything you need to know about plans and billing.
                            </p>
                        </div>

                        <div className="divide-y divide-[#e8ecef]">
                            <div className="py-6">
                                <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">
                                    Can I cancel my subscription at any time?
                                </h3>
                                <p className="text-[#5a6c7d]">
                                    Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.
                                </p>
                            </div>
                            <div className="py-6">
                                <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">
                                    What payment methods do you accept?
                                </h3>
                                <p className="text-[#5a6c7d]">
                                    We accept all major credit cards, bank transfers, and e-wallets through our secure payment processor (Midtrans).
                                </p>
                            </div>
                            <div className="py-6">
                                <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">
                                    Can I switch plans later?
                                </h3>
                                <p className="text-[#5a6c7d]">
                                    Absolutely! You can upgrade or downgrade your plan at any time from your account settings. Prorated charges may apply.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
