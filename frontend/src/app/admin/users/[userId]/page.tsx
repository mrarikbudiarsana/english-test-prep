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
import type { User } from '@/types/user';
import type { Attempt } from '@/types/test';

const CURRENT_PTE_MAPPING_VERSION = 'pte_objective_2026_v1_0_0';
type MappingFilter = 'all' | 'current' | 'legacy';

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [user, setUser] = useState<User | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [mappingFilter, setMappingFilter] = useState<MappingFilter>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const getScoreDisplay = (attempt: Attempt) => {
        if (attempt.status !== 'completed') {
            return <Badge variant="default" className="bg-gray-100 text-gray-800">In Progress</Badge>;
        }

        const mappingLabel = attempt.scoreMappingVersion ? (
            <div className={`mt-1 text-[11px] ${attempt.test?.testType === 'pte_academic' ? 'text-cyan-700' : 'text-gray-500'}`}>
                Mapping: {attempt.scoreMappingVersion}
                {attempt.test?.testType === 'pte_academic' && attempt.scoreMappingVersion !== CURRENT_PTE_MAPPING_VERSION && (
                    <span className="ml-2 inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Legacy
                    </span>
                )}
            </div>
        ) : null;

        // TOEFL iBT 2026 Display
        if (attempt.test?.deliveryModel === 'toefl_ibt_2026') {
            const r = attempt.readingBand ?? '-';
            const l = attempt.listeningBand ?? '-';
            const w = attempt.writingBand ?? '-';
            const s = attempt.speakingBand ?? '-';
            const overall = attempt.overallBand ?? '-';

            const r30 = attempt.readingScore30 ?? '-';
            const l30 = attempt.listeningScore30 ?? '-';
            const w30 = attempt.writingScore30 ?? '-';
            const s30 = attempt.speakingScore30 ?? '-';

            return (
                <div className="text-xs">
                    <div className="font-bold text-sm mb-1">
                        Band: {overall} <span className="text-gray-400 font-normal">/ 6</span>
                    </div>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-gray-600">
                        <div>R: {r} <span className="text-[10px] text-gray-400">({r30})</span></div>
                        <div>L: {l} <span className="text-[10px] text-gray-400">({l30})</span></div>
                        <div>W: {w} <span className="text-[10px] text-gray-400">({w30})</span></div>
                        <div>S: {s} <span className="text-[10px] text-gray-400">({s30})</span></div>
                    </div>
                    {mappingLabel}
                </div>
            );
        }

        // Standard Scores
        if (attempt.overallScore !== null) {
            return (
                <div>
                    <span className="font-bold">{attempt.overallScore}</span>
                    {mappingLabel}
                </div>
            );
        }
        if (attempt.overallBand !== null) {
            return (
                <div>
                    <span className="font-bold">Band {attempt.overallBand}</span>
                    {mappingLabel}
                </div>
            );
        }

        return <span className="text-gray-400 text-xs">Not Scored</span>;
    };

    const filteredAttempts = attempts.filter((attempt) => {
        if (mappingFilter === 'all') return true;
        if (attempt.test?.testType !== 'pte_academic') return true;
        if (attempt.status !== 'completed') return true;

        const version = attempt.scoreMappingVersion;
        if (!version) return mappingFilter === 'legacy';
        if (mappingFilter === 'current') return version === CURRENT_PTE_MAPPING_VERSION;
        return version !== CURRENT_PTE_MAPPING_VERSION;
    });

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
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                            {user.email}
                            <Badge variant={user.role === 'admin' ? 'default' : 'default'} className="ml-2">
                                {user.role}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <Card padding={false}>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Attempts History ({filteredAttempts.length})</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="mapping-filter" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Mapping
                        </label>
                        <select
                            id="mapping-filter"
                            value={mappingFilter}
                            onChange={(e) => setMappingFilter(e.target.value as MappingFilter)}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            <option value="current">Current</option>
                            <option value="legacy">Legacy</option>
                        </select>
                    </div>
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
    );
}
