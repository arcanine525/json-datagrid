import React, { useEffect, useState } from 'react';
import { IconCopy, IconCheck } from './Icons';
import { encodeShare } from '../utils/share';

interface ShareViewProps { rawJson: string; }

const MAX_FRAGMENT = 8000;

/**
 * Builds a self-contained shareable URL by gzipping the current document and
 * encoding it as a URL fragment. Recipients open the URL and the app
 * auto-loads the content into a fresh tab.
 */
const ShareView: React.FC<ShareViewProps> = ({ rawJson }) => {
  const [fragment, setFragment] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    encodeShare(rawJson).then(f => { if (alive) setFragment(f); });
    return () => { alive = false; };
  }, [rawJson]);

  const url = fragment ? `${window.location.origin}${window.location.pathname}#share=${fragment}` : '';
  const tooBig = fragment !== null && fragment.length > MAX_FRAGMENT;
  const originalBytes = new Blob([rawJson]).size;
  const encodedBytes = fragment ? fragment.length : 0;

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 space-y-3 text-sm">
      <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs">
        Encodes the current JSON into a URL fragment with gzip + base64. The recipient opens the link, the app decodes it and loads the document — no server involved.
      </p>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-light-text-secondary dark:text-dark-text-secondary tabular-nums">
          Size: {originalBytes} B → {encodedBytes} B encoded
        </span>
        {tooBig && (
          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            ⚠ Some browsers limit URLs to ~8 KB. This link may not work universally.
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          className="flex-grow px-3 py-2 font-mono text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded"
        />
        <button onClick={handleCopy} disabled={!url} className="px-3 py-2 text-xs rounded bg-light-accent dark:bg-dark-accent text-white disabled:opacity-50 flex items-center gap-1">
          {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />} Copy link
        </button>
      </div>

      <details className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
        <summary className="cursor-pointer">Raw fragment</summary>
        <pre className="mt-2 p-2 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border break-all whitespace-pre-wrap font-mono">
          {fragment ?? '…'}
        </pre>
      </details>
    </div>
  );
};

export default ShareView;
