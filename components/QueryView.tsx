import React, { useMemo, useState } from 'react';
import { runJsonPath } from '../utils/jsonpath';
import { IconCopy, IconCheck } from './Icons';

interface QueryViewProps {
  json: any;
}

const EXAMPLES = [
  '$.*',
  '$..name',
  '$.users[?(@.age > 18)].name',
  '$.items[0:5]',
];

/**
 * JSONPath playground: lets the user run path expressions against the parsed
 * document, with example chips and a live result count.
 */
const QueryView: React.FC<QueryViewProps> = ({ json }) => {
  const [query, setQuery] = useState('$..*');
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => runJsonPath(json, query), [json, query]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result.matches, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          spellCheck={false}
          placeholder="$.users[?(@.age > 18)].name"
          className="flex-grow font-mono px-3 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"
        />
        <button
          onClick={handleCopy}
          disabled={result.matches.length === 0}
          className="px-3 py-2 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-50 flex items-center gap-1"
        >
          {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4" />} Copy result
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-light-text-secondary dark:text-dark-text-secondary">Examples:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="px-2 py-0.5 rounded font-mono bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-light-text-secondary dark:text-dark-text-secondary">
        <span>Matches: <span className="font-semibold text-light-text dark:text-dark-text tabular-nums">{result.matches.length}</span></span>
        {result.error && <span className="text-amber-600 dark:text-amber-400">{result.error}</span>}
      </div>

      <pre className="font-mono text-xs p-3 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
        {result.matches.length === 0
          ? '(no matches)'
          : JSON.stringify(result.matches, null, 2)}
      </pre>
    </div>
  );
};

export default QueryView;
