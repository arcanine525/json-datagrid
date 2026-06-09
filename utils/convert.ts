/**
 * Dependency-free converters between JSON and common interchange formats.
 * These are intentionally small and pragmatic — sufficient for typical config /
 * API-response shapes, not full spec compliance.
 */

const escapeXml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));

/** JSON -> XML. Arrays become repeated <item> elements; objects become element trees. */
export const jsonToXml = (data: any, rootName = 'root'): string => {
  const build = (val: any, name: string, indent: string): string => {
    if (val === null || val === undefined) return `${indent}<${name}/>`;
    if (Array.isArray(val)) return val.map(v => build(v, name, indent)).join('\n');
    if (typeof val === 'object') {
      const children = Object.entries(val).map(([k, v]) => build(v, k, indent + '  ')).join('\n');
      return `${indent}<${name}>\n${children}\n${indent}</${name}>`;
    }
    return `${indent}<${name}>${escapeXml(String(val))}</${name}>`;
  };
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + build(data, rootName, '');
};

/** Very small XML -> JSON parser. Handles nested tags + text; ignores attributes/CDATA. */
export const xmlToJson = (src: string): any => {
  let i = 0;
  src = src.replace(/<\?xml[^?]*\?>/, '');
  src = src.replace(/<!--[\s\S]*?-->/g, '');
  const skipWs = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const parseValue = (text: string): any => {
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (text === 'null') return null;
    if (text !== '' && !isNaN(Number(text))) return Number(text);
    return text;
  };
  const parseElement = (): { name: string; value: any } | null => {
    skipWs();
    if (src[i] !== '<') return null;
    i++;
    let name = '';
    while (i < src.length && !/[\s/>]/.test(src[i])) name += src[i++];
    while (i < src.length && src[i] !== '>' && src[i] !== '/') i++;
    if (src[i] === '/') { i += 2; return { name, value: null }; }
    i++; // skip >
    const children: Array<{ name: string; value: any }> = [];
    let text = '';
    while (i < src.length) {
      if (src[i] === '<') {
        if (src[i + 1] === '/') {
          while (i < src.length && src[i] !== '>') i++;
          i++;
          if (children.length === 0) return { name, value: parseValue(text.trim()) };
          const obj: Record<string, any> = {};
          for (const c of children) {
            if (c.name in obj) {
              if (!Array.isArray(obj[c.name])) obj[c.name] = [obj[c.name]];
              obj[c.name].push(c.value);
            } else obj[c.name] = c.value;
          }
          return { name, value: obj };
        }
        const child = parseElement();
        if (child) children.push(child);
      } else {
        text += src[i++];
      }
    }
    return { name, value: text };
  };
  const root = parseElement();
  return root ? { [root.name]: root.value } : null;
};

