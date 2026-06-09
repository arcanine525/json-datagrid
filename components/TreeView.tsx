import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Theme } from '../types';
import { IconChevronRight, IconChevronDown, IconCopy, IconCheck, IconSearch, IconClose } from './Icons';

type Primitive = string | number | boolean | null;

const isObject = (val: any): val is Record<string, any> => typeof val === 'object' && val !== null && !Array.isArray(val);
const isArray = (val: any): val is any[] => Array.isArray(val);
const isPrimitive = (val: any): val is Primitive => val === null || ['string', 'number', 'boolean'].includes(typeof val);

type PathSegment = string | number;
type PathFormat = 'jsonPointer' | 'jsonPath' | 'dot' | 'bracket';

/**
 * Formats an array of key/index segments into one of the supported path notations.
 * @param segments Ordered keys from root to the target node.
 * @param fmt Notation to render. JSON Pointer escapes `~` and `/` per RFC 6901.
 */
const formatPath = (segments: PathSegment[], fmt: PathFormat): string => {
  if (fmt === 'jsonPointer') {
    if (segments.length === 0) return '/';
    return '/' + segments.map(s => String(s).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
  }
  if (fmt === 'jsonPath') {
    return '$' + segments.map(s => typeof s === 'number' ? `[${s}]` : /^[A-Za-z_$][\w$]*$/.test(s) ? `.${s}` : `['${s.replace(/'/g, "\\'")}']`).join('');
  }
  if (fmt === 'dot') {
    return segments.map((s, i) => typeof s === 'number' ? `[${s}]` : i === 0 ? s : `.${s}`).join('');
  }
  // bracket
  return segments.map(s => typeof s === 'number' ? `[${s}]` : `['${s.replace(/'/g, "\\'")}']`).join('') || '[]';
};

/** Coloured one-character type badge for the Tree view. */
const TypeBadge: React.FC<{ value: any }> = ({ value }) => {
  let label: string;
  let cls: string;
  if (value === null) { label = 'null'; cls = 'text-gray-500 bg-gray-100 dark:bg-gray-800'; }
  else if (Array.isArray(value)) { label = 'arr'; cls = 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40'; }
  else {
    const t = typeof value;
    if (t === 'string') { label = 'str'; cls = 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40'; }
    else if (t === 'number') { label = 'num'; cls = 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40'; }
    else if (t === 'boolean') { label = 'bool'; cls = 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/40'; }
    else { label = 'obj'; cls = 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/40'; }
  }
  return <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${cls}`}>{label}</span>;
};

/**
 * Highlights any substring of `text` that matches the active search query.
 * Falls back to plain text rendering if there's no query or no match.
 */
const Highlighted: React.FC<{ text: string; query: string; caseSensitive: boolean; regex: boolean; active?: boolean }> = ({ text, query, caseSensitive, regex, active }) => {
  if (!query) return <>{text}</>;
  let parts: Array<{ text: string; match: boolean }> = [];
  try {
    const re = regex
      ? new RegExp(query, caseSensitive ? 'g' : 'gi')
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push({ text: text.slice(last, m.index), match: false });
      parts.push({ text: m[0] || '', match: true });
      last = m.index + (m[0]?.length || 0);
      if (!m[0]) re.lastIndex++;
    }
    if (last < text.length) parts.push({ text: text.slice(last), match: false });
  } catch {
    return <>{text}</>;
  }
  return (
    <>
      {parts.map((p, i) => p.match ? (
        <mark key={i} className={active
          ? 'bg-amber-300 dark:bg-amber-500 text-black rounded px-0.5'
          : 'bg-yellow-200 dark:bg-yellow-800/60 rounded px-0.5'}>{p.text}</mark>
      ) : <span key={i}>{p.text}</span>)}
    </>
  );
};

const Value: React.FC<{ value: Primitive; query: string; cs: boolean; rx: boolean; activeMatch: boolean }> = ({ value, query, cs, rx, activeMatch }) => {
  if (value === null) return <span className="text-gray-500">null</span>;
  const t = typeof value;
  if (t === 'string') return <span className="text-green-600 dark:text-green-400">"<Highlighted text={String(value)} query={query} caseSensitive={cs} regex={rx} active={activeMatch} />"</span>;
  if (t === 'number') return <span className="text-blue-600 dark:text-blue-400">{value as number}</span>;
  if (t === 'boolean') return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
  return <span>{String(value)}</span>;
};

interface SearchOptions { query: string; caseSensitive: boolean; regex: boolean; inKeys: boolean; inValues: boolean; }

/** Searches the tree once, returning every path that matches under current options. */
const findMatches = (data: any, opts: SearchOptions): string[] => {
  const { query, caseSensitive, regex, inKeys, inValues } = opts;
  if (!query) return [];
  let test: (s: string) => boolean;
  try {
    const re = regex
      ? new RegExp(query, caseSensitive ? '' : 'i')
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? '' : 'i');
    test = (s) => re.test(s);
  } catch {
    return [];
  }
  const matches: string[] = [];
  const walk = (val: any, path: string, key: string | null) => {
    if (key !== null && inKeys && test(key)) matches.push(path);
    if (isPrimitive(val)) {
      if (inValues && test(String(val))) matches.push(path);
      return;
    }
    if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}.${i}`, String(i)));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, `${path}.${k}`, k));
  };
  walk(data, 'root', null);
  // Deduplicate while preserving order
  return [...new Set(matches)];
};

interface TreeNodeProps {
  dataKey: string | number;
  data: any;
  level: number;
  isExpanded: (path: string) => boolean;
  toggleNode: (path: string) => void;
  path: string;
  segments: PathSegment[];
  search: SearchOptions;
  activeMatchPath: string | null;
  onMatchRef: (path: string, el: HTMLElement | null) => void;
  matchSet: Set<string>;
}

const PathMenu: React.FC<{ segments: PathSegment[]; onCopy: (text: string) => void; onClose: () => void }> = ({ segments, onCopy, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  const items: Array<[string, PathFormat]> = [
    ['JSON Pointer', 'jsonPointer'],
    ['JSONPath', 'jsonPath'],
    ['Dot notation', 'dot'],
    ['Bracket', 'bracket'],
  ];
  return (
    <div ref={ref} className="absolute z-20 right-0 mt-1 w-72 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg py-1 text-xs">
      {items.map(([label, fmt]) => {
        const text = formatPath(segments, fmt);
        return (
          <button
            key={fmt}
            onClick={() => { onCopy(text); onClose(); }}
            className="w-full px-3 py-2 text-left hover:bg-light-border/60 dark:hover:bg-dark-border/60 flex justify-between gap-3"
          >
            <span className="text-light-text-secondary dark:text-dark-text-secondary shrink-0">{label}</span>
            <span className="font-mono text-light-text dark:text-dark-text truncate">{text}</span>
          </button>
        );
      })}
    </div>
  );
};

const TreeNode: React.FC<TreeNodeProps> = ({ dataKey, data, level, isExpanded, toggleNode, path, segments, search, activeMatchPath, onMatchRef, matchSet }) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const expanded = isExpanded(path);
  const indent = { paddingLeft: `${level * 1.25}rem` };
  const isMatch = matchSet.has(path);
  const isActiveMatch = activeMatchPath === path;
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isMatch) onMatchRef(path, rowRef.current);
  }, [isMatch, path, onMatchRef]);

  const handleCopyNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = isPrimitive(data) ? JSON.stringify(data) : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyPath = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const length = isArray(data) ? data.length : isObject(data) ? Object.keys(data).length : 0;
  const items = isObject(data) ? Object.entries(data) : isArray(data) ? data.map((v, i) => [i, v] as [number, any]) : [];
  const bracketOpen = isArray(data) ? '[' : '{';
  const bracketClose = isArray(data) ? ']' : '}';

  const rowClass = `relative group flex items-center gap-2 rounded py-0.5 ${
    isActiveMatch ? 'bg-amber-100 dark:bg-amber-900/40' : isMatch ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
  } hover:bg-light-surface/60 dark:hover:bg-dark-surface/60`;

  if (isPrimitive(data)) {
    return (
      <div ref={rowRef} style={indent} className={rowClass}>
        <span className="truncate min-w-0 flex-grow">
          <TypeBadge value={data} />{' '}
          <span className="text-red-600 dark:text-red-400 font-semibold">
            <Highlighted text={String(dataKey)} query={search.inKeys ? search.query : ''} caseSensitive={search.caseSensitive} regex={search.regex} active={isActiveMatch} />:
          </span>{' '}
          <Value value={data} query={search.inValues ? search.query : ''} cs={search.caseSensitive} rx={search.regex} activeMatch={isActiveMatch} />
        </span>
        <div className="relative shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            title="Copy path…"
            className="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"
          >
            <span className="font-mono text-[10px] px-1">↳</span>
          </button>
          <button onClick={handleCopyNode} title="Copy value" className="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border">
            {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />}
          </button>
          {menuOpen && <PathMenu segments={segments} onCopy={handleCopyPath} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={rowRef} style={indent} className={rowClass}>
        <div className="flex items-center gap-1 cursor-pointer min-w-0 flex-grow truncate" onClick={() => toggleNode(path)}>
          {expanded ? <IconChevronDown className="w-4 h-4 shrink-0" /> : <IconChevronRight className="w-4 h-4 shrink-0" />}
          <TypeBadge value={data} />
          <span className="text-red-600 dark:text-red-400 font-semibold">
            <Highlighted text={String(dataKey)} query={search.inKeys ? search.query : ''} caseSensitive={search.caseSensitive} regex={search.regex} active={isActiveMatch} />:
          </span>
          <span className="text-light-text-secondary dark:text-dark-text-secondary truncate">
            {bracketOpen}
            {!expanded && ` ${length} ${isArray(data) ? 'items' : 'keys'} `}
            {!expanded && bracketClose}
            {expanded && isArray(data) && <span className="ml-1 text-xs">[{length}]</span>}
          </span>
        </div>
        <div className="relative shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }} title="Copy path…" className="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border">
            <span className="font-mono text-[10px] px-1">↳</span>
          </button>
          <button onClick={handleCopyNode} title="Copy node" className="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border">
            {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />}
          </button>
          {menuOpen && <PathMenu segments={segments} onCopy={handleCopyPath} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
      {expanded && (
        <div>
          {items.map(([key, value]) => (
            <TreeNode
              key={String(key)}
              dataKey={key as any}
              data={value}
              level={level + 1}
              isExpanded={isExpanded}
              toggleNode={toggleNode}
              path={`${path}.${key}`}
              segments={[...segments, key as PathSegment]}
              search={search}
              activeMatchPath={activeMatchPath}
              onMatchRef={onMatchRef}
              matchSet={matchSet}
            />
          ))}
          <div style={{ paddingLeft: `${level * 1.25}rem` }} className="text-light-text-secondary dark:text-dark-text-secondary">{bracketClose}</div>
        </div>
      )}
    </div>
  );
};

interface TreeViewProps {
  data: any;
  theme: Theme;
}

const TreeView: React.FC<TreeViewProps> = ({ data }) => {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({ root: true });
  const [rootCopied, setRootCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [inKeys, setInKeys] = useState(true);
  const [inValues, setInValues] = useState(true);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const matchRefs = useRef<Map<string, HTMLElement>>(new Map());

  const searchOpts: SearchOptions = { query, caseSensitive, regex, inKeys, inValues };
  const matches = useMemo(() => findMatches(data, searchOpts), [data, query, caseSensitive, regex, inKeys, inValues]);
  const matchSet = useMemo(() => new Set(matches), [matches]);
  const activeMatchPath = matches[activeMatchIdx] ?? null;

  useEffect(() => { setActiveMatchIdx(0); }, [query, caseSensitive, regex, inKeys, inValues]);

  // Auto-expand ancestors of active match
  useEffect(() => {
    if (!activeMatchPath) return;
    const parts = activeMatchPath.split('.');
    const toOpen: Record<string, boolean> = {};
    for (let i = 1; i <= parts.length; i++) toOpen[parts.slice(0, i).join('.')] = true;
    setExpandedPaths(prev => ({ ...prev, ...toOpen }));
  }, [activeMatchPath]);

  // Scroll active match into view
  useEffect(() => {
    if (!activeMatchPath) return;
    requestAnimationFrame(() => {
      matchRefs.current.get(activeMatchPath)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, [activeMatchPath]);

  // Ctrl/Cmd+F opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const toggleNode = useCallback((path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);
  const isExpanded = useCallback((path: string) => !!expandedPaths[path], [expandedPaths]);

  const buildPaths = (val: any, path = 'root', acc: Record<string, boolean> = {}): Record<string, boolean> => {
    if (isPrimitive(val)) return acc;
    acc[path] = true;
    const items = isObject(val) ? Object.entries(val) : isArray(val) ? val.map((v, i) => [i, v] as [number, any]) : [];
    items.forEach(([k, v]) => buildPaths(v, `${path}.${k}`, acc));
    return acc;
  };

  const expandAll = () => setExpandedPaths(buildPaths(data));
  const collapseAll = () => setExpandedPaths({ root: true });
  const expandToDepth = (maxDepth: number) => {
    const acc: Record<string, boolean> = { root: true };
    const walk = (val: any, path: string, depth: number) => {
      if (depth >= maxDepth || isPrimitive(val)) return;
      acc[path] = true;
      const items = isObject(val) ? Object.entries(val) : isArray(val) ? val.map((v, i) => [i, v] as [number, any]) : [];
      items.forEach(([k, v]) => walk(v, `${path}.${k}`, depth + 1));
    };
    walk(data, 'root', 0);
    setExpandedPaths(acc);
  };

  const handleRootCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setRootCopied(true);
    setTimeout(() => setRootCopied(false), 1500);
  };

  const setMatchRef = useCallback((path: string, el: HTMLElement | null) => {
    if (el) matchRefs.current.set(path, el);
    else matchRefs.current.delete(path);
  }, []);

  const goNext = () => matches.length && setActiveMatchIdx(i => (i + 1) % matches.length);
  const goPrev = () => matches.length && setActiveMatchIdx(i => (i - 1 + matches.length) % matches.length);

  const rootItems = isObject(data) ? Object.entries(data) : isArray(data) ? data.map((v, i) => [i, v] as [number, any]) : [];
  const rootBracketOpen = isArray(data) ? '[' : '{';
  const rootBracketClose = isArray(data) ? ']' : '}';

  return (
    <div className="relative font-mono text-sm">
      <div className="sticky top-0 z-10 bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur border-b border-light-border dark:border-dark-border px-4 py-2 flex flex-wrap items-center gap-2">
        <button onClick={expandAll} className="px-2 py-1 text-xs bg-light-surface dark:bg-dark-surface rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors">Expand all</button>
        <button onClick={collapseAll} className="px-2 py-1 text-xs bg-light-surface dark:bg-dark-surface rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors">Collapse all</button>
        <div className="flex items-center gap-1 text-xs text-light-text-secondary dark:text-dark-text-secondary ml-2">
          Depth:
          {[1, 2, 3, 4, 5].map(d => (
            <button key={d} onClick={() => expandToDepth(d)} className="w-6 h-6 rounded hover:bg-light-border dark:hover:bg-dark-border">{d}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={handleRootCopy} title="Copy entire JSON" className="px-2 py-1 text-xs rounded hover:bg-light-surface dark:hover:bg-dark-surface flex items-center gap-1">
            {rootCopied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4" />} Copy
          </button>
          <button onClick={() => setSearchOpen(s => !s)} title="Search (Ctrl/Cmd+F)" className="px-2 py-1 text-xs rounded hover:bg-light-surface dark:hover:bg-dark-surface flex items-center gap-1">
            <IconSearch className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="sticky top-[42px] z-10 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border px-4 py-2 flex flex-wrap items-center gap-2">
          <IconSearch className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search keys / values…"
            className="flex-grow min-w-[160px] px-2 py-1 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"
          />
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary tabular-nums">
            {matches.length === 0 ? '0/0' : `${activeMatchIdx + 1}/${matches.length}`}
          </span>
          <button onClick={goPrev} disabled={matches.length === 0} className="p-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-30">▲</button>
          <button onClick={goNext} disabled={matches.length === 0} className="p-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-30">▼</button>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} /> Aa</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={regex} onChange={e => setRegex(e.target.checked)} /> .*</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={inKeys} onChange={e => setInKeys(e.target.checked)} /> keys</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={inValues} onChange={e => setInValues(e.target.checked)} /> values</label>
          <button onClick={() => { setSearchOpen(false); setQuery(''); }} className="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border" title="Close">
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4">
        {isPrimitive(data) ? (
          <Value value={data} query={query} cs={caseSensitive} rx={regex} activeMatch={false} />
        ) : (
          <div>
            <div className="group flex items-center gap-1">
              <div className="flex items-center gap-1 cursor-pointer flex-grow truncate" onClick={() => toggleNode('root')}>
                {isExpanded('root') ? <IconChevronDown className="w-4 h-4 shrink-0" /> : <IconChevronRight className="w-4 h-4 shrink-0" />}
                <TypeBadge value={data} />
                <span>{rootBracketOpen}{!isExpanded('root') && ` ${rootItems.length} items `}{!isExpanded('root') && rootBracketClose}</span>
              </div>
            </div>
            {isExpanded('root') && rootItems.map(([key, value]) => (
              <TreeNode
                key={String(key)}
                dataKey={key as any}
                data={value}
                level={1}
                isExpanded={isExpanded}
                toggleNode={toggleNode}
                path={`root.${key}`}
                segments={[key as PathSegment]}
                search={searchOpts}
                activeMatchPath={activeMatchPath}
                onMatchRef={setMatchRef}
                matchSet={matchSet}
              />
            ))}
            {isExpanded('root') && <div>{rootBracketClose}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeView;
