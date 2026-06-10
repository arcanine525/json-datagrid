import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { IconCopy, IconCheck } from './Icons';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

interface HeaderRow { key: string; value: string; enabled: boolean; }

interface SavedRequest {
  id: string;
  name: string;
  method: Method;
  url: string;
  headers: HeaderRow[];
  body: string;
}

interface ApiViewProps {
  onSendToEditor: (text: string) => void;
}

/**
 * Postman-lite request runner. Lives entirely client-side: lets the user pick
 * a method/URL/headers/body, fires the request with fetch, and dumps the
 * response into a preview panel — with a one-click "send response to editor".
 */
const ApiView: React.FC<ApiViewProps> = ({ onSendToEditor }) => {
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { key: 'Accept', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<{ status: number; statusText: string; headers: Record<string, string>; body: string; time: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useLocalStorage<SavedRequest[]>('json-datagrid-api-saved-v1', []);
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers');

  const updateHeader = (i: number, patch: Partial<HeaderRow>) => {
    setHeaders(h => h.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  };

  const send = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    const t0 = performance.now();
    try {
      const init: RequestInit = {
        method,
        headers: Object.fromEntries(headers.filter(h => h.enabled && h.key).map(h => [h.key, h.value])),
      };
      if (method !== 'GET' && method !== 'HEAD' && body.trim()) init.body = body;
      const res = await fetch(url, init);
      const text = await res.text();
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });
      setResponse({ status: res.status, statusText: res.statusText, headers: responseHeaders, body: text, time: performance.now() - t0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrent = () => {
    const name = prompt('Name this request:', `${method} ${url}`);
    if (!name) return;
    const id = `r_${Date.now().toString(36)}`;
    setSaved(prev => [...prev, { id, name, method, url, headers, body }]);
  };

  const loadSaved = (r: SavedRequest) => {
    setMethod(r.method); setUrl(r.url); setHeaders(r.headers); setBody(r.body);
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isJsonResponse = (() => {
    if (!response) return false;
    const ct = response.headers['content-type'] || '';
    if (ct.includes('json')) return true;
    try { JSON.parse(response.body); return true; } catch { return false; }
  })();

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        <select value={method} onChange={e => setMethod(e.target.value as Method)} className="px-2 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded text-xs">
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map(m => <option key={m}>{m}</option>)}
        </select>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com/resource"
          className="flex-grow min-w-[200px] px-3 py-2 font-mono text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded"
        />
        <button onClick={send} disabled={loading} className="px-4 py-2 text-xs rounded bg-light-accent dark:bg-dark-accent text-white disabled:opacity-50">
          {loading ? 'Sending…' : 'Send'}
        </button>
        <button onClick={saveCurrent} className="px-3 py-2 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border">
          Save
        </button>
      </div>

      {saved.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-light-text-secondary dark:text-dark-text-secondary">Saved:</span>
          {saved.map(r => (
            <div key={r.id} className="flex items-center gap-1 px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface">
              <button onClick={() => loadSaved(r)} className="hover:underline">{r.name}</button>
              <button
                onClick={() => setSaved(prev => prev.filter(p => p.id !== r.id))}
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"
              >×</button>
            </div>
          ))}
        </div>
      )}

      <div className="border-b border-light-border dark:border-dark-border flex gap-2 text-xs">
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-1.5 border-b-2 ${activeTab === 'headers' ? 'border-light-accent dark:border-dark-accent' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'}`}
        >Headers ({headers.filter(h => h.enabled).length})</button>
        <button
          onClick={() => setActiveTab('body')}
          className={`px-3 py-1.5 border-b-2 ${activeTab === 'body' ? 'border-light-accent dark:border-dark-accent' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'}`}
        >Body</button>
      </div>

      {activeTab === 'headers' && (
        <div className="space-y-1">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={h.enabled} onChange={e => updateHeader(i, { enabled: e.target.checked })} />
              <input
                placeholder="Key"
                value={h.key}
                onChange={e => updateHeader(i, { key: e.target.value })}
                className="w-40 px-2 py-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded"
              />
              <input
                placeholder="Value"
                value={h.value}
                onChange={e => updateHeader(i, { value: e.target.value })}
                className="flex-grow px-2 py-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded"
              />
              <button
                onClick={() => setHeaders(prev => prev.filter((_, idx) => idx !== i))}
                className="px-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"
              >×</button>
            </div>
          ))}
          <button
            onClick={() => setHeaders(h => [...h, { key: '', value: '', enabled: true }])}
            className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border"
          >+ Header</button>
        </div>
      )}

      {activeTab === 'body' && (
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder='{ "key": "value" }'
          className="w-full h-32 p-2 font-mono text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded resize-y"
        />
      )}

      {error && <div className="text-xs text-red-600 dark:text-red-400">Error: {error}</div>}

      {response && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className={`px-2 py-0.5 rounded font-mono ${
              response.status >= 200 && response.status < 300 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
              response.status >= 400 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            }`}>{response.status} {response.statusText}</span>
            <span className="text-light-text-secondary dark:text-dark-text-secondary">{response.time.toFixed(0)} ms · {new Blob([response.body]).size} B</span>
            <div className="ml-auto flex gap-1">
              <button onClick={handleCopy} className="px-2 py-1 rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
                {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4" />} Copy
              </button>
              {isJsonResponse && (
                <button
                  onClick={() => {
                    try { onSendToEditor(JSON.stringify(JSON.parse(response.body), null, 2)); }
                    catch { onSendToEditor(response.body); }
                  }}
                  className="px-2 py-1 rounded bg-light-accent dark:bg-dark-accent text-white"
                >→ Send to editor</button>
              )}
            </div>
          </div>
          <pre className="font-mono text-xs p-3 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-auto max-h-[40vh] whitespace-pre-wrap break-words">
            {response.body}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiView;
