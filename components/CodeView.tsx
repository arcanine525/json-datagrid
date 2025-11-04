
import React, { useMemo, useState } from 'react';
import { IconCopy, IconCheck } from './Icons';

interface CodeViewProps {
  json: any;
}

const syntaxHighlight = (jsonString: string): string => {
    jsonString = jsonString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'number text-blue-600 dark:text-blue-400';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key text-red-600 dark:text-red-400';
            } else {
                cls = 'string text-green-600 dark:text-green-400';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean text-purple-600 dark:text-purple-400';
        } else if (/null/.test(match)) {
            cls = 'null text-gray-500';
        }
        return `<span class="${cls}">${match}</span>`;
    });
};

const CodeView: React.FC<CodeViewProps> = ({ json }) => {
  const [copied, setCopied] = useState(false);
  const formattedJson = useMemo(() => JSON.stringify(json, null, 2), [json]);
  const highlightedJson = useMemo(() => syntaxHighlight(formattedJson), [formattedJson]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative font-mono text-sm p-4">
      <button
        onClick={handleCopy}
        className="absolute top-4 right-4 p-2 rounded-md bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <IconCheck className="w-5 h-5 text-green-500" /> : <IconCopy className="w-5 h-5" />}
      </button>
      <pre dangerouslySetInnerHTML={{ __html: highlightedJson }} />
    </div>
  );
};

export default CodeView;
