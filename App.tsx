
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useJsonProcessor } from './hooks/useJsonProcessor';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import ViewPanel from './components/ViewPanel';
import { Theme } from './types';

const App: React.FC = () => {
  const [rawJson, setRawJson] = useLocalStorage<string>('json-hero-input', '{\n  "example": "paste your json here"\n}');
  const [theme, setTheme] = useLocalStorage<Theme>('json-hero-theme', 'dark');
  const { parsedJson, error, isTableCompatible } = useJsonProcessor(rawJson);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const handleFormat = useCallback(() => {
    try {
      const obj = JSON.parse(rawJson);
      setRawJson(JSON.stringify(obj, null, 2));
    } catch (e) {
      // Ignore format errors if JSON is invalid
    }
  }, [rawJson, setRawJson]);

  const handleMinify = useCallback(() => {
    try {
      const obj = JSON.parse(rawJson);
      setRawJson(JSON.stringify(obj));
    } catch (e) {
      // Ignore minify errors if JSON is invalid
    }
  }, [rawJson, setRawJson]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey) {
        if (event.key === 'f' || event.key === 'F') {
          event.preventDefault();
          handleFormat();
        }
        if (event.key === 'm' || event.key === 'M') {
          event.preventDefault();
          handleMinify();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFormat, handleMinify]);


  return (
    <div className="flex flex-col h-screen font-sans">
      <Header theme={theme} setTheme={setTheme} />
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <InputPanel
          rawJson={rawJson}
          setRawJson={setRawJson}
          error={error}
          onFormat={handleFormat}
          onMinify={handleMinify}
        />
        <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full">
          <ViewPanel parsedJson={parsedJson} error={error} isTableCompatible={isTableCompatible} theme={theme} />
        </div>
      </main>
    </div>
  );
};

export default App;
