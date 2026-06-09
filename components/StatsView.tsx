import React, { useMemo } from 'react';

interface StatsViewProps {
  json: any;
  rawJson: string;
}

interface JsonStats {
  totalKeys: number;
  maxDepth: number;
  arrays: number;
  maxArrayLen: number;
  objects: number;
  totalSize: number;
  types: { string: number; number: number; boolean: number; null: number; array: number; object: number };
  topKeys: Array<{ key: string; count: number }>;
  duplicateKeyPaths: string[];
}

/**
 * Walks the JSON tree once and accumulates structural statistics.
 * @param data Parsed JSON value.
 * @returns Aggregated stats including type counts, depth, and key frequency.
 */
const computeStats = (data: any): Omit<JsonStats, 'totalSize'> => {
  const types = { string: 0, number: 0, boolean: 0, null: 0, array: 0, object: 0 };
  const keyCounts = new Map<string, number>();
  const duplicateKeyPaths: string[] = [];
  let totalKeys = 0;
  let maxDepth = 0;
  let arrays = 0;
  let objects = 0;
  let maxArrayLen = 0;

  const walk = (val: any, depth: number, path: string) => {
    if (depth > maxDepth) maxDepth = depth;
    if (val === null) {
      types.null++;
      return;
    }
    if (Array.isArray(val)) {
      types.array++;
      arrays++;
      if (val.length > maxArrayLen) maxArrayLen = val.length;
      val.forEach((item, i) => walk(item, depth + 1, `${path}[${i}]`));
      return;
    }
    const t = typeof val;
    if (t === 'object') {
      types.object++;
      objects++;
      const seenInScope = new Set<string>();
      for (const key of Object.keys(val)) {
        totalKeys++;
        keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
        if (seenInScope.has(key)) duplicateKeyPaths.push(`${path}.${key}`);
        seenInScope.add(key);
        walk(val[key], depth + 1, `${path}.${key}`);
      }
      return;
    }
    if (t === 'string') types.string++;
    else if (t === 'number') types.number++;
    else if (t === 'boolean') types.boolean++;
  };

  walk(data, 0, 'root');

  const topKeys = [...keyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }));

  return { totalKeys, maxDepth, arrays, maxArrayLen, objects, types, topKeys, duplicateKeyPaths };
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const TypeBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-light-text-secondary dark:text-dark-text-secondary">{label}</span>
      <div className="flex-grow h-2 bg-light-border dark:bg-dark-border rounded overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 text-right tabular-nums">{pct.toFixed(1)}% ({count})</span>
    </div>
  );
};

/**
 * Renders an overview panel of structural statistics for the parsed JSON:
 * total keys, max depth, type distribution, top keys, and duplicate keys.
 */
const StatsView: React.FC<StatsViewProps> = ({ json, rawJson }) => {
  const stats = useMemo<JsonStats>(() => {
    const base = computeStats(json);
    return { ...base, totalSize: new Blob([rawJson]).size };
  }, [json, rawJson]);

  const totalTypes = (Object.values(stats.types) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 space-y-6 text-sm">
      <section>
        <h3 className="text-xs uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-2">Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded bg-light-surface dark:bg-dark-surface">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Total keys</div>
            <div className="text-lg font-semibold tabular-nums">{stats.totalKeys.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded bg-light-surface dark:bg-dark-surface">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Max depth</div>
            <div className="text-lg font-semibold tabular-nums">{stats.maxDepth}</div>
          </div>
          <div className="p-3 rounded bg-light-surface dark:bg-dark-surface">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Total size</div>
            <div className="text-lg font-semibold tabular-nums">{formatBytes(stats.totalSize)}</div>
          </div>
          <div className="p-3 rounded bg-light-surface dark:bg-dark-surface">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Arrays</div>
            <div className="text-lg font-semibold tabular-nums">{stats.arrays} <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">(max len {stats.maxArrayLen})</span></div>
          </div>
          <div className="p-3 rounded bg-light-surface dark:bg-dark-surface">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Objects</div>
            <div className="text-lg font-semibold tabular-nums">{stats.objects}</div>
          </div>
          <div className="p-3 rounded bg-light-surface dark:bg-dark-surface">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Duplicate keys</div>
            <div className="text-lg font-semibold tabular-nums">{stats.duplicateKeyPaths.length}</div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-2">Type Distribution</h3>
        <div className="space-y-1.5">
          <TypeBar label="string" count={stats.types.string} total={totalTypes} color="bg-green-500" />
          <TypeBar label="number" count={stats.types.number} total={totalTypes} color="bg-blue-500" />
          <TypeBar label="boolean" count={stats.types.boolean} total={totalTypes} color="bg-purple-500" />
          <TypeBar label="null" count={stats.types.null} total={totalTypes} color="bg-gray-500" />
          <TypeBar label="array" count={stats.types.array} total={totalTypes} color="bg-amber-500" />
          <TypeBar label="object" count={stats.types.object} total={totalTypes} color="bg-rose-500" />
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-2">Top Keys</h3>
        {stats.topKeys.length === 0 ? (
          <div className="text-light-text-secondary dark:text-dark-text-secondary text-xs">No object keys found.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {stats.topKeys.map(({ key, count }) => (
              <li key={key} className="flex justify-between text-xs">
                <span className="truncate font-mono">{key}</span>
                <span className="tabular-nums text-light-text-secondary dark:text-dark-text-secondary">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats.duplicateKeyPaths.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-2">Duplicate Key Paths</h3>
          <ul className="space-y-0.5 max-h-32 overflow-auto">
            {stats.duplicateKeyPaths.slice(0, 50).map((p, i) => (
              <li key={i} className="font-mono text-xs text-amber-700 dark:text-amber-400">{p}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default StatsView;
