'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useUnsavedRef } from '../context/UnsavedContext';
import { KeyRound, Shield, LogOut, Users, FolderLock, ScrollText, UserCog } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const dirtyRef = useUnsavedRef();

  if (!user) return null;

  // Client-side navigation does not fire `beforeunload`, so ask here when the editor has unsaved edits.
  const guarded = (action) => async (e) => {
    e?.preventDefault();
    if (dirtyRef.current) {
      const leave = await confirm({
        title: 'Discard unsaved changes?',
        message: 'You have edits in this project that have not been saved. Leaving now will discard them.',
        confirmLabel: 'Discard and leave'
      });
      if (!leave) return;
      dirtyRef.current = false;
    }
    action();
  };

  const navLink = (href, Icon, label) => (
    <Link
      href={href}
      onClick={guarded(() => router.push(href))}
      aria-current={pathname === href ? 'page' : undefined}
      aria-label={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        pathname === href
          ? 'bg-paper/10 text-paper'
          : 'text-paper/60 hover:text-paper hover:bg-panel'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-paper/10 bg-ink/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            href="/dashboard"
            onClick={guarded(() => router.push('/dashboard'))}
            aria-label="Env Master home"
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand group-hover:border-brand/60 transition-colors">
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline font-bold text-lg tracking-tight text-paper group-hover:text-brand transition-colors">
              Env<span className="text-brand">Master</span>
            </span>
          </Link>

          <nav aria-label="Main" className="flex items-center gap-1">
            {navLink('/dashboard', FolderLock, 'Projects')}
            {isAdmin && navLink('/admin/users', Users, 'Users')}
            {isAdmin && navLink('/admin/audit', ScrollText, 'Audit logs')}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/account"
            onClick={guarded(() => router.push('/account'))}
            aria-label="Account and password"
            title="Account and password"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              pathname === '/account'
                ? 'bg-paper/10 border-paper/20 text-paper'
                : 'bg-panel border-paper/10 text-paper/80 hover:border-paper/20'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span className="hidden lg:inline max-w-[10rem] truncate">{user.name}</span>
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                isAdmin
                  ? 'bg-brand/10 text-brand border border-brand/20'
                  : 'bg-brand/10 text-brand border border-brand/20'
              }`}
            >
              {isAdmin && <Shield className="w-3 h-3" />}
              {user.role}
            </span>
          </Link>

          <button
            type="button"
            onClick={guarded(logout)}
            aria-label="Log out"
            title="Log out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-paper/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
