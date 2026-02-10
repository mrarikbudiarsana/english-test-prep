'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import TestForm from '@/components/admin/TestForm';

export default function AdminNewTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    testType: string;
    isFree: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/admin/tests', data);
      const newTest = response.data.data || response.data;
      router.push(`/admin/tests/${newTest.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create test');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/tests"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Test</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <TestForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
}
