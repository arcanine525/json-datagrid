import React, { useMemo, useState } from 'react';
import { IconCopy, IconCheck, IconDownload } from './Icons';
import { jsonToTs, downloadFile } from '../utils';
import { generateJsonSchema, validateJson, ValidationError } from '../utils/jsonSchema';
import { generateCode, CodegenLang } from '../utils/codegen';

interface SchemaViewProps { json: any; }

type Mode =
  | { kind: 'ts' }
  | { kind: 'jsonschema' }
  | { kind: 'validate' }
  | { kind: 'code'; lang: CodegenLang };

const LANG_LABELS: Array<{ id: CodegenLang; label: string; ext: string }> = [
  { id: 'zod', label: 'Zod', ext: 'ts' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'python', label: 'Python', ext: 'py' },
];

/**
 * Schema & code-generation playground. Picks a target on the left rail and
 * renders the generated code on the right. Includes a JSON Schema validator
 * that pipes the user's pasted schema through the home-grown validator.
 */
const SchemaView: React.FC<SchemaViewProps> = ({ json }) => {
  const [mode, setMode] = useState<Mode>({ kind: 'ts' });
  const [copied, setCopied] = useState(false);
  const [validateSchema, setValidateSchema] = useState('');

  const output = useMemo(() => {
    if (mode.kind === 'ts') return { text: jsonToTs(json), ext: 'ts', mime: 'text/x-typescript' };
    if (mode.kind === 'jsonschema') return { text: JSON.stringify(generateJsonSchema(json), null, 2), ext: 'schema.json', mime: 'application/schema+json' };
    if (mode.kind === 'code') {
      const meta = LANG_LABELS.find(l => l.id === mode.lang)!;
      return { text: generateCode(json, mode.lang), ext: meta.ext, mime: 'text/plain' };
    }
    return { text: '', ext: 'txt', mime: 'text/plain' };
  }, [mode, json]);

  const validation = useMemo<{ errors: ValidationError[]; parseError: string | null } | null>(() => {
    if (mode.kind !== 'validate') return null;
    if (!validateSchema.trim()) return { errors: [], parseError: null };
    try {
      const schema = JSON.parse(validateSchema);
      return { errors: validateJson(json, schema), parseError: null };
    } catch (e: any) {
      return { errors: [], parseError: e.message };
    }
  }, [mode, json, validateSchema]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => downloadFile(output.text, `data.${output.ext}`, output.mime);

  const Btn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-2 py-1 text-xs rounded transition-colors text-left ${
      active ? 'bg-light-accent dark:bg-dark-accent text-white' : 'bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border'
    }`}>{children}</button>
  );

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 text-sm">
      <aside className="flex flex-row md:flex-col gap-1 overflow-x-auto">
        <Btn active={mode.kind === 'ts'} onClick={() => setMode({ kind: 'ts' })}>TypeScript</Btn>
        <Btn active={mode.kind === 'jsonschema'} onClick={() => setMode({ kind: 'jsonschema' })}>JSON Schema</Btn>
        <Btn active={mode.kind === 'validate'} onClick={() => setMode({ kind: 'validate' })}>Validate</Btn>
        <div className="hidden md:block mt-2 text-[10px] uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Code</div>
        {LANG_LABELS.map(l => (
          <Btn key={l.id} active={mode.kind === 'code' && mode.lang === l.id} onClick={() => setMode({ kind: 'code', lang: l.id })}>{l.label}</Btn>
        ))}
      </aside>

      <div className="min-w-0">
        {mode.kind === 'validate' ? (
          <div className="space-y-3">
            <textarea
              value={validateSchema}
              onChange={e => setValidateSchema(e.target.value)}
              spellCheck={false}
              placeholder='Paste JSON Schema here to validate the current document against it…'
              className="w-full h-48 p-2 font-mono text-xs bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded resize-y focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"
            />
            {validation?.parseError && <p className="text-xs text-red-600 dark:text-red-400">{validation.parseError}</p>}
            {validation && validation.parseError === null && validateSchema.trim() !== '' && (
              <div className="text-xs">
                {validation.errors.length === 0
                  ? <span className="text-green-700 dark:text-green-400">✅ Valid against schema.</span>
                  : <span className="text-red-700 dark:text-red-400">❌ {validation.errors.length} error{validation.errors.length === 1 ? '' : 's'}</span>}
                <ul className="mt-2 space-y-0.5 font-mono">
                  {validation.errors.slice(0, 100).map((e, i) => (
                    <li key={i} className="text-light-text-secondary dark:text-dark-text-secondary">
                      <span className="text-light-text dark:text-dark-text">{e.path}</span>: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {mode.kind === 'ts' ? 'TypeScript interface' :
                 mode.kind === 'jsonschema' ? 'JSON Schema (draft 2020-12)' :
                 `Code: ${LANG_LABELS.find(l => l.id === (mode as any).lang)?.label}`}
              </span>
              <div className="ml-auto flex gap-1">
                <button onClick={handleCopy} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
                  {copied ? <IconCheck className="w-4 h-4 text-green-500" /> : <IconCopy className="w-4 h-4" />} Copy
                </button>
                <button onClick={handleDownload} className="px-2 py-1 text-xs rounded bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border flex items-center gap-1">
                  <IconDownload className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
            <pre className="font-mono text-xs p-3 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
              {output.text}
            </pre>
          </>
        )}
      </div>
    </div>
  );
};

export default SchemaView;
