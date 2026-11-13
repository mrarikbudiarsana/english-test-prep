'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Check, 
    X, 
    Coins, 
    DollarSign, 
    Receipt, 
    ExternalLink, 
    Search, 
    TrendingUp, 
    Users, 
    PackageCheck,
    Clock,
    Sparkles
} from 'lucide-react';

interface PricingPlan {
    id: number;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
    perks: string[];
    isActive: boolean;
    isPopular: boolean;
    tierLevel: number;
}

interface LynkTransaction {
    id: string;
    userId: string | null;
    userName: string | null;
    email: string;
    transactionId: string;
    amount: number;
    creditsAdded: number;
    status: string;
    checkoutUrl: string | null;
    createdAt: string;
}

interface CreditStats {
    totalCreditsPurchased: number;
    totalRevenue: number;
    totalTransactions: number;
    totalCreditsUsed: number;
    totalActiveCredits: number;
}

const ACTIVE_CREDIT_PACKAGES = [
    {
        id: '1-credit',
        name: 'Single Mock Test Credit',
        badge: 'Starter',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        credits: 1,
        priceFormatted: 'Rp 49,000',
        priceRaw: 49000,
        slug: 'rx9lj8kjey71',
        url: 'https://lynk.id/englishwitharik/rx9lj8kjey71',
        description: 'Standard 1 Mock Test credit for Section 1, 2, and 3 with full score report and audio timers.',
        features: [
            '1 Full TOEFL ITP Mock Test Credit',
            'Full scaled scoring (310 - 677)',
            'Section-by-section breakdown',
            'Audio timers and official pacing',
            'Instant activation via Lynk.id'
        ]
    },
    {
        id: '3-credits',
        name: '3 Mock Test Credits (Value Pack)',
        badge: 'Popular',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        credits: 3,
        priceFormatted: 'Rp 99,000',
        priceRaw: 99000,
        savings: 'Save ~33%',
        slug: 'j6jxzpdynron',
        url: 'https://lynk.id/englishwitharik/j6jxzpdynron',
        description: 'Most popular option for students targeting 500+ or 550+ score requirements.',
        features: [
            '3 Full TOEFL ITP Mock Test Credits',
            'Full scaled scoring (310 - 677)',
            'Comprehensive answer explanations',
            'Progress and score trajectory tracking',
            'Valid forever - no expiration'
        ]
    },
    {
        id: '5-credits',
        name: '5 Mock Test Credits (Intensive Pack)',
        badge: 'Best Value',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        credits: 5,
        priceFormatted: 'Rp 149,000',
        priceRaw: 149000,
        savings: 'Best Price/Test',
        slug: 'y9l4x3rpmyk5',
        url: 'https://lynk.id/englishwitharik/y9l4x3rpmyk5',
        description: 'Comprehensive preparation for scholarship and university exchange applications.',
        features: [
            '5 Full TOEFL ITP Mock Test Credits',
            'Full scaled scoring (310 - 677)',
            'Comprehensive answer explanations',
            'Progress and score trajectory tracking',
            'Valid forever - no expiration'
        ]
    },
    {
        id: 'vip-option',
        name: 'VIP Mock Test + 1-on-1 Review',
        badge: 'VIP Mentorship',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        credits: 1,
        priceFormatted: 'Rp 175,000',
        priceRaw: 175000,
        slug: 'vip-mentorship',
        url: 'https://wa.me/6282144223581?text=Hi%20Arik%2C%20I%20would%20like%20to%20book%20the%20VIP%20Mock%20Test%20Option.',
        description: '1 full mock test attempt plus a private 60-minute diagnostic and review session directly with Arik.',
        features: [
            '1 Full Mock Test Credit',
            '60-minute 1-on-1 Private Consultation with Arik',
            'Personalized error diagnosis and strategy guide',
            'Targeted score recommendation'
        ]
    }
];

