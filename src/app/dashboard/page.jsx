'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Modal from '@/components/Modal';
import LoadError from '@/components/LoadError';
import { Plus, FileCode2, Trash2, Shield, Users, Search, Lock, Calendar } from 'lucide-react';

const TABS = [
  ['all', 'All'],
  ['owned', 'Mine'],
  ['shared', 'Shared with me']
];

function DashboardContent() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { isAdmin } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const params = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(params.get('q') || ''); // local copy keeps typing instant
  const activeTab = params.get('tab') || 'all';

  // Search and tab live in the URL so refresh, back and shared links keep them
  const setParam = (key, value) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : '?', { scroll: false });
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/api/files');
      setFiles(res.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    setCreating(true);
    try {
      const res = await api.post('/api/files', { name: newFileName.trim(), variables: [] });
      toast.success(`Created "${res.data.name}"`);
      router.push(`/files/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create the project. Try again.');
      setCreating(false);
    }
  };

  const handleDeleteFile = async (id, name) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      message: 'Its variables and sharing will be removed for everyone. This cannot be undone.',
      confirmLabel: 'Delete project'
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await api.delete(`/api/files/${id}`);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success(`Deleted "${name}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete the project. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return files.filter((file) => {
      const matches =
        file.name.toLowerCase().includes(q) ||
        (isAdmin && file.owner?.email?.toLowerCase().includes(q));
      if (!matches) return false;
      if (isAdmin) return true;
      if (activeTab === 'owned') return file.role === 'owner';
      if (activeTab === 'shared') return file.role === 'member';
      return true;
    });
  }, [files, searchQuery, activeTab, isAdmin]);

  const counts = {
    all: files.length,
    owned: files.filter((f) => f.role === 'owner').length,
    shared: files.filter((f) => f.role === 'member').length
  };

  return (
    <div className="min-h-dvh bg-ink text-paper pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-paper/10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-paper flex items-center gap-2.5">
              Projects
              {isAdmin && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  Admin: all projects
                </span>
              )}
            </h1>
            <p className="text-sm text-paper/60 mt-1">
              Encrypted environment variables, shared with the people who need them.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-ink text-sm font-semibold transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New project
          </button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {!isAdmin ? (
            <div role="group" aria-label="Filter projects" className="flex items-center gap-1 bg-panel p-1 rounded-lg border border-paper/10 self-start">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={activeTab === key}
                  onClick={() => setParam('tab', key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === key ? 'bg-paper/10 text-paper' : 'text-paper/60 hover:text-paper'
                  }`}
                >
                  {label} ({counts[key]})
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-paper/60">{files.length} project(s) across all users</p>
          )}

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-paper/60" />
            <input
              type="search"
              aria-label={isAdmin ? 'Search by project name or owner email' : 'Search projects'}
              placeholder={isAdmin ? 'Search name or owner email' : 'Search projects'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setParam('q', e.target.value);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-panel border border-paper/10 text-sm text-paper placeholder-paper/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
            />
          </div>
        </div>

        {error ? (
          <LoadError message="Could not load your projects." onRetry={fetchFiles} />
        ) : loading ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading projects">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-panel/60 border border-paper/10 animate-pulse" />
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-paper/10 bg-panel/30 p-12 text-center">
            <FileCode2 className="w-6 h-6 text-paper/60 mx-auto mb-3" />
            {searchQuery || activeTab !== 'all' ? (
              <>
                <h2 className="text-base font-semibold text-paper">No projects match</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    router.replace('?', { scroll: false });
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-paper/10 hover:bg-paper/20 text-sm font-medium text-paper transition-colors"
                >
                  Clear search and filters
                </button>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-paper">No projects yet</h2>
                <p className="text-sm text-paper/60 mt-1 max-w-sm mx-auto">
                  Create a project to store its environment variables, or import an existing .env file into it.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold text-ink transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New project
                </button>
              </>
            )}
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const canDelete = file.role === 'owner' || isAdmin;

              return (
                <li
                  key={file._id}
                  className="group relative rounded-xl border border-paper/10 bg-panel/50 hover:bg-panel hover:border-paper/20 focus-within:border-paper/30 transition-colors p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 h-8">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          file.role === 'owner'
                            ? 'bg-brand/10 text-brand border border-brand/20'
                            : 'bg-paper/10 text-paper/80 border border-paper/20'
                        }`}
                      >
                        {file.role === 'owner' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {file.role === 'owner' ? 'Owner' : 'Shared with you'}
                      </span>
                    </div>

                    {/* The title link stretches over the whole card; the delete button sits above it */}
                    <h2 className="text-base font-semibold text-paper group-hover:text-brand transition-colors min-w-0">
                      <Link
                        href={`/files/${file._id}`}
                        className="flex items-center gap-2 after:absolute after:inset-0 after:rounded-xl"
                      >
                        <FileCode2 className="w-4 h-4 text-brand shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </Link>
                    </h2>

                    {(file.role === 'member' || isAdmin) && (
                      <p className="text-xs text-paper/60 mt-1 truncate">
                        Owner: <span className="text-paper/80">{file.owner?.email || 'Unknown'}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-paper/10 flex items-center justify-between text-xs text-paper/60">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono">
                        <Lock className="w-3.5 h-3.5" />
                        {file.variablesCount}
                        <span className="sr-only"> variables</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {file.membersCount}
                        <span className="sr-only"> people shared with</span>
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file._id, file.name)}
                      disabled={deletingId === file._id}
                      aria-label={`Delete ${file.name}`}
                      title="Delete project"
                      className="absolute top-4 right-4 z-10 p-1.5 text-paper/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isCreateModalOpen && (
        <Modal title="New project" onClose={() => setIsCreateModalOpen(false)}>
          <form onSubmit={handleCreateFile} className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-paper/80 mb-2">
                Project name
              </label>
              <input
                id="project-name"
                type="text"
                required
                autoFocus
                placeholder="payments-api"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-ink border border-paper/20 text-sm text-paper placeholder-paper/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent font-mono"
              />
              <p className="text-xs text-paper/60 mt-1.5">Downloads are saved as this name followed by .env.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-paper/10 hover:bg-paper/20 text-sm font-medium text-paper transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold text-ink transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense>
          <DashboardContent />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}
