'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Coins, Plus, Minus, ArrowUpRight, ArrowDownLeft, Clock, History, FileText } from 'lucide-react';
import type { User } from '@/types/user';
import type { Attempt } from '@/types/test';

interface CreditLog {
    id: string;
    userId: string;
    email: string;
    changeAmount: number;
    balanceAfter: number;
    reason: string;
    referenceId?: string;
    createdAt: string;
}

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [user, setUser] = useState<User | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [creditLogs, setCreditLogs] = useState<CreditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Active main tab
    const [activeTab, setActiveTab] = useState<'attempts' | 'credit-logs'>('attempts');

    // Credit adjustment states
    const [adjustAmount, setAdjustAmount] = useState<number>(1);
    const [adjustReason, setAdjustReason] = useState<string>('Manual Admin Grant');
    const [customReason, setCustomReason] = useState<string>('');
    const [submittingCredit, setSubmittingCredit] = useState(false);

    useEffect(() => {
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [userRes, attemptsRes, creditLogsRes] = await Promise.all([
                api.get(`/admin/users/${userId}`),
                api.get(`/admin/users/${userId}/attempts`),
                api.get(`/admin/users/${userId}/credit-logs`).catch(() => ({ data: { data: [] } })),
            ]);
            setUser(userRes.data.data || userRes.data);
            setAttempts(attemptsRes.data.data || attemptsRes.data || []);
            setCreditLogs(creditLogsRes.data.data || creditLogsRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustCredits = async (overrideAmount?: number, overrideReason?: string) => {
        const amount = overrideAmount !== undefined ? overrideAmount : adjustAmount;
        if (!amount || isNaN(amount)) {
            toast.error('Please enter a valid non-zero credit amount');
            return;
        }

        const effectiveReason = overrideReason || (adjustReason === 'Other' ? customReason : adjustReason);
        if (!effectiveReason || !effectiveReason.trim()) {
            toast.error('Please specify a reason for this credit adjustment');
            return;
        }

        const actionText = amount > 0 ? `add ${amount} credit(s) to` : `deduct ${Math.abs(amount)} credit(s) from`;
        if (!window.confirm(`Are you sure you want to ${actionText} ${user?.displayName || user?.email}?`)) {
            return;
        }

        try {
            setSubmittingCredit(true);
            const res = await api.post(`/admin/users/${userId}/credits`, {
                amount,
                reason: effectiveReason.trim()
            });

            toast.success(res.data?.message || 'User credits updated successfully!');
            await fetchData();
            setCustomReason('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update credits');
        } finally {
            setSubmittingCredit(false);
        }
    };

    const formatReason = (reason: string) => {
        if (!reason) return 'Credit Change';
        const map: Record<string, string> = {
            'lynk_purchase': 'Lynk.id Purchase',
            'test_start': 'Test Attempt Started',
            'admin_manual_grant': 'Manual Admin Grant',
            'manual_grant': 'Manual Credit Grant',
            'bonus': 'Promotional Bonus',
        };
        return map[reason] || reason;
    };

    const getScoreDisplay = (attempt: Attempt) => {
        if (attempt.status !== 'completed') {
            return <Badge variant="default" className="bg-gray-100 text-gray-800">In Progress</Badge>;
        }

        if (attempt.mode === 'section_practice') {
            const sectionScore =
                attempt.practiceSectionType === 'listening' ? attempt.listeningScore :
                attempt.practiceSectionType === 'reading' ? attempt.readingScore :
                attempt.practiceSectionType === 'structure' ? attempt.structureScore :
                null;

            if (sectionScore !== null) {
                return <span className="font-bold">{sectionScore}</span>;
            }
            return <span className="text-gray-400 text-xs">Not Scored</span>;
        }

        if (attempt.overallScore !== null) {
            return (
                <div>
                    <span className="font-bold">{attempt.overallScore}</span>
                </div>
            );
        }

        return <span className="text-gray-400 text-xs">Not Scored</span>;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton variant="circle" width={64} height={64} />
                    <div className="space-y-2">
                        <Skeleton variant="text" width={200} height={24} />
                        <Skeleton variant="text" width={150} />
                    </div>
                </div>
                <Card padding={false}>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} variant="rect" height={60} />
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="space-y-6">
                <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    &larr; Back to Users
                </Link>
                <Card>
                    <div className="text-center py-8">
                        <p className="text-red-600 mb-4">{error || 'User not found'}</p>
                        <Button onClick={fetchData} variant="outline">
                            Try again
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const currentCredits = user.testCredits ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.displayName || user.email || 'No Name'}</h1>
                        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <span>{user.email}</span>
                            <span className="text-gray-300">•</span>
                            <Badge variant={user.role === 'admin' ? 'default' : 'default'}>
                                {user.role}
                            </Badge>
                            <span className="text-gray-300">•</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                currentCredits > 0
                                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                <Coins className="w-3.5 h-3.5 text-amber-600" />
                                {currentCredits} {currentCredits === 1 ? 'Credit' : 'Credits'}
                            </span>
                            {(user.city || user.country) && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs text-slate-600 font-semibold shadow-sm">
                                        📍 {[user.city, user.country].filter(Boolean).join(', ')}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Tabs for Attempts and Credit History */}
                <div className="lg:col-span-2 space-y-6">
                    <Card padding={false}>
                        {/* Tab Header */}
                        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex space-x-6">
                                <button
                                    onClick={() => setActiveTab('attempts')}
                                    className={`flex items-center gap-2 text-sm font-bold pb-2 pt-1 border-b-2 transition-all ${
                                        activeTab === 'attempts'
                                            ? 'border-[#08507f] text-[#08507f]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Attempts History ({attempts.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('credit-logs')}
                                    className={`flex items-center gap-2 text-sm font-bold pb-2 pt-1 border-b-2 transition-all ${
                                        activeTab === 'credit-logs'
                                            ? 'border-[#08507f] text-[#08507f]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <History className="w-4 h-4" />
                                    Credit Audit Logs ({creditLogs.length})
                                </button>
                            </div>
                        </div>

                        {activeTab === 'attempts' ? (
                            attempts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No attempts found for this user.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Test
                                                </th>
                                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Results
                                                </th>
                                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {attempts.map((attempt) => (
                                                <tr key={attempt.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(attempt.startedAt)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {attempt.test?.title || 'Unknown Test'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 capitalize">
                                                            {attempt.mode === 'section_practice' ? `Practice: ${attempt.practiceSectionType}` : 'Full Mock'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getScoreDisplay(attempt)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {attempt.status === 'completed' && (
                                                            <a
                                                                href={`/results/${attempt.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                            >
                                                                View Report &rarr;
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            creditLogs.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No credit activity recorded yet for this user.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Change
                                                </th>
                                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Balance After
                                                </th>
                                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reason
                                                </th>
                                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reference
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {creditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                        {formatDate(log.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            log.changeAmount > 0
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        }`}>
                                                            {log.changeAmount > 0 ? (
                                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                                            )}
                                                            {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount} Credits
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                                        {log.balanceAfter}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-medium">
                                                        {formatReason(log.reason)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-400 font-mono">
                                                        {log.referenceId ? (
                                                            log.referenceId.length > 20
                                                                ? `${log.referenceId.substring(0, 18)}...`
                                                                : log.referenceId
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </Card>
                </div>

                {/* Right Column: Credit Management & Actions */}
                <div className="space-y-6">
                    {/* Primary Credit Management Card */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Coins className="w-5 h-5 text-amber-500" />
                                Test Credit Balance
                            </h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                Active System
                            </span>
                        </div>

                        {/* Balance Banner */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl p-5 text-center mb-6 shadow-sm">
                            <p className="text-xs uppercase font-bold tracking-wider text-amber-800/70">Current Available Balance</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Coins className="w-8 h-8 text-amber-500" />
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    {currentCredits}
                                </span>
                            </div>
                            <p className="text-xs text-amber-900/70 font-medium mt-1">
                                {currentCredits === 1 ? '1 Mock Test Credit Available' : `${currentCredits} Mock Test Credits Available`}
                            </p>
                        </div>

                        {/* Quick Grant Buttons */}
                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Quick Credit Grant
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleAdjustCredits(1, 'Manual Grant: 1 Test Credit')}
                                    disabled={submittingCredit}
                                    className="px-3 py-2 text-xs font-bold rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <Plus className="w-3.5 h-3.5" /> +1 Credit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAdjustCredits(3, 'Manual Grant: 3 Test Credits (Value Pack)')}
                                    disabled={submittingCredit}
                                    className="px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <Plus className="w-3.5 h-3.5" /> +3 Credits
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAdjustCredits(5, 'Manual Grant: 5 Test Credits (Intensive Pack)')}
                                    disabled={submittingCredit}
                                    className="px-3 py-2 text-xs font-bold rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <Plus className="w-3.5 h-3.5" /> +5 Credits
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAdjustCredits(-1, 'Manual Correction: -1 Credit')}
                                    disabled={submittingCredit || currentCredits <= 0}
                                    className="px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <Minus className="w-3.5 h-3.5" /> -1 Credit
                                </button>
                            </div>
                        </div>

                        {/* Custom Adjustment Form */}
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Custom Adjustment
                            </label>
                            
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Amount (use negative number to deduct)</label>
                                <input
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#08507f]"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Adjustment Reason</label>
                                <select
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#08507f]"
                                >
                                    <option value="Manual Admin Grant">Manual Admin Grant</option>
                                    <option value="Lynk Purchase Manual Verification">Lynk Purchase Manual Verification</option>
                                    <option value="Promotional Bonus / Gift">Promotional Bonus / Gift</option>
                                    <option value="Technical Issue Free Retest">Technical Issue Free Retest</option>
                                    <option value="Account Correction">Account Correction</option>
                                    <option value="Other">Other (Enter custom note below)</option>
                                </select>
                            </div>

                            {adjustReason === 'Other' && (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter custom reason note..."
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#08507f]"
                                    />
                                </div>
                            )}

                            <Button
                                onClick={() => handleAdjustCredits()}
                                disabled={submittingCredit || adjustAmount === 0}
                                loading={submittingCredit}
                                className="w-full bg-[#08507f] hover:bg-[#064066] text-white font-bold"
                            >
                                Apply Credit Adjustment
                            </Button>
                            
                            <p className="text-[10px] text-gray-400 text-center italic">
                                * Updates student balance immediately and logs entry to audit history.
                            </p>
                        </div>
                    </Card>

                    {/* Legacy Subscription Information (if exists) */}
                    <Card>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                            <span>Legacy Subscriptions</span>
                            <span className="text-[10px] text-gray-400 font-normal">Past System</span>
                        </h3>
                        {user.subscription ? (
                            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Plan</span>
                                    <Badge variant="default" className="bg-blue-100 text-blue-700 capitalize font-bold">
                                        {user.subscription.planType}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Status</span>
                                    <Badge variant="default" className="bg-emerald-100 text-emerald-700 capitalize font-bold">
                                        {user.subscription.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Expires</span>
                                    <span className="font-semibold">{formatDate(user.subscription.expiresAt)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500">No active subscription</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Platform uses pay-as-you-go credits</p>
                            </div>
                        )}
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start text-sm" disabled>
                                Reset Password
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-sm text-red-600 hover:bg-red-50" disabled>
                                Deactivate Account
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
