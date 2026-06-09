/**
 * Lightweight JSON5-ish repair: fixes common issues that block JSON.parse
 * without needing a full grammar — trailing commas, single-quoted strings,
 * unquoted object keys, JS-style comments. Not a full parser; meant to take
 * "obviously JSON" input and make it strictly parseable.
 */
export interface RepairIssue {
  line: number;
  column: number;
  message: string;
}

export interface RepairResult {
  repaired: string;
  issues: RepairIssue[];
  changed: boolean;
}

const indexToLineCol = (src: string, idx: number) => {
  let line = 1, col = 1;
  for (let i = 0; i < idx && i < src.length; i++) {
    if (src[i] === '\n') { line++; col = 1; } else col++;
  }
  return { line, column: col };
};

/**
 * Returns a repaired version of `input` plus a list of issues that were patched.
 * If the input was already valid, `changed` is false and `issues` is empty.
 */
export const repairJson = (input: string): RepairResult => {
  // Fast path: already valid.
  try { JSON.parse(input); return { repaired: input, issues: [], changed: false }; } catch {}

  const issues: RepairIssue[] = [];
  let out = '';
  let i = 0;
  const n = input.length;

  // Strip line + block comments first (track issues at their position).
  while (i < n) {
    const ch = input[i];
    const next = input[i + 1];
    if (ch === '/' && next === '/') {
      const pos = indexToLineCol(input, i);
      issues.push({ ...pos, message: 'line comment' });
      while (i < n && input[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      const pos = indexToLineCol(input, i);
      issues.push({ ...pos, message: 'block comment' });
      i += 2;
      while (i < n && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // String literal: keep as-is, but convert single-quoted -> double-quoted.
    if (ch === '"') {
      out += ch; i++;
      while (i < n) {
        const c = input[i];
        out += c;
        if (c === '\\' && i + 1 < n) { out += input[i + 1]; i += 2; continue; }
        if (c === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (ch === "'") {
      const pos = indexToLineCol(input, i);
      issues.push({ ...pos, message: "single-quoted string" });
      out += '"'; i++;
      while (i < n) {
        const c = input[i];
        if (c === '\\' && i + 1 < n) { out += c + input[i + 1]; i += 2; continue; }
        if (c === "'") { out += '"'; i++; break; }
        if (c === '"') { out += '\\"'; i++; continue; }
        out += c; i++;
      }
      continue;
    }
    out += ch; i++;
  }

  // Quote unquoted keys: matches `{ ident:` and `, ident:` patterns.
  out = out.replace(/([\{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, (m, prefix, key, offset) => {
    const pos = indexToLineCol(out, offset + prefix.length);
    issues.push({ ...pos, message: `unquoted key "${key}"` });
    return `${prefix}"${key}":`;
  });

  // Remove trailing commas before `}` or `]`.
  out = out.replace(/,(\s*[\]\}])/g, (m, tail, offset) => {
    const pos = indexToLineCol(out, offset);
    issues.push({ ...pos, message: 'trailing comma' });
    return tail;
  });

  return { repaired: out, issues, changed: issues.length > 0 || out !== input };
};
