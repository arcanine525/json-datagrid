import React, { useState } from 'react';
import { ViewMode, Theme } from '../types';
import { Locale, t } from '../i18n';
import CodeView from './CodeView';
import TreeView from './TreeView';
import TableView from './TableView';
import SchemaView from './SchemaView';
import StatsView from './StatsView';
import QueryView from './QueryView';
import DiffView from './DiffView';
import ConvertView from './ConvertView';
import MockView from './MockView';
import ApiView from './ApiView';
import ShareView from './ShareView';
import HistoryView from './HistoryView';
import { downloadFile, jsonToCsv, jsonToYaml } from '../utils';
import { JsonTab } from '../hooks/useTabs';
import { IconCode, IconTree, IconTable, IconDownload, IconStats, IconSearch } from './Icons';

interface ViewPanelProps {
  parsedJson: any | null;
  rawJson: string;
  error: string | null;
  isTableCompatible: boolean;
  theme: Theme;
  locale: Locale;
  tabs: JsonTab[];
  activeTabId: string;
  onActivateTab: (id: string) => void;
  onRenameTab: (id: string, name: string) => void;
  onTogglePinTab: (id: string, pinned: boolean) => void;
  onDeleteTab: (id: string) => void;
  onNewTab: (seed?: { content?: string }) => void;
  onSendToEditor: (text: string) => void;
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

const ViewPanel: React.FC<ViewPanelProps> = ({
  parsedJson, rawJson, error, isTableCompatible, theme, locale,
  tabs, activeTabId, onActivateTab, onRenameTab, onTogglePinTab, onDeleteTab, onNewTab,
  onSendToEditor,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('code');

  const handleDownload = (format: 'json' | 'csv' | 'yaml') => {
    if (!parsedJson) return;
    if (format === 'json') downloadFile(JSON.stringify(parsedJson, null, 2), 'data.json', 'application/json');
    else if (format === 'csv' && isTableCompatible) {
      const c = jsonToCsv(parsedJson);
      if (c) downloadFile(c, 'data.csv', 'text/csv');
    } else if (format === 'yaml') downloadFile(jsonToYaml(parsedJson), 'data.yaml', 'application/x-yaml');
  };

  const dataDependent = viewMode === 'code' || viewMode === 'tree' || viewMode === 'table' ||
    viewMode === 'schema' || viewMode === 'stats' || viewMode === 'query' || viewMode === 'diff' ||
    viewMode === 'convert' || viewMode === 'mock' || viewMode === 'share';

  return (
    <div className="flex flex-col w-full h-full bg-light-bg dark:bg-dark-bg">
      <div className="flex-shrink-0 flex items-center justify-between border-b border-light-border dark:border-dark-border overflow-x-auto">
        <div className="flex">
          <TabButton active={viewMode === 'code'} onClick={() => setViewMode('code')}><IconCode className="w-4 h-4" /> {t('tab_code', locale)}</TabButton>
          <TabButton active={viewMode === 'tree'} onClick={() => setViewMode('tree')}><IconTree className="w-4 h-4" /> {t('tab_tree', locale)}</TabButton>
          <TabButton active={viewMode === 'table'} onClick={() => setViewMode('table')} disabled={!isTableCompatible}><IconTable className="w-4 h-4" /> {t('tab_table', locale)}</TabButton>
          <TabButton active={viewMode === 'schema'} onClick={() => setViewMode('schema')}><IconCode className="w-4 h-4" /> {t('tab_schema', locale)}</TabButton>
          <TabButton active={viewMode === 'stats'} onClick={() => setViewMode('stats')}><IconStats className="w-4 h-4" /> {t('tab_stats', locale)}</TabButton>
          <TabButton active={viewMode === 'query'} onClick={() => setViewMode('query')}><IconSearch className="w-4 h-4" /> {t('tab_query', locale)}</TabButton>
          <TabButton active={viewMode === 'diff'} onClick={() => setViewMode('diff')}>{t('tab_diff', locale)}</TabButton>
          <TabButton active={viewMode === 'convert'} onClick={() => setViewMode('convert')}>{t('tab_convert', locale)}</TabButton>
          <TabButton active={viewMode === 'mock'} onClick={() => setViewMode('mock')}>{t('tab_mock', locale)}</TabButton>
          <TabButton active={viewMode === 'api'} onClick={() => setViewMode('api')}>{t('tab_api', locale)}</TabButton>
          <TabButton active={viewMode === 'share'} onClick={() => setViewMode('share')}>{t('tab_share', locale)}</TabButton>
          <TabButton active={viewMode === 'history'} onClick={() => setViewMode('history')}>{t('tab_history', locale)}</TabButton>
        </div>
        <div className="p-2 flex gap-1 flex-shrink-0">
          <button onClick={() => handleDownload('json')} disabled={!parsedJson} className="p-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors" title="Download JSON"><IconDownload className="w-5 h-5" /></button>
          <button onClick={() => handleDownload('csv')} disabled={!isTableCompatible} className="px-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors text-xs" title="Download CSV">CSV</button>
          <button onClick={() => handleDownload('yaml')} disabled={!parsedJson} className="px-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors text-xs" title="Download YAML">YAML</button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {viewMode === 'api' && <ApiView onSendToEditor={onSendToEditor} />}
        {viewMode === 'history' && (
          <HistoryView
            tabs={tabs}
            activeId={activeTabId}
            onOpen={onActivateTab}
            onRename={onRenameTab}
            onTogglePin={onTogglePinTab}
            onDelete={onDeleteTab}
            onNew={() => onNewTab()}
          />
        )}
        {dataDependent && (error || !parsedJson) ? (
          <div className="p-4 text-light-text-secondary dark:text-dark-text-secondary">
            {error ? t('waiting_valid_json', locale) : t('input_empty', locale)}
          </div>
        ) : dataDependent ? (
          <>
            {viewMode === 'code' && <CodeView json={parsedJson} />}
            {viewMode === 'tree' && <TreeView data={parsedJson} theme={theme} />}
            {viewMode === 'table' && isTableCompatible && <TableView data={parsedJson} />}
            {viewMode === 'schema' && <SchemaView json={parsedJson} />}
            {viewMode === 'stats' && <StatsView json={parsedJson} rawJson={rawJson} />}
            {viewMode === 'query' && <QueryView json={parsedJson} />}
            {viewMode === 'diff' && <DiffView sourceJson={parsedJson} />}
            {viewMode === 'convert' && <ConvertView json={parsedJson} rawJson={rawJson} />}
            {viewMode === 'mock' && <MockView json={parsedJson} onSendToEditor={onSendToEditor} />}
            {viewMode === 'share' && <ShareView rawJson={rawJson} />}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ViewPanel;
