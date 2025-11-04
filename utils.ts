
export const downloadFile = (content: string, fileName: string, mimeType: string) => {
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

// Placeholder for YAML conversion. In a real project, you'd use a library like js-yaml.
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
