'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/api/axios';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import LoadError from '@/components/LoadError';

const ACTIONS = {
  'file.create': 'Created project',
  'file.open': 'Opened project',
  'file.update': 'Edited project',
  'file.delete': 'Deleted project',
  'member.add': 'Shared with',
  'member.remove': 'Removed access for',
  'user.create': 'Created user',
  'user.delete': 'Deleted user',
  'user.password_change': 'Changed password'
};

const FILTERS = [
  ['', 'All activity'],
  ['file.create', 'Who created projects'],
  ['file.open', 'Project opens'],
  ['file.update', 'Edits'],
  ['file.delete', 'Deletions'],
  ['member.add', 'Sharing'],
  ['user.password_change', 'Password changes']
];

const LIMIT = 500;

function AuditContent() {
  const router = useRouter();
  const action = useSearchParams().get('action') || '';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let stale = false;
    setLoading(true);
    setError(false);
    api
      .get('/api/admin/audit-logs', { params: action ? { action } : {} })
      .then((res) => !stale && setLogs(res.data))
      .catch(() => !stale && setError(true))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [action]);

  useEffect(() => load(), [load]);

  return (
    <div className="min-h-dvh bg-ink text-paper pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-paper/10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-paper">Audit logs</h1>
            <p className="text-sm text-paper/60 mt-1">
              Who did what, newest first. Shows the latest {LIMIT} entries.
            </p>
          </div>
          <div>
            <label htmlFor="audit-filter" className="block text-sm text-paper/80 mb-1.5">Show</label>
            <select
              id="audit-filter"
              value={action}
              onChange={(e) => router.replace(e.target.value ? `?action=${e.target.value}` : '?')}
              className="px-3 py-2 rounded-lg bg-panel border border-paper/10 text-sm text-paper"
            >
              {FILTERS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <LoadError message="Could not load the audit logs." onRetry={load} />
        ) : loading ? (
          <div className="mt-6 space-y-2" aria-busy="true" aria-label="Loading audit logs">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-panel/60 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="mt-10 text-center text-sm text-paper/60">
            {action ? 'No entries match this filter.' : 'Nothing has been logged yet.'}
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-paper/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs text-paper/60 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">When</th>
                  <th scope="col" className="px-4 py-3">Who</th>
                  <th scope="col" className="px-4 py-3">What</th>
                  <th scope="col" className="px-4 py-3">Project</th>
                  <th scope="col" className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper/10">
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-paper/60 tabular-nums">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-paper">{l.actorEmail}</td>
                    <td className="px-4 py-2.5 text-paper whitespace-nowrap">{ACTIONS[l.action] || l.action}</td>
                    <td className="px-4 py-2.5 font-mono text-xs max-w-[16rem] truncate">
                      {l.fileName ? (
                        l.action === 'file.delete' ? (
                          <span className="text-paper/80">{l.fileName}</span>
                        ) : (
                          <Link href={`/files/${l.fileId}`} className="text-brand hover:underline">
                            {l.fileName}
                          </Link>
                        )
                      ) : (
                        <span className="text-paper/60">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-paper/60">{l.details || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <Suspense>
          <AuditContent />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}
