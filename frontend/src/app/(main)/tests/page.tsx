'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Test } from '@/types/test';
import { useAuth } from '@/contexts/AuthContext';
import { HiClock, HiAcademicCap, HiLockClosed, HiLockOpen } from 'react-icons/hi';

export default function TestCatalogPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTests() {
      try {
        const response = await api.get('/tests');
        // API interceptor already unwraps { data: ... }, so response.data = { rows: [...], total: X }
        const result = response.data;
        const testsArray = result?.rows || [];
        setTests(Array.isArray(testsArray) ? testsArray : []);
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Failed to load tests');
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Practice Tests</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Tests</h1>
          <p className="text-gray-500 mt-1">Choose a test to practice your IELTS skills</p>
        </div>
        {user && (
          <div className="text-sm text-gray-500">
            Free tests remaining: <span className="font-semibold text-blue-600">{user.freeTestsRemaining}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {tests.length === 0 && !error ? (
        <div className="text-center py-12">
          <HiAcademicCap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tests available</h3>
          <p className="mt-2 text-gray-500">Check back later for new practice tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Link
              key={test.id}
              href={`/tests/${test.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {test.title}
                </h3>
                {test.isFree ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <HiLockOpen className="w-3 h-3 mr-1" />
                    Free
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <HiLockClosed className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                )}
              </div>

              {test.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {test.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <HiClock className="w-4 h-4 mr-1" />
                  {test.durationMinutes} min
                </span>
                <span className="capitalize px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                  {test.testType === 'general_training' ? 'General Training' : 'Academic'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
