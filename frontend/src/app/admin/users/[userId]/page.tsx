'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/user';
import type { Attempt } from '@/types/test';

type MappingFilter = 'all';

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [user, setUser] = useState<User | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [mappingFilter] = useState<MappingFilter>('all');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assignPlan, setAssignPlan] = useState<string>('monthly');

    useEffect(() => {
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [userRes, attemptsRes] = await Promise.all([
                api.get(`/admin/users/${userId}`),
                api.get(`/admin/users/${userId}/attempts`),
            ]);
            setUser(userRes.data.data || userRes.data);
            setAttempts(attemptsRes.data.data || attemptsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPackage = async () => {
        if (!window.confirm(`Are you sure you want to manually assign the ${assignPlan} plan to this user?`)) {
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/admin/users/${userId}/assign-package`, {
                planType: assignPlan,
                examType: 'toefl_itp'
            });
            await fetchData();
            alert('Package assigned successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to assign package');
        } finally {
            setSubmitting(false);
        }
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

    const filteredAttempts = attempts.filter(() => mappingFilter === 'all');

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.displayName || 'No Name'}</h1>
                        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>{user.email}</span>
                            <span className="text-gray-300">•</span>
                            <Badge variant={user.role === 'admin' ? 'default' : 'default'}>
                                {user.role}
                            </Badge>
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
                <div className="lg:col-span-2 space-y-6">
                    <Card padding={false}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Attempts History ({filteredAttempts.length})</h2>
                        </div>

                {filteredAttempts.length === 0 ? (
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
                                {filteredAttempts.map((attempt) => (
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
                )}
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Status</h3>
                {user.subscription ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Plan</span>
                            <Badge variant="default" className="bg-blue-100 text-blue-700 capitalize font-bold">
                                {user.subscription.planType}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Status</span>
                            <Badge variant="default" className="bg-emerald-100 text-emerald-700 capitalize font-bold">
                                {user.subscription.status}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Expires</span>
                            <span className="text-sm font-semibold">{formatDate(user.subscription.expiresAt)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                        <p className="text-sm text-slate-500">No active subscription</p>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Assign Manual Package</h4>
                    <div className="space-y-4">
                        <Select
                            label="Select Plan"
                            value={assignPlan}
                            onChange={(e) => setAssignPlan(e.target.value)}
                            options={[
                                { label: 'Monthly Plan', value: 'monthly' },
                                { label: 'Quarterly Plan', value: 'quarterly' },
                                { label: 'Yearly Plan', value: 'yearly' },
                            ]}
                        />
                        <Button
                            onClick={handleAssignPackage}
                            className="w-full"
                            disabled={submitting}
                            loading={submitting}
                        >
                            Assign Package
                        </Button>
                        <p className="text-[10px] text-gray-400 text-center italic">
                            * This will immediately activate the selected plan for this user.
                        </p>
                    </div>
                </div>
            </Card>

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
