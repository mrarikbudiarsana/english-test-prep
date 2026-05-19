'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/user';

const PAGE_SIZE = 50;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async (currentOffset: number, append: boolean, searchQuery: string) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      const response = await api.get('/admin/users', {
        params: { offset: currentOffset, limit: PAGE_SIZE, search: searchQuery },
      });
      const rows: User[] = response.data.data || response.data;
      const totalCount: number = response.data.total ?? rows.length;
      setTotal(totalCount);
      setUsers((prev) => (append ? [...prev, ...rows] : rows));
      setOffset(currentOffset + rows.length);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(0, false, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  const filtered = users;

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      const updatedUser = response.data.data || response.data;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <Card padding={false}>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rect" height={48} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <span className="text-sm text-gray-500">{total} total users</span>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
      </div>

      {error && (
        <Card>
          <div className="text-center py-4">
            <p className="text-red-600 mb-2">{error}</p>
            <button onClick={() => fetchUsers(0, false, search)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Try again
            </button>
          </div>
        </Card>
      )}

      {!error && filtered.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-gray-500">
              {search ? 'No users match your search.' : 'No users found.'}
            </p>
          </div>
        </Card>
      )}

      {!error && filtered.length > 0 && (
        <>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Free Tests
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${user.id}`} className="group flex items-center gap-3 hover:opacity-80 transition-opacity">
                          {user.photoUrl ? (
                            <Image
                              src={user.photoUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                              width={32}
                              height={32}
                              unoptimized
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700 group-hover:bg-blue-200 transition-colors">
                              {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {user.displayName || user.email || 'No name'}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.city || user.country ? (
                          <span className="text-sm text-slate-600 font-medium">
                            {[user.city, user.country].filter(Boolean).join(', ')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                          disabled={updatingUserId === user.id}
                          className={`text-xs font-medium rounded-full px-3 py-1 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 ${user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                            } ${updatingUserId === user.id ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={user.freeTestsRemaining > 0 ? 'info' : 'default'}>
                          {user.freeTestsRemaining}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Load more */}
          {!search && users.length < total && (
            <div className="flex justify-center">
              <button
                onClick={() => fetchUsers(offset, true, search)}
                disabled={loadingMore}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-wait transition-colors shadow-sm"
              >
                {loadingMore ? 'Loading…' : `Load more (${total - users.length} remaining)`}
              </button>
            </div>
          )}

          {!search ? (
            <p className="text-center text-xs text-gray-400">
              Showing {users.length} of {total} users
            </p>
          ) : (
            <p className="text-center text-xs text-gray-400">
              Showing {filtered.length} matching users (from {users.length} loaded)
            </p>
          )}
        </>
      )}
    </div>
  );
}
