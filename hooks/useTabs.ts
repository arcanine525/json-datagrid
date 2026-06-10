import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/** A single editor tab. The textarea content lives in `content`. */
export interface JsonTab {
  id: string;
  name: string;
  content: string;
  pinned?: boolean;
  /** Epoch millis — used to sort History view. */
  updatedAt: number;
}

interface TabsState {
  tabs: JsonTab[];
  activeId: string;
}

const DEFAULT_TAB: JsonTab = {
  id: 't_default',
  name: 'untitled.json',
  content: '{\n  "example": "paste your json here"\n}',
  updatedAt: 0,
};

/**
 * Hook that owns the list of open tabs plus the active id. Each mutation
 * stamps `updatedAt` so the History view can order by recency.
 */
export const useTabs = () => {
  const [state, setState] = useLocalStorage<TabsState>('json-datagrid-tabs-v1', {
    tabs: [DEFAULT_TAB],
    activeId: DEFAULT_TAB.id,
  });

  // Self-heal: never let `tabs` be empty.
  if (state.tabs.length === 0) {
    setState({ tabs: [DEFAULT_TAB], activeId: DEFAULT_TAB.id });
  }

  const active = state.tabs.find(t => t.id === state.activeId) ?? state.tabs[0];

  const setContent = useCallback((content: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t => t.id === prev.activeId
        ? { ...t, content, updatedAt: Date.now() }
        : t),
    }));
  }, [setState]);

  const newTab = useCallback((seed?: Partial<JsonTab>) => {
    const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const tab: JsonTab = {
      id,
      name: seed?.name ?? `untitled-${Math.floor(Math.random() * 10_000)}.json`,
      content: seed?.content ?? '{\n  \n}',
      updatedAt: Date.now(),
    };
    setState(prev => ({ tabs: [...prev.tabs, tab], activeId: id }));
    return id;
  }, [setState]);

  const closeTab = useCallback((id: string) => {
    setState(prev => {
      const remaining = prev.tabs.filter(t => t.id !== id);
      if (remaining.length === 0) return { tabs: [DEFAULT_TAB], activeId: DEFAULT_TAB.id };
      const nextActive = prev.activeId === id ? remaining[remaining.length - 1].id : prev.activeId;
      return { tabs: remaining, activeId: nextActive };
    });
  }, [setState]);

  const activate = useCallback((id: string) => {
    setState(prev => prev.tabs.some(t => t.id === id) ? { ...prev, activeId: id } : prev);
  }, [setState]);

  const renameTab = useCallback((id: string, name: string) => {
    setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === id ? { ...t, name } : t) }));
  }, [setState]);

  const setTabPinned = useCallback((id: string, pinned: boolean) => {
    setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === id ? { ...t, pinned } : t) }));
  }, [setState]);

  return { tabs: state.tabs, active, activeId: state.activeId, setContent, newTab, closeTab, activate, renameTab, setTabPinned };
};
