'use client';

import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import Modal from './Modal';
import { UserPlus, Trash2, Mail, Shield, User } from 'lucide-react';

const ShareModal = ({ fileId, owner, initialMembers = [], onClose, onMembersUpdated }) => {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const toast = useToast();

  // Suggest existing users as the owner types (debounced, ignores stale responses)
  useEffect(() => {
    const q = email.trim();
    if (!q) return setSuggestions([]);
    let stale = false;
    const t = setTimeout(() => {
      api.get('/api/auth/users/search', { params: { q } })
        .then((res) => !stale && setSuggestions(res.data))
        .catch(() => !stale && setSuggestions([]));
    }, 200);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [email]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/api/files/${fileId}/members`, {
        email: email.trim().toLowerCase()
      });
      setMembers(res.data.members);
      setEmail('');
      toast.success(res.data.message || 'Member added');
      onMembersUpdated?.(res.data.members);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add this person. Check the email and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingId(userId);
    try {
      const res = await api.delete(`/api/files/${fileId}/members/${userId}`);
      setMembers(res.data.members);
      toast.success('Access removed');
      onMembersUpdated?.(res.data.members);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove access. Try again.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Modal title="Share project" onClose={onClose} maxWidth="max-w-lg">
      <p className="text-sm text-paper/60 -mt-1">
        People you add can view and edit variables. They cannot delete or share the project.
      </p>

      <form onSubmit={handleAddMember} className="mt-5">
        <label htmlFor="share-email" className="block text-sm font-medium text-paper/80 mb-2">
          Add person by email
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-paper/60" />
            <input
              id="share-email"
              type="email"
              list="share-email-suggestions"
              autoComplete="off"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink border border-paper/20 text-sm text-paper placeholder-paper/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
            />
            <datalist id="share-email-suggestions">
              {suggestions.map((u) => (
                <option key={u._id} value={u.email}>{u.name}</option>
              ))}
            </datalist>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      <h3 className="mt-6 mb-3 text-sm font-medium text-paper/80">People with access</h3>
      <ul className="divide-y divide-paper/10 border border-paper/10 rounded-lg overflow-hidden bg-ink/50 max-h-60 overflow-y-auto">
        <li className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-paper truncate">
                {owner?.name || 'Owner'} <span className="text-xs text-paper/60 font-normal">(owner)</span>
              </p>
              <p className="text-xs text-paper/60 truncate">{owner?.email}</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 shrink-0">
            Full access
          </span>
        </li>

        {members.length === 0 ? (
          <li className="p-4 text-center text-sm text-paper/60">
            Nobody else has access yet. Only the owner and administrators can open this project.
          </li>
        ) : (
          members.map((member) => (
            <li key={member._id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-paper/10 flex items-center justify-center text-paper/80 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-paper truncate">{member.name}</p>
                  <p className="text-xs text-paper/60 truncate">{member.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveMember(member._id)}
                disabled={removingId === member._id}
                aria-label={`Remove access for ${member.email}`}
                title="Remove access"
                className="p-1.5 text-paper/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-paper/10 hover:bg-paper/20 text-sm font-medium text-paper transition-colors"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default ShareModal;
