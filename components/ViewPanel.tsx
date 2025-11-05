
import React, { useState } from 'react';
import { ViewMode, Theme } from '../types';
import CodeView from './CodeView';
import TreeView from './TreeView';
import TableView from './TableView';
import SchemaView from './SchemaView';
import { downloadFile, jsonToCsv, jsonToYaml } from '../utils';
import { IconCode, IconTree, IconTable, IconDownload } from './Icons';

interface ViewPanelProps {
  parsedJson: any | null;
  error: string | null;
  isTableCompatible: boolean;
  theme: Theme;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ active, onClick, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active
                ? 'border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent'
                : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
);

const ViewPanel: React.FC<ViewPanelProps> = ({ parsedJson, error, isTableCompatible, theme }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('code');

    const handleDownload = (format: 'json' | 'csv' | 'yaml') => {
        if (!parsedJson) return;

        if (format === 'json') {
            const content = JSON.stringify(parsedJson, null, 2);
            downloadFile(content, 'data.json', 'application/json');
        } else if (format === 'csv' && isTableCompatible) {
            const content = jsonToCsv(parsedJson);
            if(content) downloadFile(content, 'data.csv', 'text/csv');
        } else if (format === 'yaml') {
            const content = jsonToYaml(parsedJson);
            downloadFile(content, 'data.yaml', 'application/x-yaml');
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-light-bg dark:bg-dark-bg">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-light-border dark:border-dark-border">
                <div className="flex">
                    <TabButton active={viewMode === 'code'} onClick={() => setViewMode('code')}><IconCode className="w-4 h-4" /> Code</TabButton>
                    <TabButton active={viewMode === 'tree'} onClick={() => setViewMode('tree')}><IconTree className="w-4 h-4" /> Tree</TabButton>
                    <TabButton active={viewMode === 'table'} onClick={() => setViewMode('table')} disabled={!isTableCompatible}><IconTable className="w-4 h-4" /> Table</TabButton>
                    <TabButton active={viewMode === 'schema'} onClick={() => setViewMode('schema')}><IconCode className="w-4 h-4" /> Schema</TabButton>
                </div>
                <div className="p-2 flex gap-2">
                    <button onClick={() => handleDownload('json')} disabled={!parsedJson} className="p-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors" title="Download JSON"><IconDownload className="w-5 h-5"/></button>
                    <button onClick={() => handleDownload('csv')} disabled={!isTableCompatible} className="p-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors" title="Download CSV">CSV</button>
                    <button onClick={() => handleDownload('yaml')} disabled={!parsedJson} className="p-2 disabled:opacity-50 rounded-md hover:bg-light-surface dark:hover:bg-dark-surface transition-colors" title="Download YAML">YAML</button>
                </div>
            </div>
            <div className="flex-grow overflow-auto">
                {error || !parsedJson ? (
                    <div className="p-4 text-light-text-secondary dark:text-dark-text-secondary">
                        {error ? 'Waiting for valid JSON...' : 'Input is empty.'}
                    </div>
                ) : (
                    <>
                        {viewMode === 'code' && <CodeView json={parsedJson} />}
                        {viewMode === 'tree' && <TreeView data={parsedJson} theme={theme} />}
                        {viewMode === 'table' && isTableCompatible && <TableView data={parsedJson} />}
                        {viewMode === 'schema' && <SchemaView json={parsedJson} />}
                    </>
                )}
            </div>
        </div>
    );
};

export default ViewPanel;
