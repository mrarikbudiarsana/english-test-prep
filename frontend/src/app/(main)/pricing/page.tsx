'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/pricing`);
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching pricing plans:', error);
            toast.error('Failed to load pricing plans');
        } finally {
            setLoading(false);
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
            <div className="min-h-screen pt-24 flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 sm:text-5xl">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Choose the plan that best fits your needs. Upgrade or downgrade at any time.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center space-x-4">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-gray-200"
                            role="switch"
                            aria-checked={billingCycle === 'yearly'}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                            Yearly <span className="text-green-600 font-bold ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl shadow-sm border p-8 flex flex-col ${plan.isPopular ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-gray-200'
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2">
                                    <span className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">
                                    {formatPrice(
                                        billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly,
                                        plan.currency
                                    )}
                                </span>
                                <span className="text-gray-500 ml-2">
                                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                                </span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.perks.map((perk, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-3" />
                                        <span className="text-gray-600 text-sm">{perk}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.isPopular ? 'primary' : 'outline'}
                                className="w-full"
                                onClick={() => {
                                    // TODO: Implement checkout/subscription logic
                                    toast.success(`Selected ${plan.name} plan`);
                                }}
                            >
                                {plan.priceMonthly === 0 ? 'Get Started' : 'Subscribe Now'}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Can I cancel my subscription at any time?
                            </h3>
                            <p className="text-gray-600">
                                Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                What payment methods do you accept?
                            </h3>
                            <p className="text-gray-600">
                                We accept all major credit cards, bank transfers, and e-wallets through our secure payment processor (Midtrans).
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Can I switch plans later?
                            </h3>
                            <p className="text-gray-600">
                                Absolutely! You can upgrade or downgrade your plan at any time from your account settings. Prorated charges may apply.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
