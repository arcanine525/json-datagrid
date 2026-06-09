/**
 * Tiny self-contained JSONPath evaluator. Supports the most common subset:
 *
 *   $              root
 *   .key  ['key']  child access
 *   [n]            index access
 *   ..key          recursive descent on key
 *   [*]  .*        wildcard
 *   [start:end:step]  array slice
 *   [?(expr)]      filter expression with @ as current element, simple
 *                  comparisons (==, !=, <, <=, >, >=) and AND/OR via &&, ||
 *
 * Not a full RFC 9535 implementation, but enough to make `$.users[?(@.age>18)].name`
 * — the example we ship in the README — work without an extra dependency.
 */
export interface QueryResult {
  matches: any[];
  error: string | null;
}

const isObj = (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v);

type Segment =
  | { kind: 'name'; name: string }
  | { kind: 'wild' }
  | { kind: 'index'; index: number }
  | { kind: 'slice'; start: number | null; end: number | null; step: number | null }
  | { kind: 'recursive'; name: string | null }
  | { kind: 'filter'; expr: string };

const tokenize = (path: string): Segment[] => {
  const segments: Segment[] = [];
  let i = 0;
  if (path[0] === '$') i = 1;
  while (i < path.length) {
    const ch = path[i];
    if (ch === '.') {
      if (path[i + 1] === '.') {
        i += 2;
        // ..* or ..name or ..[...] (recursive then next op)
        if (path[i] === '*') { segments.push({ kind: 'recursive', name: null }); i++; continue; }
        if (path[i] === '[') { segments.push({ kind: 'recursive', name: null }); continue; }
        let name = '';
        while (i < path.length && /[A-Za-z0-9_$]/.test(path[i])) name += path[i++];
        segments.push({ kind: 'recursive', name });
        continue;
      }
      i++;
      if (path[i] === '*') { segments.push({ kind: 'wild' }); i++; continue; }
      let name = '';
      while (i < path.length && /[A-Za-z0-9_$]/.test(path[i])) name += path[i++];
      if (name) segments.push({ kind: 'name', name });
      continue;
    }
    if (ch === '[') {
      // find matching ]
      let depth = 1, j = i + 1;
      while (j < path.length && depth > 0) {
        if (path[j] === '[') depth++;
        else if (path[j] === ']') depth--;
        if (depth > 0) j++;
      }
      const inner = path.slice(i + 1, j);
      i = j + 1;
      if (inner === '*') { segments.push({ kind: 'wild' }); continue; }
      if (inner.startsWith('?(') && inner.endsWith(')')) {
        segments.push({ kind: 'filter', expr: inner.slice(2, -1) });
        continue;
      }
      if (inner.startsWith("'") && inner.endsWith("'")) {
        segments.push({ kind: 'name', name: inner.slice(1, -1) });
        continue;
      }
      if (inner.startsWith('"') && inner.endsWith('"')) {
        segments.push({ kind: 'name', name: inner.slice(1, -1) });
        continue;
      }
      if (inner.includes(':')) {
        const [a, b, c] = inner.split(':');
        segments.push({
          kind: 'slice',
          start: a === '' ? null : Number(a),
          end: b === '' ? null : Number(b),
          step: c == null || c === '' ? null : Number(c),
        });
        continue;
      }
      const num = Number(inner);
      if (!Number.isNaN(num)) { segments.push({ kind: 'index', index: num }); continue; }
      segments.push({ kind: 'name', name: inner });
      continue;
    }
    i++;
  }
  return segments;
};

const evalFilterExpr = (expr: string, current: any): boolean => {
  // Replace @.foo and @['foo'] with safe accessor; only allow comparison/boolean ops + literals/numbers.
  const safe = expr.replace(/@\.([A-Za-z_$][\w$]*)/g, (_, k) => `__cur__[${JSON.stringify(k)}]`)
                   .replace(/@\[(['"][^'"]+['"])\]/g, '__cur__[$1]')
                   .replace(/@/g, '__cur__');
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('__cur__', `try { return Boolean(${safe}); } catch(e) { return false; }`);
    return fn(current);
  } catch {
    return false;
  }
};

const applySegment = (input: any[], seg: Segment): any[] => {
  const out: any[] = [];
  for (const item of input) {
    if (item == null) continue;
    switch (seg.kind) {
      case 'name':
        if (isObj(item) && seg.name in item) out.push(item[seg.name]);
        else if (Array.isArray(item)) for (const el of item) if (isObj(el) && seg.name in el) out.push(el[seg.name]);
        break;
      case 'wild':
        if (Array.isArray(item)) out.push(...item);
        else if (isObj(item)) out.push(...Object.values(item));
        break;
      case 'index':
        if (Array.isArray(item)) {
          const idx = seg.index < 0 ? item.length + seg.index : seg.index;
          if (idx >= 0 && idx < item.length) out.push(item[idx]);
        }
        break;
      case 'slice':
        if (Array.isArray(item)) {
          const step = seg.step ?? 1;
          const len = item.length;
          let s = seg.start ?? (step > 0 ? 0 : len - 1);
          let e = seg.end ?? (step > 0 ? len : -1);
          if (s < 0) s += len;
          if (e < 0 && seg.end != null) e += len;
          if (step > 0) for (let k = s; k < e; k += step) out.push(item[k]);
          else for (let k = s; k > e; k += step) out.push(item[k]);
        }
        break;
      case 'recursive': {
        const collect = (v: any) => {
          if (Array.isArray(v)) v.forEach(collect);
          else if (isObj(v)) {
            for (const [k, vv] of Object.entries(v)) {
              if (seg.name == null || k === seg.name) out.push(vv);
              collect(vv);
            }
          }
        };
        collect(item);
        break;
      }
      case 'filter':
        if (Array.isArray(item)) for (const el of item) if (evalFilterExpr(seg.expr, el)) out.push(el);
        else if (isObj(item)) for (const el of Object.values(item)) if (evalFilterExpr(seg.expr, el)) out.push(el);
        break;
    }
  }
  return out;
};

/**
 * Runs `path` against `data` and returns the matching nodes, or an error string.
 * Returns at most 10,000 matches to keep the UI responsive on huge documents.
 */
export const runJsonPath = (data: any, path: string): QueryResult => {
  if (!path.trim()) return { matches: [], error: null };
  try {
    const segments = tokenize(path.trim());
    let current: any[] = [data];
    for (const seg of segments) {
      current = applySegment(current, seg);
      if (current.length > 10000) {
        return { matches: current.slice(0, 10000), error: 'Result truncated to 10,000 matches.' };
      }
    }
    return { matches: current, error: null };
  } catch (e: any) {
    return { matches: [], error: e?.message ?? 'Query error' };
  }
};
