'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { examConfigs, getAllExamTypes } from '@/config/examConfig';
import { ExamType } from '@/types/user';

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

// Exam-specific plan overrides (names, descriptions, perks)
const examPlanOverrides: Record<ExamType, { name: string; description: string; perks: string[] }[][]> = {
    ielts: [
        [
            { name: 'Free', description: 'Start your IELTS journey', perks: ['2 free IELTS practice tests/month', 'Basic score feedback', 'Band score estimation', 'Community access'] },
            { name: 'IELTS Starter', description: 'Perfect for early preparation', perks: ['10 IELTS practice tests/month', 'Listening & Reading sections', 'Detailed band score breakdown', 'Progress tracking', 'Email support'] },
            { name: 'IELTS Pro', description: 'Full exam preparation suite', perks: ['Unlimited IELTS practice tests', 'All 4 sections (L/R/W/S)', 'AI Writing & Speaking scoring', 'Official band score scale', 'Priority support', 'Performance analytics'] },
        ],
    ],
    toefl_ibt: [
        [
            { name: 'Free', description: 'Explore TOEFL iBT practice', perks: ['2 free TOEFL iBT tests/month', 'Basic score feedback', 'Score out of 120 estimation', 'Community access'] },
            { name: 'iBT Starter', description: 'Build your TOEFL foundation', perks: ['10 TOEFL iBT tests/month', 'Reading & Listening sections', 'Detailed section score breakdown', 'Progress tracking', 'Email support'] },
            { name: 'iBT Pro', description: 'Complete TOEFL iBT preparation', perks: ['Unlimited TOEFL iBT tests', 'All 4 sections (R/L/S/W)', 'AI Speaking & Writing scoring', 'Official 0–120 score scale', 'Priority support', 'Performance analytics'] },
        ],
    ],
    toefl_itp: [
        [
            { name: 'Free', description: 'Get started with TOEFL ITP', perks: ['2 free TOEFL ITP tests/month', 'Basic score feedback', 'Score 310–677 estimation', 'Community access'] },
            { name: 'ITP Starter', description: 'Targeted ITP preparation', perks: ['10 TOEFL ITP tests/month', 'Listening & Structure sections', 'Detailed score breakdown', 'Progress tracking', 'Email support'] },
            { name: 'ITP Pro', description: 'Master all ITP sections', perks: ['Unlimited TOEFL ITP tests', 'All 3 sections (L/S/R)', 'AI-powered answer analysis', 'Official 310–677 scale', 'Priority support', 'Performance analytics'] },
        ],
    ],
    pte: [
        [
            { name: 'Free', description: 'Begin your PTE journey', perks: ['2 free PTE Academic tests/month', 'Basic score feedback', 'Score 10–90 estimation', 'Community access'] },
            { name: 'PTE Starter', description: 'Essential PTE preparation', perks: ['10 PTE Academic tests/month', 'Reading & Listening sections', 'Detailed score breakdown', 'Progress tracking', 'Email support'] },
            { name: 'PTE Pro', description: 'Complete PTE Academic prep', perks: ['Unlimited PTE Academic tests', 'All 3 sections (S&W/R/L)', 'AI Speaking & Writing scoring', 'Official 10–90 score scale', 'Priority support', 'Performance analytics'] },
        ],
    ],
};

