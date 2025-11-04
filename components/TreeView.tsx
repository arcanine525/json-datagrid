import React, { useState, useCallback } from 'react';
import { Theme } from '../types';
import { IconChevronRight, IconChevronDown, IconCopy, IconCheck } from './Icons';

type Primitive = string | number | boolean | null;

const isObject = (val: any): val is Record<string, any> => typeof val === 'object' && val !== null && !Array.isArray(val);
const isArray = (val: any): val is any[] => Array.isArray(val);
const isPrimitive = (val: any): val is Primitive => val === null || ['string', 'number', 'boolean'].includes(typeof val);

const Value: React.FC<{ value: Primitive }> = ({ value }) => {
    const type = typeof value;
    if (value === null) return <span className="text-gray-500">null</span>;
    if (type === 'string') return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    if (type === 'number') return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    if (type === 'boolean') return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
    return <span>{String(value)}</span>;
};

interface TreeNodeProps {
    dataKey: string | number;
    data: any;
    level: number;
    isExpanded: (path: string) => boolean;
    toggleNode: (path: string) => void;
    path: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ dataKey, data, level, isExpanded, toggleNode, path }) => {
    const [copied, setCopied] = useState(false);
    const expanded = isExpanded(path);
    const indent = { paddingLeft: `${level * 1.5}rem` };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const textToCopy = isPrimitive(data)
            ? JSON.stringify(data)
            : JSON.stringify(data, null, 2);

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isPrimitive(data)) {
        return (
            <div style={indent} className="group flex items-center justify-between space-x-2">
                <span className="truncate">
                    <span className="text-red-600 dark:text-red-400 font-semibold">{dataKey}:</span>{' '}
                    <Value value={data} />
                </span>
                <button
                    onClick={handleCopy}
                    title="Copy value"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-light-border dark:hover:bg-dark-border flex-shrink-0"
                >
                    {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />}
                </button>
            </div>
        );
    }

    const items = isObject(data) ? Object.entries(data) : isArray(data) ? data.map((_, i) => [i, _]) : [];
    const bracketOpen = isArray(data) ? '[' : '{';
    const bracketClose = isArray(data) ? ']' : '}';
    const length = items.length;

    return (
        <div>
            <div style={indent} className="group flex items-center justify-between space-x-1">
                 <div className="flex items-center space-x-1 cursor-pointer flex-grow truncate" onClick={() => toggleNode(path)}>
                    {expanded ? <IconChevronDown className="w-4 h-4 flex-shrink-0"/> : <IconChevronRight className="w-4 h-4 flex-shrink-0"/>}
                    <span className="text-red-600 dark:text-red-400 font-semibold">{dataKey}:</span>
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">{bracketOpen}{!expanded && `...${length} items...`}{!expanded && bracketClose}</span>
                </div>
                <button
                    onClick={handleCopy}
                    title="Copy node"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-light-border dark:hover:bg-dark-border flex-shrink-0"
                >
                    {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />}
                </button>
            </div>
            {expanded && (
                <div>
                    {items.map(([key, value]) => (
                        <TreeNode 
                            key={key} 
                            dataKey={key} 
                            data={value} 
                            level={level + 1}
                            isExpanded={isExpanded}
                            toggleNode={toggleNode}
                            path={`${path}.${key}`}
                        />
                    ))}
                    <div style={{ paddingLeft: `${level * 1.5}rem` }}>{bracketClose}</div>
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

    const toggleNode = useCallback((path: string) => {
        setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
    }, []);
    
    const isExpanded = useCallback((path: string) => !!expandedPaths[path], [expandedPaths]);

    const buildPaths = (data: any, path = '', allPaths: Record<string, boolean> = {}) => {
        if (isPrimitive(data)) return;
        allPaths[path] = true;
        const items = isObject(data) ? Object.entries(data) : isArray(data) ? data.map((_, i) => [i, _]) : [];
        items.forEach(([key, value]) => buildPaths(value, `${path}.${key}`, allPaths));
        return allPaths;
    };

    const expandAll = () => {
        const allPaths = buildPaths(data, 'root');
        setExpandedPaths(allPaths || {});
    };

    const collapseAll = () => {
        setExpandedPaths({ root: true });
    };
    
    const handleRootCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const textToCopy = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(textToCopy);
        setRootCopied(true);
        setTimeout(() => setRootCopied(false), 2000);
    };

    const rootItems = isObject(data) ? Object.entries(data) : isArray(data) ? data.map((_, i) => [i, _]) : [];
    const rootBracketOpen = isArray(data) ? '[' : '{';
    const rootBracketClose = isArray(data) ? ']' : '}';

    return (
        <div className="p-4 font-mono text-sm">
            <div className="mb-4 flex gap-2">
                <button onClick={expandAll} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Expand All</button>
                <button onClick={collapseAll} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Collapse All</button>
            </div>
            {isPrimitive(data) ? <Value value={data} /> : (
                <div>
                     <div className="group flex items-center justify-between space-x-1">
                        <div className="flex items-center space-x-1 cursor-pointer flex-grow truncate" onClick={() => toggleNode('root')}>
                             {isExpanded('root') ? <IconChevronDown className="w-4 h-4 flex-shrink-0"/> : <IconChevronRight className="w-4 h-4 flex-shrink-0"/>}
                             <span>{rootBracketOpen}{!isExpanded('root') && `...${rootItems.length} items...`}{!isExpanded('root') && rootBracketClose}</span>
                        </div>
                        <button
                            onClick={handleRootCopy}
                            title="Copy JSON"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-light-border dark:hover:bg-dark-border flex-shrink-0"
                        >
                            {rootCopied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />}
                        </button>
                    </div>
                     {isExpanded('root') && rootItems.map(([key, value]) => (
                        <TreeNode 
                            key={key} 
                            dataKey={key} 
                            data={value} 
                            level={1} 
                            isExpanded={isExpanded}
                            toggleNode={toggleNode}
                            path={`root.${key}`}
                        />
                    ))}
                    {isExpanded('root') && <div>{rootBracketClose}</div>}
                </div>
            )}
        </div>
    );
};

export default TreeView;