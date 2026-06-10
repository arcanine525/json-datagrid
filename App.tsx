import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useJsonProcessor } from './hooks/useJsonProcessor';
import { useTabs } from './hooks/useTabs';
import Header from './components/Header';
import TabBar from './components/TabBar';
import InputPanel from './components/InputPanel';
import ViewPanel from './components/ViewPanel';
import ShortcutPanel from './components/ShortcutPanel';
import Splitter from './components/Splitter';
import { Theme } from './types';
import { Locale } from './i18n';
import { decodeShare } from './utils/share';

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('json-hero-theme', 'dark');
  const [locale, setLocale] = useLocalStorage<Locale>('json-datagrid-locale', 'en');
  const { tabs, active, activeId, setContent, newTab, closeTab, activate, renameTab, setTabPinned } = useTabs();
  const rawJson = active.content;

  const { parsedJson, error, isTableCompatible } = useJsonProcessor(rawJson);
  const [minifyStats, setMinifyStats] = useState<{ before: number; after: number } | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Resizable split between editor (left/top) and view (right/bottom).
  // `splitRatio` is the fraction occupied by the editor panel.
  const [splitRatio, setSplitRatio] = useLocalStorage<number>('json-datagrid-split', 0.5);
  const mainRef = useRef<HTMLElement>(null);
  // Tailwind's md breakpoint is 768px; layout below it stacks vertically.
  const [isWide, setIsWide] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const update = () => setIsWide(mql.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  const editorFlex = `${splitRatio} 1 0`;
  const viewFlex = `${1 - splitRatio} 1 0`;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  // Auto-load a shared document from the URL fragment on first mount.
  useEffect(() => {
    const m = window.location.hash.match(/^#share=(.+)$/);
    if (!m) return;
    let alive = true;
    decodeShare(m[1]).then(text => {
      if (!alive || !text) return;
      const id = newTab({ name: 'shared.json', content: text });
      activate(id);
      // Clear the fragment so refresh doesn't re-import.
      history.replaceState(null, '', window.location.pathname);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormat = useCallback(() => {
    try {
      const obj = JSON.parse(rawJson);
      setContent(JSON.stringify(obj, null, 2));
      setMinifyStats(null);
    } catch {}
  }, [rawJson, setContent]);

  const handleMinify = useCallback(() => {
    try {
      const obj = JSON.parse(rawJson);
      const minified = JSON.stringify(obj);
      const before = new Blob([rawJson]).size;
      const after = new Blob([minified]).size;
      setContent(minified);
      setMinifyStats({ before, after });
    } catch {}
  }, [rawJson, setContent]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey) {
        if (event.key === 'f' || event.key === 'F') { event.preventDefault(); handleFormat(); }
        else if (event.key === 'm' || event.key === 'M') { event.preventDefault(); handleMinify(); }
      }
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !target?.isContentEditable) {
          event.preventDefault();
          setShortcutsOpen(s => !s);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat, handleMinify]);

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header
        theme={theme} setTheme={setTheme}
        locale={locale} setLocale={setLocale}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <TabBar
        tabs={tabs}
        activeId={activeId}
        onActivate={activate}
        onClose={closeTab}
        onNew={() => newTab()}
      />
      <main ref={mainRef} className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className="flex flex-col w-full md:h-full min-h-0 min-w-0" style={{ flex: editorFlex }}>
          <InputPanel
            rawJson={rawJson}
            setRawJson={setContent}
            error={error}
            onFormat={handleFormat}
            onMinify={handleMinify}
            minifyStats={minifyStats}
            onDismissMinify={() => setMinifyStats(null)}
          />
        </div>
        <Splitter
          ratio={splitRatio}
          onChange={setSplitRatio}
          vertical={!isWide}
          containerRef={mainRef}
        />
        <div className="flex flex-col w-full md:h-full min-h-0 min-w-0" style={{ flex: viewFlex }}>
          <ViewPanel
            parsedJson={parsedJson}
            rawJson={rawJson}
            error={error}
            isTableCompatible={isTableCompatible}
            theme={theme}
            locale={locale}
            tabs={tabs}
            activeTabId={activeId}
            onActivateTab={activate}
            onRenameTab={renameTab}
            onTogglePinTab={setTabPinned}
            onDeleteTab={closeTab}
            onNewTab={seed => newTab(seed)}
            onSendToEditor={(text) => setContent(text)}
          />
        </div>
      </main>
      <ShortcutPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

export default App;
