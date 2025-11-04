
import { useState, useEffect } from 'react';

interface JsonProcessorResult {
  parsedJson: any | null;
  error: string | null;
  isTableCompatible: boolean;
}

export const useJsonProcessor = (rawJson: string): JsonProcessorResult => {
  const [result, setResult] = useState<JsonProcessorResult>({
    parsedJson: null,
    error: null,
    isTableCompatible: false,
  });

  useEffect(() => {
    if (!rawJson.trim()) {
      setResult({ parsedJson: null, error: null, isTableCompatible: false });
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      const isTableCompatible =
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
      
      setResult({ parsedJson: parsed, error: null, isTableCompatible });
    } catch (e: any) {
      // Improved error message parsing
      const message = e.message
        .replace(/at position (\d+)/, (match: string, pos: string) => {
          const position = parseInt(pos, 10);
          let line = 1;
          let column = 1;
          for (let i = 0; i < position; i++) {
            if (rawJson[i] === '\n') {
              line++;
              column = 1;
            } else {
              column++;
            }
          }
          return `on line ${line}, column ${column}`;
        })
        .replace("Unexpected token '", "Unexpected token '...'"); // Sanitize token
      
      setResult({ parsedJson: null, error: `Invalid JSON: ${message}`, isTableCompatible: false });
    }
  }, [rawJson]);

  return result;
};
