import React, { useState } from 'react';
import { JsonTab } from '../hooks/useTabs';

interface HistoryViewProps {
  tabs: JsonTab[];
  activeId: string;
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const formatBytes = (n: number) => n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
const formatRel = (ts: number) => {
  if (!ts) return '—';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/**
 * Lists every open tab (recent docs), with rename / pin / delete affordances.
 * Pinned tabs float to the top, the rest are sorted by `updatedAt`.
 */
const HistoryView: React.FC<HistoryViewProps> = ({ tabs, activeId, onOpen, onRename, onTogglePin, onDelete, onNew }) => {
  const [search, setSearch] = useState('');
  const filtered = tabs
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  const totalBytes = tabs.reduce((acc, t) => acc + new Blob([t.content]).size, 0);

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search history…"
          className="flex-grow px-3 py-2 text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded"
        />
        <button onClick={onNew} className="px-3 py-2 text-xs rounded bg-light-accent dark:bg-dark-accent text-white">+ New</button>
      </div>

      <ul className="border border-light-border dark:border-dark-border rounded divide-y divide-light-border dark:divide-dark-border">
        {filtered.length === 0 && (
          <li className="p-4 text-xs text-light-text-secondary dark:text-dark-text-secondary">No documents match.</li>
        )}
        {filtered.map(t => (
          <li key={t.id} className={`p-3 flex items-center gap-3 text-xs ${t.id === activeId ? 'bg-light-surface dark:bg-dark-surface' : ''}`}>
            <button
              onClick={() => onTogglePin(t.id, !t.pinned)}
              title={t.pinned ? 'Unpin' : 'Pin'}
              className="text-amber-500 hover:scale-110 transition-transform"
            >{t.pinned ? '★' : '☆'}</button>
            <div className="flex-grow min-w-0">
              <input
                value={t.name}
                onChange={e => onRename(t.id, e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none focus:bg-light-bg dark:focus:bg-dark-bg rounded px-1 -mx-1 font-medium truncate"
              />
              <div className="text-light-text-secondary dark:text-dark-text-secondary mt-0.5 tabular-nums">
                {formatBytes(new Blob([t.content]).size)} · edited {formatRel(t.updatedAt)}
              </div>
            </div>
            <button onClick={() => onOpen(t.id)} className="px-2 py-1 rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border">Open</button>
            <button onClick={() => onDelete(t.id)} className="px-2 py-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-right tabular-nums">
        Total: {tabs.length} document{tabs.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
      </p>
    </div>
  );
};

export default HistoryView;
