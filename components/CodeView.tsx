
import React, { useMemo, useState } from 'react';
import { IconCopy, IconCheck } from './Icons';

/**
 * Props for the CodeView component.
 * @property json - The JSON object to be displayed and highlighted.
 */
interface CodeViewProps {
  json: any;
}

/**
 * Applies syntax highlighting to a JSON string by wrapping tokens in styled spans.
 * @param jsonString The raw JSON string to highlight.
 * @returns An HTML string with syntax highlighting.
 */
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

/**
 * A component that displays a JSON object with syntax highlighting.
 * It also provides a button to copy the raw JSON to the clipboard.
 * @param {CodeViewProps} props - The props for the component.
 * @returns {JSX.Element} The rendered code view.
 */
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
