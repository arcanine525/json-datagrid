import React, { useMemo, useState } from 'react';
import { jsonToYaml, jsonToCsv, downloadFile } from '../utils';
import { jsonToXml, xmlToJson, yamlToJson, jsonToToml, jsonToMarkdownTable, jsonToHtmlTable, jsonToSqlInserts } from '../utils/convert';
import { IconCopy, IconCheck, IconDownload } from './Icons';

type Format = 'json' | 'yaml' | 'xml' | 'csv' | 'toml' | 'markdown' | 'html' | 'sql';

interface ConvertViewProps { json: any; rawJson: string; }

const FORMATS: { id: Format; label: string; mime: string; ext: string }[] = [
  { id: 'json', label: 'JSON', mime: 'application/json', ext: 'json' },
  { id: 'yaml', label: 'YAML', mime: 'application/x-yaml', ext: 'yaml' },
  { id: 'xml', label: 'XML', mime: 'application/xml', ext: 'xml' },
  { id: 'csv', label: 'CSV', mime: 'text/csv', ext: 'csv' },
  { id: 'toml', label: 'TOML', mime: 'application/toml', ext: 'toml' },
  { id: 'markdown', label: 'Markdown', mime: 'text/markdown', ext: 'md' },
  { id: 'html', label: 'HTML', mime: 'text/html', ext: 'html' },
  { id: 'sql', label: 'SQL', mime: 'text/plain', ext: 'sql' },
];

const TABLE_FORMATS = new Set<Format>(['csv', 'markdown', 'html', 'sql']);

/**
 * Renders the current JSON in any of the supported output formats. Designed as
 * a one-way (JSON ➞ X) playground; full bidirectional editing lives in the
 * input pane.
 */
const ConvertView: React.FC<ConvertViewProps> = ({ json, rawJson }) => {
  const [target, setTarget] = useState<Format>('yaml');
  const [copied, setCopied] = useState(false);

  const isTableShape = useMemo(
    () => Array.isArray(json) && json.length > 0 && json.every(v => v && typeof v === 'object' && !Array.isArray(v)),
    [json]
  );

  const output = useMemo<{ text: string; warn?: string }>(() => {
    if (!json && json !== 0 && json !== false && json !== '') return { text: '' };
    switch (target) {
      case 'json':
        return { text: JSON.stringify(json, null, 2) };
      case 'yaml':
        return { text: jsonToYaml(json) };
      case 'xml':
        return { text: jsonToXml(json) };
      case 'csv': {
        if (!isTableShape) return { text: '', warn: 'CSV needs an array of flat objects.' };
        return { text: jsonToCsv(json) ?? '' };
      }
      case 'toml':
        return { text: jsonToToml(json) };
      case 'markdown': {
        if (!isTableShape) return { text: '', warn: 'Markdown table needs an array of objects.' };
        return { text: jsonToMarkdownTable(json) ?? '' };
      }
      case 'html': {
        if (!isTableShape) return { text: '', warn: 'HTML table needs an array of objects.' };
        return { text: jsonToHtmlTable(json) ?? '' };
      }
      case 'sql': {
        if (!isTableShape) return { text: '', warn: 'SQL INSERTs need an array of objects.' };
        return { text: jsonToSqlInserts(json) ?? '' };
      }
    }
  }, [json, target, isTableShape]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const meta = FORMATS.find(f => f.id === target)!;
    downloadFile(output.text, `data.${meta.ext}`, meta.mime);
  };

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Convert JSON to</span>
        {FORMATS.filter(f => f.id !== 'json').map(f => (
          <button
            key={f.id}
            onClick={() => setTarget(f.id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              target === f.id
                ? 'bg-light-accent dark:bg-dark-accent text-white'
                : 'bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border'
            } ${TABLE_FORMATS.has(f.id) && !isTableShape ? 'opacity-60' : ''}`}
            title={TABLE_FORMATS.has(f.id) && !isTableShape ? 'Requires array of flat objects' : undefined}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={handleCopy} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
            {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4" />} Copy
          </button>
          <button onClick={handleDownload} disabled={!output.text} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-40 flex items-center gap-1">
            <IconDownload className="w-4 h-4" /> Download
          </button>
        </div>
      </div>

      {output.warn && <p className="text-xs text-amber-600 dark:text-amber-400">{output.warn}</p>}

      <pre className="font-mono text-xs p-3 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
        {output.text || '(empty)'}
      </pre>

      <details className="text-xs">
        <summary className="cursor-pointer text-light-text-secondary dark:text-dark-text-secondary">Reverse: import YAML/XML into the editor</summary>
        <ReverseImport />
      </details>
    </div>
  );
};

const ReverseImport: React.FC = () => {
  const [raw, setRaw] = useState('');
  const [from, setFrom] = useState<'yaml' | 'xml'>('yaml');
  const [out, setOut] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const convert = () => {
    try {
      const parsed = from === 'yaml' ? yamlToJson(raw) : xmlToJson(raw);
      setOut(JSON.stringify(parsed, null, 2));
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2 items-center">
        <select value={from} onChange={e => setFrom(e.target.value as any)} className="text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded px-2 py-1">
          <option value="yaml">YAML</option>
          <option value="xml">XML</option>
        </select>
        <button onClick={convert} className="px-2 py-1 text-xs rounded bg-light-accent dark:bg-dark-accent text-white">Convert to JSON</button>
      </div>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder={`Paste ${from.toUpperCase()} here…`} className="w-full h-32 p-2 font-mono text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded resize-y" />
      {err && <p className="text-red-600 dark:text-red-400">{err}</p>}
      {out && <pre className="p-2 font-mono text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded max-h-48 overflow-auto whitespace-pre-wrap">{out}</pre>}
    </div>
  );
};

export default ConvertView;
