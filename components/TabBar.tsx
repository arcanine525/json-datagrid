import React from 'react';
import { JsonTab } from '../hooks/useTabs';
import { IconClose } from './Icons';

interface TabBarProps {
  tabs: JsonTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

/** Horizontal tab strip sitting above the input panel. */
const TabBar: React.FC<TabBarProps> = ({ tabs, activeId, onActivate, onClose, onNew }) => (
  <div className="flex items-stretch border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-x-auto">
    {tabs.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs border-r border-light-border dark:border-dark-border whitespace-nowrap cursor-pointer ${
          t.id === activeId
            ? 'bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text font-medium'
            : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg/60 dark:hover:bg-dark-bg/60'
        }`}
        onClick={() => onActivate(t.id)}
      >
        {t.pinned && <span className="text-amber-500">★</span>}
        <span className="truncate max-w-[160px]">{t.name}</span>
        <button
          onClick={e => { e.stopPropagation(); onClose(t.id); }}
          aria-label={`Close ${t.name}`}
          className="p-0.5 rounded hover:bg-light-border dark:hover:bg-dark-border"
        >
          <IconClose className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
    <button
      onClick={onNew}
      aria-label="New tab"
      className="px-3 py-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg/60 dark:hover:bg-dark-bg/60"
    >
      +
    </button>
  </div>
);

export default TabBar;
