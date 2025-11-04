
import React, { useState, useCallback, useRef } from 'react';

interface InputPanelProps {
  rawJson: string;
  setRawJson: (value: string) => void;
  error: string | null;
  onFormat: () => void;
  onMinify: () => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ rawJson, setRawJson, error, onFormat, onMinify }) => {
  const [url, setUrl] = useState('');
  const [fetchStatus, setFetchStatus] = useState<{ message: string; type: 'error' | 'success' | 'loading' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        setRawJson(typeof text === 'string' ? text : '');
      };
      reader.readAsText(file);
    }
  };
  
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        setRawJson(typeof text === 'string' ? text : '');
      };
      reader.readAsText(file);
    }
  }, [setRawJson]);

  const handleFetchUrl = async () => {
    if (!url) return;
    setFetchStatus({ message: 'Fetching...', type: 'loading' });
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRawJson(JSON.stringify(data, null, 2));
      setFetchStatus({ message: 'Successfully fetched and loaded JSON.', type: 'success' });
    } catch (e: any) {
      console.error(e);
      setFetchStatus({ message: `Failed to fetch from URL: ${e.message}. Check CORS policy.`, type: 'error' });
    }
  };

  return (
    <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full border-r border-light-border dark:border-dark-border" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="p-2 border-b border-light-border dark:border-dark-border flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/data.json"
                className="flex-grow p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:outline-none"
            />
            <button onClick={handleFetchUrl} className="px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded-md hover:opacity-90 transition-opacity">Fetch</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:opacity-90 transition-opacity">Upload File</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
        {fetchStatus && (
            <p className={`mt-2 text-sm ${fetchStatus.type === 'error' ? 'text-red-500' : fetchStatus.type === 'success' ? 'text-green-500' : 'text-gray-500'}`}>
                {fetchStatus.message}
            </p>
        )}
      </div>

      <div className="flex-grow relative">
        <textarea
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          placeholder="Paste JSON here, drop a .json file, or fetch from a URL"
          spellCheck="false"
          className="w-full h-full p-2 resize-none border-0 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-mono text-sm leading-6"
        />
        <div className="absolute top-2 right-2 flex gap-2">
            <button onClick={onFormat} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Format</button>
            <button onClick={onMinify} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Minify</button>
        </div>
      </div>
      
      {error && (
        <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900 border-t border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 font-mono text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

export default InputPanel;
