import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useJsonProcessor } from './hooks/useJsonProcessor';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import ViewPanel from './components/ViewPanel';
import ShortcutPanel from './components/ShortcutPanel';
import { Theme } from './types';

const App: React.FC = () => {
  const [rawJson, setRawJson] = useLocalStorage<string>('json-hero-input', '{\n  "example": "paste your json here"\n}');
  const [theme, setTheme] = useLocalStorage<Theme>('json-hero-theme', 'dark');
  const { parsedJson, error, isTableCompatible } = useJsonProcessor(rawJson);
  const [minifyStats, setMinifyStats] = useState<{ before: number; after: number } | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const handleFormat = useCallback(() => {
    try {
      const obj = JSON.parse(rawJson);
      setRawJson(JSON.stringify(obj, null, 2));
      setMinifyStats(null);
    } catch {}
  }, [rawJson, setRawJson]);

  const handleMinify = useCallback(() => {
    try {
      const obj = JSON.parse(rawJson);
      const minified = JSON.stringify(obj);
      const before = new Blob([rawJson]).size;
      const after = new Blob([minified]).size;
      setRawJson(minified);
      setMinifyStats({ before, after });
    } catch {}
  }, [rawJson, setRawJson]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey) {
        if (event.key === 'f' || event.key === 'F') {
          event.preventDefault();
          handleFormat();
        } else if (event.key === 'm' || event.key === 'M') {
          event.preventDefault();
          handleMinify();
        }
      }
      // `?` toggles the shortcut help (ignore when typing in inputs)
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
      <Header theme={theme} setTheme={setTheme} onOpenShortcuts={() => setShortcutsOpen(true)} />
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <InputPanel
          rawJson={rawJson}
          setRawJson={setRawJson}
          error={error}
          onFormat={handleFormat}
          onMinify={handleMinify}
          minifyStats={minifyStats}
          onDismissMinify={() => setMinifyStats(null)}
        />
        <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full">
          <ViewPanel
            parsedJson={parsedJson}
            rawJson={rawJson}
            error={error}
            isTableCompatible={isTableCompatible}
            theme={theme}
          />
        </div>
      </main>
      <ShortcutPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

export default App;
