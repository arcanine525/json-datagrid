import React, { useMemo, useState } from 'react';

interface DiffViewProps {
  sourceJson: any;
}

type DiffEntry = { path: string; kind: 'added' | 'removed' | 'changed'; left?: any; right?: any };

/**
 * Recursive structural diff. Walks two JSON values in parallel and reports each
 * leaf or object slot as added / removed / changed. Order-insensitive for
 * arrays of the same length is intentionally NOT supported — arrays are
 * compared positionally.
 */
const computeDiff = (a: any, b: any, path = '$'): DiffEntry[] => {
  if (a === b) return [];
  const out: DiffEntry[] = [];
  const isObjA = a && typeof a === 'object';
  const isObjB = b && typeof b === 'object';
  if (!isObjA || !isObjB || Array.isArray(a) !== Array.isArray(b)) {
    out.push({ path, kind: 'changed', left: a, right: b });
    return out;
  }
  if (Array.isArray(a)) {
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (i >= a.length) out.push({ path: `${path}[${i}]`, kind: 'added', right: b[i] });
      else if (i >= b.length) out.push({ path: `${path}[${i}]`, kind: 'removed', left: a[i] });
      else out.push(...computeDiff(a[i], b[i], `${path}[${i}]`));
    }
    return out;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const childPath = `${path}.${k}`;
    if (!(k in a)) out.push({ path: childPath, kind: 'added', right: b[k] });
    else if (!(k in b)) out.push({ path: childPath, kind: 'removed', left: a[k] });
    else out.push(...computeDiff(a[k], b[k], childPath));
  }
  return out;
};

const summary = (val: any) => {
  const s = JSON.stringify(val);
  if (s === undefined) return 'undefined';
  return s.length > 80 ? s.slice(0, 77) + '…' : s;
};

const DiffView: React.FC<DiffViewProps> = ({ sourceJson }) => {
  const [rawTarget, setRawTarget] = useState('');
  const target = useMemo(() => {
    if (!rawTarget.trim()) return { value: null, error: null as string | null };
    try { return { value: JSON.parse(rawTarget), error: null }; }
    catch (e: any) { return { value: null, error: e.message as string }; }
  }, [rawTarget]);

  const diff = useMemo(() => {
    if (sourceJson === null || target.value === null) return [];
    return computeDiff(sourceJson, target.value);
  }, [sourceJson, target.value]);

  const counts = useMemo(() => {
    return diff.reduce((acc, d) => { acc[d.kind]++; return acc; }, { added: 0, removed: 0, changed: 0 });
  }, [diff]);

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Target JSON</h3>
        <textarea
          value={rawTarget}
          onChange={e => setRawTarget(e.target.value)}
          spellCheck={false}
          placeholder='Paste the JSON to compare against the source…'
          className="w-full h-64 p-2 font-mono text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded resize-y focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"
        />
        {target.error && <p className="text-xs text-red-600 dark:text-red-400">{target.error}</p>}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Differences</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">+ {counts.added} added</span>
          <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">− {counts.removed} removed</span>
          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">~ {counts.changed} changed</span>
        </div>
        <div className="border border-light-border dark:border-dark-border rounded max-h-[60vh] overflow-auto font-mono text-xs">
          {!rawTarget.trim() && <div className="p-3 text-light-text-secondary dark:text-dark-text-secondary">Paste a JSON document to see the diff.</div>}
          {diff.length === 0 && rawTarget.trim() && !target.error && <div className="p-3 text-green-700 dark:text-green-400">Documents are identical.</div>}
          {diff.map((d, i) => (
            <div key={i} className={
              `px-3 py-1.5 border-b border-light-border/60 dark:border-dark-border/60 ${
                d.kind === 'added' ? 'bg-green-50 dark:bg-green-900/20' :
                d.kind === 'removed' ? 'bg-red-50 dark:bg-red-900/20' :
                'bg-amber-50 dark:bg-amber-900/20'
              }`
            }>
              <div className="flex items-center justify-between gap-2">
                <span className="text-light-text-secondary dark:text-dark-text-secondary truncate">{d.path}</span>
                <span className={
                  d.kind === 'added' ? 'text-green-700 dark:text-green-400' :
                  d.kind === 'removed' ? 'text-red-700 dark:text-red-400' :
                  'text-amber-700 dark:text-amber-400'
                }>{d.kind === 'added' ? '+' : d.kind === 'removed' ? '−' : '~'}</span>
              </div>
              {d.kind === 'changed' && (
                <div className="mt-0.5 text-[11px]">
                  <span className="text-red-700 dark:text-red-400">− {summary(d.left)}</span>{'  '}
                  <span className="text-green-700 dark:text-green-400">+ {summary(d.right)}</span>
                </div>
              )}
              {d.kind === 'added' && <div className="mt-0.5 text-[11px] text-green-700 dark:text-green-400">+ {summary(d.right)}</div>}
              {d.kind === 'removed' && <div className="mt-0.5 text-[11px] text-red-700 dark:text-red-400">− {summary(d.left)}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiffView;
