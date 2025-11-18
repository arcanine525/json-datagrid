
import React from 'react';
import { Editor } from '@monaco-editor/react';

interface SchemaViewProps {
  schema: object;
  theme: 'light' | 'dark';
}

/**
 * A component to display the generated JSON schema in a read-only editor.
 * It uses the Monaco Editor for syntax highlighting and a clean presentation.
 * @param {SchemaViewProps} props - The component props.
 * @param {object} props.schema - The JSON schema object to display.
 * @param {'light' | 'dark'} props.theme - The current theme for the editor.
 * @returns {JSX.Element} The rendered schema view component.
 */
const SchemaView: React.FC<SchemaViewProps> = ({ schema, theme }) => {
  const schemaString = JSON.stringify(schema, null, 2);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language="json"
        value={schemaString}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default SchemaView;
