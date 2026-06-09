import React, { useState } from 'react';
import { ViewMode, Theme } from '../types';
import CodeView from './CodeView';
import TreeView from './TreeView';
import TableView from './TableView';
import SchemaView from './SchemaView';
import StatsView from './StatsView';
import QueryView from './QueryView';
import DiffView from './DiffView';
import ConvertView from './ConvertView';
import { downloadFile, jsonToCsv, jsonToYaml } from '../utils';
import { IconCode, IconTree, IconTable, IconDownload, IconStats, IconSearch } from './Icons';

interface ViewPanelProps {
  parsedJson: any | null;
  rawJson: string;
  error: string | null;
  isTableCompatible: boolean;
  theme: Theme;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; title?: string }> = ({ active, onClick, children, disabled, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? 'border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent'
        : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

/**
 * The right-hand panel: tabs over a parsed JSON document. Hosts every "view"
 * feature (Code, Tree, Table, Schema, Stats, Query, Diff, Convert) and the
 * download actions that operate on the current document.
 */
const ViewPanel: React.FC<ViewPanelProps> = ({ parsedJson, rawJson, error, isTableCompatible, theme }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('code');

  const handleDownload = (format: 'json' | 'csv' | 'yaml') => {
    if (!parsedJson) return;
    if (format === 'json') downloadFile(JSON.stringify(parsedJson, null, 2), 'data.json', 'application/json');
    else if (format === 'csv' && isTableCompatible) {
      const c = jsonToCsv(parsedJson);
      if (c) downloadFile(c, 'data.csv', 'text/csv');
    } else if (format === 'yaml') downloadFile(jsonToYaml(parsedJson), 'data.yaml', 'application/x-yaml');
  };

  return (
    <div className="flex flex-col w-full h-full bg-light-bg dark:bg-dark-bg">
      <div className="flex-shrink-0 flex items-center justify-between border-b border-light-border dark:border-dark-border overflow-x-auto">
        <div className="flex">
          <TabButton active={viewMode === 'code'} onClick={() => setViewMode('code')}><IconCode className="w-4 h-4" /> Code</TabButton>
          <TabButton active={viewMode === 'tree'} onClick={() => setViewMode('tree')}><IconTree className="w-4 h-4" /> Tree</TabButton>
          <TabButton active={viewMode === 'table'} onClick={() => setViewMode('table')} disabled={!isTableCompatible}><IconTable className="w-4 h-4" /> Table</TabButton>
          <TabButton active={viewMode === 'schema'} onClick={() => setViewMode('schema')}><IconCode className="w-4 h-4" /> Schema</TabButton>
          <TabButton active={viewMode === 'stats'} onClick={() => setViewMode('stats')}><IconStats className="w-4 h-4" /> Stats</TabButton>
          <TabButton active={viewMode === 'query'} onClick={() => setViewMode('query')}><IconSearch className="w-4 h-4" /> Query</TabButton>
          <TabButton active={viewMode === 'diff'} onClick={() => setViewMode('diff')}>Diff</TabButton>
          <TabButton active={viewMode === 'convert'} onClick={() => setViewMode('convert')}>Convert</TabButton>
        </div>
        <div className="p-2 flex gap-1 flex-shrink-0">
          <button onClick={() => handleDownload('json')} disabled={!parsedJson} className="p-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors" title="Download JSON"><IconDownload className="w-5 h-5" /></button>
          <button onClick={() => handleDownload('csv')} disabled={!isTableCompatible} className="px-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors text-xs" title="Download CSV">CSV</button>
          <button onClick={() => handleDownload('yaml')} disabled={!parsedJson} className="px-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors text-xs" title="Download YAML">YAML</button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {error || !parsedJson ? (
          <div className="p-4 text-light-text-secondary dark:text-dark-text-secondary">
            {error ? 'Waiting for valid JSON…' : 'Input is empty.'}
          </div>
        ) : (
          <>
            {viewMode === 'code' && <CodeView json={parsedJson} />}
            {viewMode === 'tree' && <TreeView data={parsedJson} theme={theme} />}
            {viewMode === 'table' && isTableCompatible && <TableView data={parsedJson} />}
            {viewMode === 'schema' && <SchemaView json={parsedJson} />}
            {viewMode === 'stats' && <StatsView json={parsedJson} rawJson={rawJson} />}
            {viewMode === 'query' && <QueryView json={parsedJson} />}
            {viewMode === 'diff' && <DiffView sourceJson={parsedJson} />}
            {viewMode === 'convert' && <ConvertView json={parsedJson} rawJson={rawJson} />}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewPanel;