export default function AdminPricingPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState<'transactions' | 'packages' | 'waitlist' | 'legacy-plans'>('transactions');

    // Stats
    const [stats, setStats] = useState<CreditStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Lynk Transactions
    const [transactions, setTransactions] = useState<LynkTransaction[]>([]);
    const [txLoading, setTxLoading] = useState(false);
    const [txSearch, setTxSearch] = useState('');
    const [txTotal, setTxTotal] = useState(0);

    // Legacy Plans States
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
    const [formData, setFormData] = useState<Partial<PricingPlan>>({
        name: '',
        description: '',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'IDR',
        perks: [],
        isActive: true,
        isPopular: false,
        tierLevel: 0,
    });

    // Waitlist States
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [fetchingWaitlist, setFetchingWaitlist] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchTransactions('');
    }, []);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const res = await api.get('/admin/credit-stats');
            setStats(res.data.data || res.data);
        } catch (err) {
            console.error('Failed to load credit stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchTransactions = useCallback(async (searchQuery: string) => {
        try {
            setTxLoading(true);
            const res = await api.get('/admin/credit-transactions', {
                params: { search: searchQuery, limit: 50 }
            });
            const data = res.data.data || res.data || [];
            setTransactions(data);
            setTxTotal(res.data.total ?? data.length);
        } catch (err) {
            console.error('Failed to load transactions:', err);
            toast.error('Failed to load credit transactions');
        } finally {
            setTxLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'transactions') {
                fetchTransactions(txSearch);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [txSearch, activeTab, fetchTransactions]);

    useEffect(() => {
        if (activeTab === 'waitlist') {
            fetchWaitlist();
        } else if (activeTab === 'legacy-plans' && plans.length === 0) {
            fetchPlans();
        }
    }, [activeTab]);

    const fetchPlans = async () => {
        setPlansLoading(true);
        try {
            const response = await api.get('/pricing/admin');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load legacy plans');
        } finally {
            setPlansLoading(false);
        }
    };

    const fetchWaitlist = async () => {
        setFetchingWaitlist(true);
        try {
            const response = await api.get('/admin/waitlist');
            setWaitlist(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Error fetching waitlist:', error);
            toast.error('Failed to load waitlist');
        } finally {
            setFetchingWaitlist(false);
        }
    };

    const handleDeleteWaitlist = async (id: number) => {
        if (!confirm('Are you sure you want to remove this entry from the waitlist?')) return;
        try {
            await api.delete(`/admin/waitlist/${id}`);
            toast.success('Removed from waitlist successfully');
            fetchWaitlist();
        } catch (error) {
            console.error('Error deleting waitlist entry:', error);
            toast.error('Failed to remove entry');
        }
    };

    const handleSubmitLegacyPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await api.put(`/pricing/${editingPlan.id}`, formData);
                toast.success('Plan updated successfully');
            } else {
                await api.post('/pricing', formData);
                toast.success('Plan created successfully');
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            toast.error('Failed to save plan');
        }
    };

    const handleDeleteLegacyPlan = async (id: number) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await api.delete(`/pricing/${id}`);
            toast.success('Plan deleted successfully');
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast.error('Failed to delete plan');
        }
    };

    const openLegacyModal = (plan?: PricingPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                description: '',
                priceMonthly: 0,
                priceYearly: 0,
                currency: 'IDR',
                perks: [],
                isActive: true,
                isPopular: false,
                tierLevel: plans.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 p-2 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#08507f] flex items-center gap-2">
                        <Coins className="w-7 h-7 text-amber-500" />
                        Credits & Packages Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitor student test credit purchases, Lynk.id webhook transactions, active pricing tiers, and legacy access.
                    </p>
                </div>
            </div>

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Purchased</p>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <Coins className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">
                        {statsLoading ? '...' : (stats?.totalCreditsPurchased ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Mock test credits bought</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lynk.id Revenue</p>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                        {statsLoading ? '...' : `Rp ${(stats?.totalRevenue ?? 0).toLocaleString()}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Recorded via webhooks</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Credits</p>
                        <div className="p-2 rounded-xl bg-blue-50 text-[#08507f]">
                            <PackageCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">
                        {statsLoading ? '...' : (stats?.totalActiveCredits ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">In student balances now</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Credits Used</p>
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">
                        {statsLoading ? '...' : (stats?.totalCreditsUsed ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Deducted for mock tests</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'transactions'
                                ? 'border-[#08507f] text-[#08507f]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Receipt className="w-4 h-4" />
                        Lynk.id Transactions ({txTotal})
                    </button>

                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'packages'
                                ? 'border-[#08507f] text-[#08507f]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Coins className="w-4 h-4" />
                        Active Credit Packages ({ACTIVE_CREDIT_PACKAGES.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('waitlist')}
                        className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'waitlist'
                                ? 'border-[#08507f] text-[#08507f]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Waitlist Signups{waitlist.length > 0 ? ` (${waitlist.length})` : ''}
                    </button>

                    <button
                        onClick={() => setActiveTab('legacy-plans')}
                        className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'legacy-plans'
                                ? 'border-[#08507f] text-[#08507f]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Legacy Subscriptions
                    </button>
                </nav>
            </div>

            {/* TAB 1: Lynk.id Transactions */}
            {activeTab === 'transactions' && (
                <div className="space-y-4">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer email or transaction ID..."
                                value={txSearch}
                                onChange={(e) => setTxSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#08507f] bg-white shadow-sm"
                            />
                        </div>
                        <span className="text-xs text-gray-500">
                            Showing {transactions.length} of {txTotal} transactions
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {txLoading ? (
                            <div className="p-12 text-center text-gray-400 animate-pulse font-medium">
                                Loading transaction records...
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-16 text-center text-gray-400">
                                <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="font-bold text-base text-slate-700">No Lynk.id transactions recorded yet</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                                    When students purchase credits via Lynk.id, the webhook automations will process and list payments here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Customer / Student
                                            </th>
                                            <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Credits Added
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Amount Paid
                                            </th>
                                            <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Transaction ID
                                            </th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {tx.userId ? (
                                                        <Link 
                                                            href={`/admin/users/${tx.userId}`} 
                                                            className="group flex flex-col hover:opacity-80"
                                                        >
                                                            <span className="text-sm font-bold text-gray-900 group-hover:text-[#08507f] transition-colors">
                                                                {tx.userName || tx.email}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{tx.email}</span>
                                                        </Link>
                                                    ) : (
                                                        <div>
                                                            <span className="text-sm font-semibold text-gray-900">{tx.email}</span>
                                                            <span className="text-[10px] text-amber-600 block">Pending initial login link</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                        tx.creditsAdded >= 5
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                            : tx.creditsAdded >= 3
                                                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        <Coins className="w-3.5 h-3.5" />
                                                        +{tx.creditsAdded} {tx.creditsAdded === 1 ? 'Credit' : 'Credits'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        Rp {Number(tx.amount || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                                                    {tx.transactionId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-500 font-medium">
                                                    {new Date(tx.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: Active Credit Packages */}
            {activeTab === 'packages' && (
                <div className="space-y-6">
                    <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-[#08507f]" />
                            <div>
                                <h3 className="text-sm font-bold text-[#08507f]">Live Credit Store via Lynk.id</h3>
                                <p className="text-xs text-slate-600">
                                    Each package links directly to the English with Arik Lynk checkout page and unlocks credits instantly via webhooks.
                                </p>
                            </div>
                        </div>
                        <a
                            href="https://lynk.id/englishwitharik"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#08507f] text-white text-xs font-bold rounded-xl hover:bg-[#064066] transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            Visit Lynk Store <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ACTIVE_CREDIT_PACKAGES.map((pkg) => (
                            <div 
                                key={pkg.id} 
                                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${pkg.badgeColor}`}>
                                            {pkg.badge}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {pkg.credits} {pkg.credits === 1 ? 'Credit' : 'Credits'}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 mb-1">{pkg.name}</h3>
                                    <p className="text-2xl font-extrabold text-[#08507f] mb-3">{pkg.priceFormatted}</p>
                                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">{pkg.description}</p>

                                    <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                                        {pkg.features.map((feat, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <a
                                        href={pkg.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        Open Checkout Link <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <p className="text-[10px] text-slate-400 text-center font-mono truncate">
                                        Slug: {pkg.slug}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: Waitlist */}
            {activeTab === 'waitlist' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {fetchingWaitlist ? (
                        <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Loading waitlist entries...</div>
                    ) : waitlist.length === 0 ? (
                        <div className="p-16 text-center text-gray-400">
                            <p className="font-bold text-lg text-slate-700 mb-1">No one has joined the waitlist</p>
                            <p className="text-sm max-w-sm mx-auto leading-relaxed">Waitlist entries submitted by prospective students will appear here.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Requested Plan</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User Status</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {waitlist.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{entry.email}</div>
                                            {entry.displayName && (
                                                <div className="text-xs text-gray-500 font-medium">Name: {entry.displayName}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-bold bg-[#e8f4fd] text-[#08507f] rounded-full uppercase tracking-wider">
                                                {entry.planName || `Plan #${entry.planId}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {entry.userId ? (
                                                <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold tracking-wider leading-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                                    Registered Account
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold tracking-wider leading-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                    Guest Visitor
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteWaitlist(entry.id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                                title="Remove from waitlist"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB 4: Legacy Plans */}
            {activeTab === 'legacy-plans' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Archived monthly and yearly recurring subscription tiers for reference or legacy accounts.
                        </div>
                        <Button onClick={() => openLegacyModal()} className="flex items-center gap-2 bg-[#08507f] hover:bg-[#064066] text-white text-xs">
                            <Plus className="w-4 h-4" /> Add Legacy Plan
                        </Button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {plansLoading ? (
                            <div className="p-8 text-center text-gray-400">Loading legacy plans...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price (Monthly/Yearly)</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {plans.map((plan) => (
                                        <tr key={plan.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{plan.name}</div>
                                                <div className="text-xs text-gray-500">{plan.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {plan.priceMonthly.toLocaleString()} / {plan.priceYearly.toLocaleString()} {plan.currency}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => openLegacyModal(plan)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteLegacyPlan(plan.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for Legacy Plan */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlan ? 'Edit Legacy Plan' : 'New Legacy Plan'}>
                <form onSubmit={handleSubmitLegacyPlan} className="space-y-4">
                    <Input
                        label="Plan Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Textarea
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Monthly Price"
                            type="number"
                            value={formData.priceMonthly}
                            onChange={(e) => setFormData({ ...formData, priceMonthly: parseInt(e.target.value) })}
                            required
                        />
                        <Input
                            label="Yearly Price"
                            type="number"
                            value={formData.priceYearly}
                            onChange={(e) => setFormData({ ...formData, priceYearly: parseInt(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Active</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingPlan ? 'Update Plan' : 'Create Plan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
