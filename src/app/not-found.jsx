import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-ink flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-panel border border-paper/10 flex items-center justify-center text-brand mb-6">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-paper tracking-tight">Page not found</h1>
      <p className="text-sm text-paper/60 mt-2 max-w-sm">
        This page or project does not exist, was deleted, or you no longer have access.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-ink text-sm font-semibold transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to projects</span>
      </Link>
    </div>
  );
}