/** Minimal YAML parser sufficient for nested mappings, sequences, and primitives. */
export const yamlToJson = (src: string): any => {
  const lines = src.split(/\r?\n/).filter(l => !/^\s*#/.test(l) && l.trim() !== '');
  let idx = 0;
  const indentOf = (l: string) => l.match(/^ */)![0].length;
  const parseScalar = (raw: string): any => {
    const s = raw.trim();
    if (s === '~' || s === 'null') return null;
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
    return s;
  };
  const parseBlock = (baseIndent: number): any => {
    if (idx >= lines.length) return null;
    const first = lines[idx];
    const ind = indentOf(first);
    if (ind < baseIndent) return null;
    const isSeq = /^\s*-\s?/.test(first);
    if (isSeq) {
      const arr: any[] = [];
      while (idx < lines.length) {
        const line = lines[idx];
        if (indentOf(line) < ind) break;
        if (indentOf(line) !== ind || !/^\s*-/.test(line)) break;
        const rest = line.replace(/^\s*-\s?/, '');
        idx++;
        if (rest === '') {
          arr.push(parseBlock(ind + 2));
        } else if (/^[A-Za-z_][\w$-]*\s*:/.test(rest)) {
          // inline mapping start
          const replay = ' '.repeat(ind + 2) + rest;
          lines.splice(idx, 0, replay);
          arr.push(parseBlock(ind + 2));
        } else {
          arr.push(parseScalar(rest));
        }
      }
      return arr;
    }
    const obj: Record<string, any> = {};
    while (idx < lines.length) {
      const line = lines[idx];
      const lineInd = indentOf(line);
      if (lineInd < ind) break;
      if (lineInd !== ind) break;
      const m = line.trim().match(/^([^:]+):\s*(.*)$/);
      if (!m) break;
      const key = m[1].trim();
      const val = m[2];
      idx++;
      if (val === '') {
        obj[key] = parseBlock(ind + 2);
      } else {
        obj[key] = parseScalar(val);
      }
    }
    return obj;
  };
  return parseBlock(0);
};

/** JSON -> TOML (subset): top-level scalars + nested tables + arrays of tables. */
export const jsonToToml = (data: any): string => {
  const lines: string[] = [];
  const fmt = (v: any): string => {
    if (v === null) return '""';
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return '[' + v.map(fmt).join(', ') + ']';
    return JSON.stringify(v);
  };
  const walk = (obj: any, prefix: string[]) => {
    if (!obj || typeof obj !== 'object') return;
    const scalars: [string, any][] = [];
    const tables: [string, any][] = [];
    const arrTables: [string, any[]][] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) tables.push([k, v]);
      else if (Array.isArray(v) && v.length > 0 && v.every(it => it && typeof it === 'object' && !Array.isArray(it))) arrTables.push([k, v]);
      else scalars.push([k, v]);
    }
    if (prefix.length > 0 && (scalars.length > 0 || (tables.length === 0 && arrTables.length === 0))) {
      lines.push(`[${prefix.join('.')}]`);
    }
    for (const [k, v] of scalars) lines.push(`${k} = ${fmt(v)}`);
    if (scalars.length > 0) lines.push('');
    for (const [k, v] of tables) walk(v, [...prefix, k]);
    for (const [k, arr] of arrTables) {
      for (const item of arr) {
        lines.push(`[[${[...prefix, k].join('.')}]]`);
        const subScalars: [string, any][] = [];
        const subTables: [string, any][] = [];
        for (const [k2, v2] of Object.entries(item)) {
          if (v2 && typeof v2 === 'object' && !Array.isArray(v2)) subTables.push([k2, v2]);
          else subScalars.push([k2, v2]);
        }
        for (const [k2, v2] of subScalars) lines.push(`${k2} = ${fmt(v2)}`);
        lines.push('');
        for (const [k2, v2] of subTables) walk(v2, [...prefix, k, k2]);
      }
    }
  };
  walk(data, []);
  return lines.join('\n').trim() + '\n';
};

/** Markdown table from array of flat objects. */
export const jsonToMarkdownTable = (rows: any[]): string | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const headers = Array.from(new Set(rows.flatMap(r => (r && typeof r === 'object') ? Object.keys(r) : [])));
  if (headers.length === 0) return null;
  const esc = (s: any) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(r => `| ${headers.map(h => esc(r?.[h])).join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}\n`;
};

/** HTML table from array of flat objects. */
export const jsonToHtmlTable = (rows: any[]): string | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const headers = Array.from(new Set(rows.flatMap(r => (r && typeof r === 'object') ? Object.keys(r) : [])));
  if (headers.length === 0) return null;
  const esc = (s: any) => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
  return `<table>\n  <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>\n  <tbody>\n${rows.map(r => `    <tr>${headers.map(h => `<td>${esc(r?.[h])}</td>`).join('')}</tr>`).join('\n')}\n  </tbody>\n</table>`;
};

/** JSON -> SQL INSERT statements for an array of flat objects. */
export const jsonToSqlInserts = (rows: any[], table = 'data'): string | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const headers = Array.from(new Set(rows.flatMap(r => (r && typeof r === 'object') ? Object.keys(r) : [])));
  if (headers.length === 0) return null;
  const fmt = (v: any) => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
    return `'${String(v).replace(/'/g, "''")}'`;
  };
  return rows.map(r =>
    `INSERT INTO ${table} (${headers.join(', ')}) VALUES (${headers.map(h => fmt(r?.[h])).join(', ')});`
  ).join('\n');
};

/** Estimate gzip-compressed size of a string. Browser-only (CompressionStream). */
export const estimateGzipSize = async (s: string): Promise<number | null> => {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    return buf.byteLength;
  } catch {
    return null;
  }
};