export default function PricingPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [checkingOut, setCheckingOut] = useState<number | null>(null);
    const [selectedExam, setSelectedExam] = useState<ExamType>(
        user?.preferredExamType ?? 'ielts'
    );

    useEffect(() => {
        if (user?.preferredExamType) {
            setSelectedExam(user.preferredExamType);
        }
    }, [user?.preferredExamType]);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await api.get('/pricing');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching pricing plans:', error);
            toast.error('Failed to load pricing plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan: PricingPlan) => {
        if (plan.priceMonthly === 0) return;

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
            const { data } = await api.post('/payments/create', { planType, examType: selectedExam });
            const snapToken: string = data.snapToken;

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

    const examTypes = getAllExamTypes();
    const examConfig = examConfigs[selectedExam];
    const { theme } = examConfig;
    const overrides = examPlanOverrides[selectedExam][0];

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex justify-center items-center bg-[#f8f9fa]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.primary }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fa] pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <h1 className="text-4xl font-bold text-[#2c3e50] mb-4 sm:text-5xl">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-[#5a6c7d] mb-8">
                        Choose the plan that fits your exam. Upgrade or downgrade at any time.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center space-x-4 mb-10">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-[#2c3e50]' : 'text-[#5a6c7d]'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                            style={{ backgroundColor: billingCycle === 'yearly' ? theme.primary : '#e8ecef' }}
                            role="switch"
                            aria-checked={billingCycle === 'yearly'}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-[#2c3e50]' : 'text-[#5a6c7d]'}`}>
                            Yearly <span className="text-emerald-600 font-bold ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                {/* Exam Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {examTypes.map((examType) => {
                        const cfg = examConfigs[examType];
                        const isActive = selectedExam === examType;
                        return (
                            <button
                                key={examType}
                                onClick={() => setSelectedExam(examType)}
                                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border-2"
                                style={{
                                    borderColor: isActive ? cfg.theme.primary : '#e8ecef',
                                    backgroundColor: isActive ? cfg.theme.secondary : 'white',
                                    color: isActive ? cfg.theme.primary : '#5a6c7d',
                                }}
                            >
                                {cfg.shortName}
                            </button>
                        );
                    })}
                </div>

                {/* Exam label */}
                <div className="text-center mb-8">
                    <span
                        className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
                        style={{ backgroundColor: theme.secondary, color: theme.primary }}
                    >
                        {examConfig.name} Plans
                    </span>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, index) => {
                        const override = overrides[index];
                        const isPopular = plan.isPopular;
                        return (
                            <div
                                key={plan.id}
                                className="relative bg-white rounded-2xl shadow-sm border-2 p-8 flex flex-col transition-all duration-200"
                                style={{
                                    borderColor: isPopular ? theme.primary : '#e8ecef',
                                    boxShadow: isPopular ? `0 8px 32px ${theme.primary}25` : undefined,
                                }}
                            >
                                {/* Top color bar */}
                                {isPopular && (
                                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                                )}

                                {isPopular && (
                                    <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2">
                                        <span
                                            className="inline-block text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
                                            style={{ backgroundColor: theme.primary }}
                                        >
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-[#2c3e50]">
                                        {override?.name ?? plan.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-[#5a6c7d]">
                                        {override?.description ?? plan.description}
                                    </p>
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
                                    {(override?.perks ?? plan.perks).map((perk, i) => (
                                        <li key={i} className="flex items-start">
                                            <Check
                                                className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5"
                                                style={{ color: isPopular ? theme.primary : '#10b981' }}
                                            />
                                            <span className="text-[#5a6c7d] text-sm">{perk}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50"
                                    style={
                                        isPopular
                                            ? { backgroundColor: theme.primary, color: 'white' }
                                            : { backgroundColor: 'white', color: theme.primary, border: `2px solid ${theme.border}` }
                                    }
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={checkingOut === plan.id}
                                    onMouseEnter={(e) => {
                                        if (!isPopular) e.currentTarget.style.borderColor = theme.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isPopular) e.currentTarget.style.borderColor = theme.border;
                                    }}
                                >
                                    {checkingOut === plan.id
                                        ? 'Loading...'
                                        : plan.priceMonthly === 0
                                        ? 'Get Started'
                                        : 'Subscribe Now'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-4xl mx-auto">
                    <div className="bg-white border border-[#e8ecef] rounded-2xl p-8 sm:p-10 shadow-sm">
                        <div className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: theme.primary }}>FAQ</p>
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
                            <div className="py-6">
                                <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">
                                    Can I use one subscription for multiple exams?
                                </h3>
                                <p className="text-[#5a6c7d]">
                                    Each subscription is tied to your account and gives you access to all practice tests across all exam types included in your plan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
