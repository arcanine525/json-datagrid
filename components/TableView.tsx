import React, { useState, useMemo, useEffect } from 'react';
import { IconArrowUp, IconArrowDown, IconDownload } from './Icons';
import { downloadFile, jsonToCsv } from '../utils';
import { buildXlsx } from '../utils/xlsx';

interface TableViewProps { data: any[]; }

interface SortKey { key: string; direction: 'asc' | 'desc'; }

const PAGE_SIZES = [25, 50, 100, 250, 1000];

/**
 * Enhanced Table view. On top of the original sortable/filterable grid, this
 * version supports column hide/show, multi-column sort (shift-click headers),
 * paginated rendering, and CSV/XLSX export of the filtered view.
 */
const TableView: React.FC<TableViewProps> = ({ data }) => {
  const [filter, setFilter] = useState('');
  const [sortKeys, setSortKeys] = useState<SortKey[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [colMenuOpen, setColMenuOpen] = useState(false);

  const headers = useMemo(() => {
    const set = new Set<string>();
    data.forEach(row => Object.keys(row || {}).forEach(k => set.add(k)));
    return Array.from(set);
  }, [data]);

  const visibleHeaders = useMemo(() => headers.filter(h => !hidden.has(h)), [headers, hidden]);

  const filtered = useMemo(() => {
    if (!filter) return data;
    const q = filter.toLowerCase();
    return data.filter(row => Object.values(row || {}).some(v => String(v).toLowerCase().includes(q)));
  }, [data, filter]);

  const sorted = useMemo(() => {
    if (sortKeys.length === 0) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      for (const sk of sortKeys) {
        const av = a?.[sk.key], bv = b?.[sk.key];
        if (av === bv) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av < bv ? -1 : 1;
        return sk.direction === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
    return copy;
  }, [filtered, sortKeys]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page >= totalPages) setPage(0); }, [totalPages, page]);
  const pageRows = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const onHeaderClick = (key: string, e: React.MouseEvent) => {
    const append = e.shiftKey;
    setSortKeys(prev => {
      const existing = prev.find(s => s.key === key);
      if (!append) {
        if (existing && existing.direction === 'asc') return [{ key, direction: 'desc' }];
        if (existing) return [];
        return [{ key, direction: 'asc' }];
      }
      if (!existing) return [...prev, { key, direction: 'asc' }];
      return prev
        .map(s => s.key === key ? { ...s, direction: s.direction === 'asc' ? 'desc' as const : 'asc' as const } : s);
    });
  };

  const toggleColumn = (key: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const exportCsv = () => {
    const rows = sorted.map(r => Object.fromEntries(visibleHeaders.map(h => [h, r?.[h]])));
    const csv = jsonToCsv(rows);
    if (csv) downloadFile(csv, 'table.csv', 'text/csv');
  };

  const exportXlsx = () => {
    try {
      const rows = sorted.map(r => Object.fromEntries(visibleHeaders.map(h => [h, r?.[h]])));
      const bytes = buildXlsx(rows);
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'table.xlsx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Filter rows…"
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          className="px-2 py-1 text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent w-48"
        />
        <div className="relative">
          <button onClick={() => setColMenuOpen(o => !o)} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border">
            ⚙ Columns ({visibleHeaders.length}/{headers.length})
          </button>
          {colMenuOpen && (
            <div className="absolute z-10 mt-1 left-0 w-56 max-h-72 overflow-auto bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded shadow-lg p-2 text-xs">
              {headers.map(h => (
                <label key={h} className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={!hidden.has(h)} onChange={() => toggleColumn(h)} />
                  <span className="truncate">{h}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <label className="text-xs flex items-center gap-1">
          Page size:
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }} className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded px-1 py-0.5">
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={exportCsv} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
            <IconDownload className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={exportXlsx} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
            <IconDownload className="w-3.5 h-3.5" /> XLSX
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-light-border dark:border-dark-border rounded">
        <table className="min-w-full divide-y divide-light-border dark:divide-dark-border text-xs">
          <thead className="bg-light-surface dark:bg-dark-surface">
            <tr>
              {visibleHeaders.map(key => {
                const sk = sortKeys.find(s => s.key === key);
                const order = sortKeys.findIndex(s => s.key === key);
                return (
                  <th
                    key={key}
                    onClick={e => onHeaderClick(key, e)}
                    title="Click to sort. Shift-click for multi-sort."
                    className="px-4 py-2 text-left font-medium uppercase tracking-wider cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {key}
                      {sk && (sk.direction === 'asc' ? <IconArrowUp className="w-3 h-3" /> : <IconArrowDown className="w-3 h-3" />)}
                      {sk && sortKeys.length > 1 && <span className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary">{order + 1}</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-light-bg dark:bg-dark-bg divide-y divide-light-border dark:divide-dark-border">
            {pageRows.map((row, i) => (
              <tr key={i} className="hover:bg-light-surface dark:hover:bg-dark-surface">
                {visibleHeaders.map(h => (
                  <td key={h} className="px-4 py-2 whitespace-nowrap">
                    {typeof row?.[h] === 'object' && row?.[h] !== null ? JSON.stringify(row[h]) : String(row?.[h] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary tabular-nums">
        <span>Showing {sorted.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(0)} disabled={page === 0} className="px-2 py-0.5 rounded hover:bg-light-surface dark:hover:bg-dark-surface disabled:opacity-30">⟨⟨</button>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-0.5 rounded hover:bg-light-surface dark:hover:bg-dark-surface disabled:opacity-30">◀</button>
          <span>Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-2 py-0.5 rounded hover:bg-light-surface dark:hover:bg-dark-surface disabled:opacity-30">▶</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-2 py-0.5 rounded hover:bg-light-surface dark:hover:bg-dark-surface disabled:opacity-30">⟩⟩</button>
        </div>
      </div>
    </div>
  );
};

export default TableView;
