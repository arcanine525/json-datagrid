import React, { useMemo, useState } from 'react';
import { IconCopy, IconCheck, IconDownload } from './Icons';
import { downloadFile } from '../utils';
import { generateJsonSchema } from '../utils/jsonSchema';
import { generateMockData } from '../utils/mock';

interface MockViewProps {
  json: any;
  /** Push generated mock data into the input panel. */
  onSendToEditor: (text: string) => void;
}

/**
 * Generates plausible-looking mock data shaped like the current document.
 * Behind the scenes it derives a JSON Schema from the input, then walks it
 * with a seeded PRNG so the output is reproducible.
 */
const MockView: React.FC<MockViewProps> = ({ json, onSendToEditor }) => {
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState(1);
  const [copied, setCopied] = useState(false);

  const isArray = Array.isArray(json);

  const result = useMemo(() => {
    try {
      const schema = generateJsonSchema(isArray ? json : [json]);
      const mock = generateMockData(schema, count, seed);
      return JSON.stringify(mock, null, 2);
    } catch (e: any) {
      return `// ${e.message}`;
    }
  }, [json, count, seed, isArray]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs">
          Count:
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={e => setCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
            className="w-20 px-2 py-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded"
          />
        </label>
        <label className="flex items-center gap-1 text-xs">
          Seed:
          <input
            type="number"
            value={seed}
            onChange={e => setSeed(Number(e.target.value) || 0)}
            className="w-24 px-2 py-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded"
          />
        </label>
        <button
          onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}
          className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border"
        >
          🎲 Reseed
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={handleCopy} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
            {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4" />} Copy
          </button>
          <button onClick={() => downloadFile(result, 'mock.json', 'application/json')} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
            <IconDownload className="w-4 h-4" /> Download
          </button>
          <button onClick={() => onSendToEditor(result)} className="px-2 py-1 text-xs rounded bg-light-accent dark:bg-dark-accent text-white">
            → Send to editor
          </button>
        </div>
      </div>

      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
        Mock shape is derived from the current document's structure. Field names like <code>email</code>, <code>name</code>, <code>city</code> get realistic values.
      </p>

      <pre className="font-mono text-xs p-3 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
        {result}
      </pre>
    </div>
  );
};

export default MockView;
