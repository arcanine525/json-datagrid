
import React, { useMemo, useState } from 'react';
import { IconCopy, IconCheck } from './Icons';
import { jsonToTs } from '../utils';

interface SchemaViewProps {
  json: any;
}

const SchemaView: React.FC<SchemaViewProps> = ({ json }) => {
  const [copied, setCopied] = useState(false);
  const tsInterface = useMemo(() => jsonToTs(json), [json]);

  const handleCopy = () => {
    navigator.clipboard.writeText(tsInterface);
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
      <pre>{tsInterface}</pre>
    </div>
  );
};

export default SchemaView;
