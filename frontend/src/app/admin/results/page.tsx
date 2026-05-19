'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HiDownload } from 'react-icons/hi';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 50;

interface ResultRow {
  id: string;
  userId: string;
  testId: string;
  mode: string;
  practiceSectionType: 'listening' | 'reading' | 'structure' | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  // Scores
  listeningScore: number | null;
  readingScore: number | null;
  structureScore: number | null;
  overallScore: number | null;
  // Joined fields
  testTitle: string;
  testType: string;
  userName: string | null;
  userEmail: string;
  userPhotoUrl: string | null;
}

function testTypeLabel(testType: string): string {
  switch (testType) {
    case 'toefl_itp': return 'TOEFL ITP';
    default: return 'TOEFL ITP';
  }
}

function testTypeBadgeColor(testType: string): string {
  switch (testType) {
    case 'toefl_itp':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

function formatScore(row: ResultRow): string {
  if (row.mode === 'section_practice') {
    if (row.practiceSectionType === 'listening' && row.listeningScore != null) return `${row.listeningScore}`;
    if (row.practiceSectionType === 'reading' && row.readingScore != null) return `${row.readingScore}`;
    if (row.practiceSectionType === 'structure' && row.structureScore != null) return `${row.structureScore}`;
    return '—';
  }
  if (row.overallScore != null) return `${row.overallScore}`;
  return '—';
}

function getResultsLink(row: ResultRow): string {
  return `/results/${row.id}`;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchResults = useCallback(async (currentOffset: number, append: boolean, searchQuery: string) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      const response = await api.get('/admin/results', {
        params: { offset: currentOffset, limit: PAGE_SIZE, search: searchQuery },
      });
      const rows: ResultRow[] = response.data.data || response.data;
      const totalCount: number = response.data.total ?? rows.length;
      setTotal(totalCount);
      setResults((prev) => (append ? [...prev, ...rows] : rows));
      setOffset(currentOffset + rows.length);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load results');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Handle search with debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(0, false, search);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [search, fetchResults]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get('/admin/results/export', {
        params: { search }
      });
      const data = response.data.data || response.data;
      
      if (!Array.isArray(data) || data.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = ['Student Name', 'Student Email', 'Test Title', 'Test Type', 'Mode', 'Score', 'Listening', 'Structure', 'Reading', 'Completed At'];
      const rows = data.map(row => [
        `"${row.userName || row.userEmail || 'No name'}"`,
        `"${row.userEmail}"`,
        `"${row.testTitle}"`,
        `"${testTypeLabel(row.testType)}"`,
        `"${row.mode}"`,
        row.overallScore ?? '',
        row.listeningScore ?? '',
        row.structureScore ?? '',
        row.readingScore ?? '',
        row.completedAt ? new Date(row.completedAt).toLocaleString() : ''
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `itp_ready_results_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const filtered = results;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">All Test Results</h1>
        <Card padding={false}>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="rect" height={52} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Test Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">Completed attempts, sorted from latest</p>
        </div>
        <span className="text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
          {total} completed results
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport} 
          loading={exporting}
          className="flex items-center gap-2"
        >
          {!exporting && <HiDownload className="w-4 h-4" />}
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, email, or test…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
      </div>

      {/* Error */}
      {error && (
        <Card>
          <div className="text-center py-4">
            <p className="text-red-600 mb-2">{error}</p>
            <button onClick={() => fetchResults(0, false, search)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Try again
            </button>
          </div>
        </Card>
      )}

      {/* Empty */}
      {!error && filtered.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">
              {search ? 'No results match your search.' : 'No completed results yet.'}
            </p>
          </div>
        </Card>
      )}

      {/* Table */}
      {!error && filtered.length > 0 && (
        <>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Student
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Test
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Type
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Score
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Completed
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row, idx) => (
                    <tr key={row.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      {/* Student */}
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/users/${row.userId}`} className="group flex items-center gap-2.5">
                          {row.userPhotoUrl ? (
                            <img
                              src={row.userPhotoUrl}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                              {(row.userName || row.userEmail || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                              {row.userName || row.userEmail || 'No name'}
                            </p>
                            <p className="text-xs text-gray-500 leading-tight">{row.userEmail}</p>
                          </div>
                        </Link>
                      </td>

                      {/* Test title */}
                      <td className="px-5 py-3.5">
                        <span className="text-gray-800 font-medium line-clamp-2 max-w-[200px]">
                          {row.testTitle}
                        </span>
                      </td>

                      {/* Test type */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${testTypeBadgeColor(row.testType)}`}>
                          {testTypeLabel(row.testType)}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="tabular-nums font-semibold text-gray-900">
                          {formatScore(row)}
                        </span>
                      </td>


                      {/* Completed at */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-gray-600">
                          {row.completedAt ? formatDate(row.completedAt) : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-center">
                        <Link
                          href={getResultsLink(row)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          View Result
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Load more — only shown when not searching (search filters loaded data) */}
          {!search && results.length < total && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => fetchResults(offset, true, search)}
                disabled={loadingMore}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-wait transition-colors shadow-sm"
              >
                {loadingMore ? 'Loading…' : `Load more (${total - results.length} remaining)`}
              </button>
              <p className="text-xs text-gray-400">Showing {results.length} of {total} results</p>
            </div>
          )}

          {search && (
            <p className="text-center text-xs text-gray-400">
              Showing {filtered.length} matching results (from {results.length} loaded)
            </p>
          )}
        </>
      )}
    </div>
  );
}
