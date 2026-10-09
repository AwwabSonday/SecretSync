'use client';

import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadError from './LoadError';
import { History } from 'lucide-react';

const LABELS = {
  'file.create': 'Created the project',
  'file.update': 'Edited',
  'member.add': 'Shared with',
  'member.remove': 'Removed access for'
};

// Who created the project and who changed it. Variable names only, never values.
const ProjectActivity = ({ fileId, owner, createdAt, refreshKey }) => {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stale = false;
    setError(false);
    api
      .get(`/api/files/${fileId}/activity`)
      .then((res) => !stale && setLogs(res.data))
      .catch(() => !stale && setError(true));
    return () => {
      stale = true;
    };
  }, [fileId, refreshKey]);

  return (
    <section aria-labelledby="activity-heading" className="mt-10 pt-6 border-t border-paper/10">
      <h2 id="activity-heading" className="flex items-center gap-2 text-sm font-semibold text-paper">
        <History className="w-4 h-4 text-paper/60" />
        Activity
      </h2>
      <p className="text-sm text-paper/60 mt-1">
        Created by <span className="text-paper">{owner?.name || owner?.email}</span>
        {owner?.name && <span> ({owner.email})</span>}
        {createdAt && <> on {new Date(createdAt).toLocaleDateString()}</>}
      </p>

      {error ? (
        <p className="mt-4 text-sm text-paper/60">Could not load the activity history.</p>
      ) : logs === null ? (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading activity">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-panel/60 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-paper/60">No recorded changes yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-paper/10 rounded-xl border border-paper/10 bg-panel/30">
          {logs.map((l) => (
            <li key={l._id} className="px-4 py-2.5 text-sm flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
              <span className="text-xs text-paper/60 tabular-nums sm:w-40 shrink-0">
                {new Date(l.createdAt).toLocaleString()}
              </span>
              <span className="text-paper min-w-0">
                <span className="font-medium">{l.actorEmail}</span>{' '}
                <span className="text-paper/60">{LABELS[l.action] || l.action}</span>
                {l.details && l.action !== 'file.create' && (
                  <span className="font-mono text-xs text-paper/80 break-words"> {l.details}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ProjectActivity;
