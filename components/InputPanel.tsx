import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { repairJson, RepairResult } from '../utils/repair';
import { estimateGzipSize } from '../utils/convert';
import { IconRepair } from './Icons';

/**
 * Props for the InputPanel component.
 * @property rawJson - The raw JSON string input by the user.
 * @property setRawJson - Function to update the raw JSON string.
 * @property error - An error message to display if JSON parsing fails, otherwise null.
 * @property onFormat - Callback function to format the JSON input.
 * @property onMinify - Callback function to minify the JSON input.
 * @property minifyStats - Optional before/after byte counts emitted after a Minify action.
 */
interface InputPanelProps {
  rawJson: string;
  setRawJson: (value: string) => void;
  error: string | null;
  onFormat: () => void;
  onMinify: () => void;
  minifyStats: { before: number; after: number } | null;
  onDismissMinify: () => void;
}

const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`;

/**
 * Banner shown above the JSON textarea when parsing fails AND the JSON Repair
 * heuristics found something fixable. Offers one-click Auto-fix.
 */
const RepairBanner: React.FC<{ result: RepairResult; onApply: () => void; onDismiss: () => void }> = ({ result, onApply, onDismiss }) => (
  <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs">
    <IconRepair className="w-4 h-4 flex-shrink-0" />
    <span className="flex-grow">
      Found {result.issues.length} repairable issue{result.issues.length === 1 ? '' : 's'}:
      <span className="font-mono ml-1 text-[11px]">
        {[...new Set(result.issues.map(i => i.message))].slice(0, 3).join(', ')}
        {result.issues.length > 3 && '…'}
      </span>
    </span>
    <button onClick={onApply} className="px-2 py-1 rounded bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 font-medium">
      Auto-fix
    </button>
    <button onClick={onDismiss} className="px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/60">Dismiss</button>
  </div>
);

const InputPanel: React.FC<InputPanelProps> = ({ rawJson, setRawJson, error, onFormat, onMinify, minifyStats, onDismissMinify }) => {
  const [url, setUrl] = useState('');
  const [fetchStatus, setFetchStatus] = useState<{ message: string; type: 'error' | 'success' | 'loading' } | null>(null);
  const [repairDismissed, setRepairDismissed] = useState(false);
  const [gzipSizes, setGzipSizes] = useState<{ before: number | null; after: number | null }>({ before: null, after: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const repair = useMemo<RepairResult | null>(() => {
    if (!error) return null;
    const r = repairJson(rawJson);
    if (!r.changed) return null;
    try { JSON.parse(r.repaired); return r; } catch { return null; }
  }, [rawJson, error]);

  useEffect(() => { setRepairDismissed(false); }, [error]);

  // Compute gzip sizes when minify stats appear.
  useEffect(() => {
    if (!minifyStats) { setGzipSizes({ before: null, after: null }); return; }
    let alive = true;
    (async () => {
      // Recreate "before" approximation: rawJson is the minified output now,
      // so use minified bytes / parse for original pretty version is impossible;
      // just gzip-size the current (minified) value.
      const after = await estimateGzipSize(rawJson);
      // Estimate "before" gzip as gzip(pretty-printed) for an honest comparison.
      let before: number | null = null;
      try { before = await estimateGzipSize(JSON.stringify(JSON.parse(rawJson), null, 2)); } catch {}
      if (alive) setGzipSizes({ before, after });
    })();
    return () => { alive = false; };
  }, [minifyStats, rawJson]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRawJson(typeof e.target?.result === 'string' ? e.target.result : '');
    reader.readAsText(file);
  };

  const handleDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); }, []);
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      const reader = new FileReader();
      reader.onload = (e) => setRawJson(typeof e.target?.result === 'string' ? e.target.result : '');
      reader.readAsText(file);
    }
  }, [setRawJson]);

  const handleFetchUrl = async () => {
    if (!url) return;
    setFetchStatus({ message: 'Fetching…', type: 'loading' });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setRawJson(JSON.stringify(data, null, 2));
      setFetchStatus({ message: 'Successfully loaded JSON.', type: 'success' });
    } catch (e: any) {
      setFetchStatus({ message: `Failed to fetch: ${e.message}. Check CORS policy.`, type: 'error' });
    }
  };

  const handleAutoFix = () => {
    if (repair) {
      setRawJson(repair.repaired);
      setRepairDismissed(false);
    }
  };

  const showRepair = repair && !repairDismissed;
  const showMinifyStats = minifyStats !== null;

  return (
    <div
      className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full border-r border-light-border dark:border-dark-border"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-2 border-b border-light-border dark:border-dark-border flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/data.json"
            className="flex-grow p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:outline-none"
          />
          <button onClick={handleFetchUrl} className="px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded-md hover:opacity-90 transition-opacity">Fetch</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:opacity-90 transition-opacity">Upload File</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
        {fetchStatus && (
          <p className={`mt-2 text-sm ${fetchStatus.type === 'error' ? 'text-red-500' : fetchStatus.type === 'success' ? 'text-green-500' : 'text-gray-500'}`}>
            {fetchStatus.message}
          </p>
        )}
      </div>

      {showRepair && (
        <RepairBanner
          result={repair!}
          onApply={handleAutoFix}
          onDismiss={() => setRepairDismissed(true)}
        />
      )}

      <div className="flex-grow relative">
        <textarea
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          placeholder="Paste JSON here, drop a .json file, or fetch from a URL"
          spellCheck={false}
          className="w-full h-full p-2 resize-none border-0 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-mono text-sm leading-6"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button onClick={onFormat} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Format</button>
          <button onClick={onMinify} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Minify</button>
        </div>
      </div>

      {showMinifyStats && (
        <div className="flex-shrink-0 p-2 bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border text-xs flex flex-wrap items-center gap-3">
          <span className="text-light-text-secondary dark:text-dark-text-secondary">Minified:</span>
          <span className="tabular-nums">
            {formatBytes(minifyStats!.before)} → <span className="font-semibold">{formatBytes(minifyStats!.after)}</span>
            <span className="ml-1 text-green-600 dark:text-green-400">
              ▼ {Math.max(0, Math.round((1 - minifyStats!.after / Math.max(1, minifyStats!.before)) * 100))}%
            </span>
          </span>
          {gzipSizes.before !== null && gzipSizes.after !== null && (
            <span className="text-light-text-secondary dark:text-dark-text-secondary tabular-nums">
              gzip: {formatBytes(gzipSizes.before)} → {formatBytes(gzipSizes.after)}
            </span>
          )}
          <button onClick={onDismissMinify} className="ml-auto px-2 py-0.5 rounded hover:bg-light-border dark:hover:bg-dark-border">dismiss</button>
        </div>
      )}

      {error && !showRepair && (
        <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900 border-t border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 font-mono text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

export default InputPanel;
