import JsonToTS from "json-to-ts";
import { generateSchema as generateSchemaIt } from 'json-schema-it';

export const jsonToTs = (jsonObject: any): string => {
  try {
    const interfaces = JsonToTS(jsonObject, { rootName: 'Root' });
    return interfaces.join('\n\n');
  } catch (error) {
    if (error instanceof Error) {
      return `Error converting JSON to TypeScript: ${error.message}`;
    }
    return 'An unknown error occurred during conversion.';
  }
};

/**
 * Triggers a browser download for a given string content.
 * @param content The content of the file to be downloaded.
 * @param fileName The name of the file.
 * @param mimeType The MIME type of the file.
 */
export const downloadFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Converts an array of JSON objects into a CSV string.
 * This function assumes the input is an array of flat objects.
 * @param jsonArray An array of JSON objects.
 * @returns The CSV string, or null if the input is invalid.
 */
export const jsonToCsv = (jsonArray: any[]): string | null => {
  if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
    return null;
  }
  
  const headers = Object.keys(jsonArray[0]);
  const csvRows = [headers.join(',')];

  for (const row of jsonArray) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Converts a JSON object into a YAML string.
 * Note: This is a basic, placeholder implementation for demonstration purposes.
 * For a robust, real-world application, a dedicated library like 'js-yaml' is recommended.
 * @param jsonObject The JSON object to convert.
 * @returns The resulting YAML string.
 */
export const jsonToYaml = (jsonObject: any): string => {
  const toYamlString = (data: any, indent = 0): string => {
    let yamlString = '';
    const indentation = '  '.repeat(indent);

    if (data === null) {
      return 'null';
    }
    if (typeof data === 'string') {
        if (data.includes(': ') || data.includes('\n')) {
             return `|-\n${indentation}  ${data.replace(/\n/g, `\n${indentation}  `)}`;
        }
      return data;
    }
    if (typeof data !== 'object') {
      return String(data);
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      data.forEach(item => {
        yamlString += `${indentation}- ${toYamlString(item, indent + 1)}\n`;
      });
      return `\n${yamlString.trimEnd()}`;
    } else {
      if (Object.keys(data).length === 0) return '{}';
      Object.keys(data).forEach(key => {
        const value = data[key];
        const formattedValue = toYamlString(value, indent + 1);
        if (typeof value === 'object' && value !== null) {
          yamlString += `${indentation}${key}:\n${formattedValue}`;
        } else {
          yamlString += `${indentation}${key}: ${formattedValue}\n`;
        }
      });
      return `\n${yamlString.trimEnd()}`;
    }
  };
  return toYamlString(jsonObject).trimStart();
};

/**
 * Generates a JSON schema from a given JSON object.
 *
 * @param {any} json - The JSON object to generate the schema from.
 * @returns {object} The generated JSON schema.
 */
export const generateSchema = (json: any): object => {
  return generateSchemaIt(json);
};
