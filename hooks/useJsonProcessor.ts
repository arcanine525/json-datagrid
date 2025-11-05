
import { useState, useEffect } from 'react';

/**
 * Defines the shape of the result from the JSON processor.
 * @property parsedJson - The parsed JSON object, or null if parsing fails.
 * @property error - A descriptive error message if parsing fails, otherwise null.
 * @property isTableCompatible - A boolean indicating if the JSON is an array of objects, suitable for table view.
 */
interface JsonProcessorResult {
  parsedJson: any | null;
  error: string | null;
  isTableCompatible: boolean;
}

/**
 * A custom React hook to process and validate a raw JSON string.
 * It provides the parsed JSON, any parsing errors, and checks for table compatibility.
 * @param rawJson The raw JSON string to be processed.
 * @returns An object containing the parsed JSON, error message, and table compatibility status.
 */
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
