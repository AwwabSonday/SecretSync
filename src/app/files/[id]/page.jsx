'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import ShareModal from '@/components/ShareModal';
import ProjectActivity from '@/components/ProjectActivity';
import { useConfirm } from '@/context/ConfirmContext';
import { useUnsavedRef } from '@/context/UnsavedContext';
import {
  ArrowLeft,
  Save,
  Download,
  Share2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  Users,
  Loader2,
  AlertTriangle,
  FileCode2,
  Upload,
  Rows3,
  FileText
} from 'lucide-react';

const canMaskText = () => typeof CSS !== 'undefined' && CSS.supports('-webkit-text-security', 'disc');

// Variables <-> .env text. Comments and blank lines are not preserved.
const toEnvText = (vars) =>
  vars
    .filter((v) => v.key && v.key.trim().length > 0)
    .map((v) => {
      const key = v.key.trim();
      const value = v.value || '';
      return /[\s"'#]/.test(value) ? `${key}="${value.replace(/"/g, '\\"')}"` : `${key}=${value}`;
    })
    .join('\n');

const parseEnvText = (text) =>
  text.split(/\r?\n/).flatMap((line) => {
    const m = line.match(/^\s*(?:export\s+)?([^#=\s][^=]*?)\s*=\s*(.*)$/);
    if (!m) return [];
    let value = m[2].trim();
    // ponytail: multi-line quoted values are not supported
    const quoted = value.match(/^"((?:\\.|[^"\\])*)"|^'([^']*)'/);
    if (quoted) value = quoted[1] !== undefined ? quoted[1].replace(/\\"/g, '"') : quoted[2];
    else value = value.replace(/\s+#.*$/, '');
    return [{ key: m[1], value }];
  });

function FileEditorContent() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const dirtyRef = useUnsavedRef();

  const [file, setFile] = useState(null);
  const [variables, setVariables] = useState([]);
  const [initialVariables, setInitialVariables] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Masking state: set of indices that are revealed
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [textRevealed, setTextRevealed] = useState(false);
  const importRef = useRef(null);

  // Check unsaved changes
  const isDirty =
    JSON.stringify(variables) !== JSON.stringify(initialVariables) || (file !== null && fileName !== file.name);

  // Tell the navbar about unsaved edits so in-app navigation can ask first
  useEffect(() => {
    dirtyRef.current = isDirty;
    return () => {
      dirtyRef.current = false;
    };
  }, [isDirty, dirtyRef]);

  // Warn on browser tab close/refresh if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Fetch file with revealed values for editing
  const fetchFile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch with ?reveal=true so user can view/edit decrypted values
      const res = await api.get(`/api/files/${id}?reveal=true`);
      setFile(res.data);
      setFileName(res.data.name);
      const vars = res.data.variables || [];
      setVariables(vars);
      setInitialVariables(vars);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load file');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFile();
  }, [id]);

  const isOwnerOrAdmin = file?.role === 'owner' || isAdmin;

  // Add variable row
  const handleAddRow = () => {
    setVariables((prev) => [...prev, { key: '', value: '' }]);
    // Default new row to revealed so user can see what they type
    setRevealedIndices((prev) => new Set(prev).add(variables.length));
  };

  // Update variable row
  const handleVariableChange = (index, field, val) => {
    setVariables((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Remove variable row
  const handleRemoveRow = (index) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
    setRevealedIndices((prev) => {
      const next = new Set();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  // Toggle reveal for individual row
  const toggleReveal = (index) => {
    setRevealedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Reveal all or mask all
  const toggleRevealAll = () => {
    if (revealedIndices.size === variables.length) {
      setRevealedIndices(new Set());
    } else {
      setRevealedIndices(new Set(variables.map((_, i) => i)));
    }
  };

  const toggleTextMode = () => {
    if (!textMode) {
      setText(toEnvText(variables));
      setTextRevealed(true);
    }
    setTextMode(!textMode);
  };

  // Non-empty, non-comment lines the parser could not turn into KEY=value
  const ignoredLines = textMode
    ? text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#')).length - variables.length
    : 0;

  const handleTextChange = (val) => {
    setText(val);
    setVariables(parseEnvText(val));
  };

  // Import a .env file: same key overwrites, new keys are appended
  const handleImport = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const imported = parseEnvText(await f.text());
    if (imported.length === 0) return toast.error(`No KEY=VALUE lines found in ${f.name}`);
    const merged = [...variables];
    let updated = 0;
    let added = 0;
    imported.forEach((v) => {
      const i = merged.findIndex((m) => m.key.trim() === v.key);
      if (i >= 0) {
        if (merged[i].value !== v.value) updated++;
        merged[i] = { ...merged[i], value: v.value };
      } else {
        merged.push(v);
        added++;
      }
    });
    if (updated > 0) {
      const ok = await confirm({
        title: `Overwrite ${updated} existing value${updated === 1 ? '' : 's'}?`,
        message: `${f.name} has different values for keys already in this project. ${added} new variable${added === 1 ? '' : 's'} will also be added. Nothing is saved until you click Save.`,
        confirmLabel: 'Import'
      });
      if (!ok) return;
    }
    setVariables(merged);
    if (textMode) setText(toEnvText(merged));
    toast.success(`Imported from ${f.name}: ${added} new, ${updated} updated. Click Save to keep them.`);
  };

  // Copy value to clipboard
  const handleCopyValue = async (value, index) => {
    try {
      await navigator.clipboard.writeText(value || '');
      setCopiedIndex(index);
      toast.success('Value copied');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: fileName,
        variables: variables.map((v) => ({
          key: v.key.trim(),
          value: v.value !== undefined ? v.value : ''
        }))
      };
      const res = await api.put(`/api/files/${id}`, payload);
      setFile(res.data);
      setVariables(res.data.variables);
      setInitialVariables(res.data.variables);
      toast.success('File saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Delete file
  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete "${file.name}"?`,
      message: 'Its variables and sharing will be removed for everyone. This cannot be undone.',
      confirmLabel: 'Delete project'
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/api/files/${id}`);
      toast.success('File deleted successfully');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file');
      setDeleting(false);
    }
  };

  const envFileName = () =>
    `${fileName.replace(/^\.?env[._-]?|\.env$/gi, '').trim().replace(/\s+/g, '_') || fileName.trim() || 'project'}.env`;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(toEnvText(variables) + '\n');
      toast.success('Copied the whole .env to the clipboard');
    } catch {
      toast.error('Could not copy. Allow clipboard access and try again.');
    }
  };

  // Download as <project_name>.env
  const handleDownloadEnv = async () => {
    const downloadName = envFileName();
    const blob = new Blob([toEnvText(variables) + '\n'], { type: 'text/plain;charset=utf-8' });

    // Chrome and Edge: let the user pick the folder and name. Other browsers fall back to the normal download below.
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: downloadName,
          types: [{ description: 'Environment file', accept: { 'text/plain': ['.env'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success(`Saved ${handle.name}`);
      } catch (err) {
        if (err.name !== 'AbortError') toast.error('Could not save the file. Try again.');
      }
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${downloadName}`);
  };

  const handleBackNavigation = async () => {
    if (isDirty) {
      const leave = await confirm({
        title: 'Discard unsaved changes?',
        message: 'You have edits in this project that have not been saved. Leaving now will discard them.',
        confirmLabel: 'Discard and leave'
      });
      if (!leave) return;
    }
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-ink flex flex-col items-center justify-center text-paper/60">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-3" />
        <p className="text-sm font-medium">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink text-paper pb-20">
      {/* Top action bar */}
      <div className="border-b border-paper/10 bg-panel/60 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackNavigation}
              aria-label="Back to projects"
              className="p-1.5 rounded-lg text-paper/60 hover:text-paper hover:bg-paper/10 transition-colors"
              title="Back to projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-brand shrink-0" />
              {isOwnerOrAdmin ? (
                <input
                  type="text"
                  aria-label="Project name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="font-mono text-base font-semibold text-paper bg-transparent border-b border-transparent hover:border-paper/20 focus:border-brand focus:outline-none px-1 py-0.5 rounded transition-colors"
                  title="Click to rename"
                />
              ) : (
                <span className="font-mono text-base font-semibold text-paper px-1">
                  {fileName}
                </span>
              )}

              {/* Role badge */}
              <span
                className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  file?.role === 'owner'
                    ? 'bg-brand/10 text-brand border border-brand/20'
                    : 'bg-paper/10 text-paper/80 border border-paper/20'
                }`}
              >
                {file?.role === 'owner' ? (
                  <Shield className="w-3 h-3" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
                {file?.role === 'owner' ? 'Owner' : 'Shared with you'}
              </span>

              {/* Unsaved warning badge */}
              {isDirty && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3 h-3" />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/10 hover:bg-paper/20 text-xs font-semibold text-paper border border-paper/20 transition-colors"
              title="Copy the whole .env"
              aria-label="Copy the whole .env"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy all</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadEnv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/10 hover:bg-paper/20 text-xs font-semibold text-paper border border-paper/20 transition-colors shadow-sm"
              title="Download as project_name.env"
              aria-label="Download as .env file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <input ref={importRef} type="file" aria-label="Import a .env file" className="hidden" onChange={handleImport} />
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/10 hover:bg-paper/20 text-xs font-semibold text-paper border border-paper/20 transition-colors shadow-sm"
              title="Import variables from a .env file"
              aria-label="Import a .env file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Share button (Owner/Admin only) */}
            {isOwnerOrAdmin && (
              <button
                type="button"
                aria-label="Share project"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/10 hover:bg-paper/20 text-xs font-semibold text-paper border border-paper/20 transition-colors shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span> ({file?.members?.length || 0})
              </button>
            )}

            {/* Delete button (Owner/Admin only) */}
            {isOwnerOrAdmin && (
              <button
                type="button"
                aria-label="Delete project"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty || ignoredLines > 0}
              title={ignoredLines > 0 ? 'Fix the lines without KEY=value first' : undefined}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-xs font-semibold text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Unsaved banner for mobile */}
        {isDirty && (
          <div className="sm:hidden mb-4 p-3 rounded-lg bg-brand/10 border border-brand/20 text-brand text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              You have unsaved changes.
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || ignoredLines > 0}
              className="px-2.5 py-1 bg-brand text-ink font-bold rounded text-xs disabled:opacity-50"
            >
              Save now
            </button>
          </div>
        )}

        {/* Toolbar above variable list */}
        <div className="flex items-center justify-between pb-3 border-b border-paper/10">
          <div className="text-xs font-semibold text-paper/60 uppercase tracking-wider">
            Variables ({variables.length})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={textMode}
              onClick={toggleTextMode}
              className="flex items-center gap-1 text-xs text-paper/60 hover:text-paper transition-colors px-2 py-1 rounded bg-panel border border-paper/10"
              title="Switch between rows and raw text"
            >
              {textMode ? <Rows3 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {textMode ? 'Rows' : 'Text'}
            </button>
            <button
              type="button"
              hidden={textMode && !canMaskText()}
              onClick={textMode ? () => setTextRevealed(!textRevealed) : toggleRevealAll}
              className="flex items-center gap-1 text-xs text-paper/60 hover:text-paper transition-colors px-2 py-1 rounded bg-panel border border-paper/10"
            >
              {(textMode ? textRevealed : revealedIndices.size === variables.length && variables.length > 0) ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide all
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Show all
                </>
              )}
            </button>
          </div>
        </div>

        {/* Raw text box */}
        {textMode && (
          <textarea
            aria-label="Variables as .env text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            spellCheck={false}
            rows={Math.max(10, text.split('\n').length + 1)}
            placeholder="KEY=value"
            style={textRevealed ? undefined : { WebkitTextSecurity: 'disc' }}
            className="mt-4 w-full px-3 py-2 rounded-xl bg-ink border border-paper/10 text-xs font-mono text-paper placeholder-paper/50 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        )}

        {textMode && ignoredLines > 0 && (
          <p role="alert" className="mt-2 text-xs text-brand">
            {ignoredLines} line{ignoredLines === 1 ? ' is' : 's are'} not in KEY=value form and would be dropped. Fix {ignoredLines === 1 ? 'it' : 'them'} to save.
          </p>
        )}

        {/* Variable Rows */}
        {!textMode && <div className="mt-4 space-y-2.5">
          {variables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-paper/10 p-10 text-center">
              <p className="text-sm text-paper/60">No variables yet. Add one, or import a .env file.</p>
              <button
                type="button"
                onClick={handleAddRow}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-xs font-semibold text-ink transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add variable
              </button>
            </div>
          ) : (
            variables.map((v, index) => {
              const isRevealed = revealedIndices.has(index);
              const isCopied = copiedIndex === index;

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-paper/10 bg-panel/40 hover:bg-panel/80 hover:border-paper/20 transition-all group"
                >
                  {/* Key input */}
                  <div className="w-full sm:w-1/3">
                    <input
                      type="text"
                      aria-label={`Variable ${index + 1} name`}
                      placeholder="VARIABLE_NAME"
                      value={v.key}
                      onChange={(e) => handleVariableChange(index, 'key', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-ink border border-paper/10 text-xs font-mono font-medium text-brand placeholder-paper/50 focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  {/* Value input with reveal / copy buttons */}
                  <div className="relative flex-1 flex items-center">
                    <input
                      type={isRevealed ? 'text' : 'password'}
                      aria-label={`${v.key || `Variable ${index + 1}`} value`}
                      autoComplete="off"
                      placeholder="value"
                      value={v.value}
                      onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                      className="w-full pl-3 pr-20 py-2 rounded-lg bg-ink border border-paper/10 text-xs font-mono text-paper placeholder-paper/50 focus:outline-none focus:ring-1 focus:ring-brand"
                    />

                    {/* Inline actions: Reveal & Copy */}
                    <div className="absolute right-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleReveal(index)}
                        aria-label={isRevealed ? 'Hide value' : 'Show value'}
                        title={isRevealed ? 'Hide value' : 'Show value'}
                        className="p-1 rounded text-paper/60 hover:text-paper/80 hover:bg-paper/10 transition-colors"
                      >
                        {isRevealed ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyValue(v.value, index)}
                        aria-label="Copy value"
                        title="Copy value"
                        className="p-1 rounded text-paper/60 hover:text-paper/80 hover:bg-paper/10 transition-colors"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-brand" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remove row button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    aria-label={`Remove ${v.key || `variable ${index + 1}`}`}
                    title="Remove variable"
                    className="p-2 text-paper/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors self-end sm:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>}

        {/* Add Row Button */}
        {!textMode && variables.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-panel border border-paper/10 hover:border-paper/20 text-xs font-semibold text-paper/80 hover:text-paper transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-brand" />
              Add variable
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProjectActivity
          fileId={id}
          owner={file?.owner}
          createdAt={file?.createdAt}
          refreshKey={file?.updatedAt}
        />
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          fileId={id}
          owner={file?.owner}
          initialMembers={file?.members || []}
          onClose={() => setIsShareModalOpen(false)}
          onMembersUpdated={(updated) => {
            setFile((prev) => ({ ...prev, members: updated }));
          }}
        />
      )}
    </div>
  );
}

export default function FileEditorPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <FileEditorContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
