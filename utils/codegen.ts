/**
 * Code generators for common typed-language targets, driven by a sample JSON
 * value. Each generator infers types by walking the value once and merging
 * sibling array elements. None of them aspire to spec-perfection — they're
 * meant to produce a "good first draft" that engineers can refine by hand.
 */

type Lang = 'zod' | 'go' | 'rust' | 'python';

const pascal = (s: string) => s
  .replace(/[^A-Za-z0-9]+/g, ' ')
  .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
  .replace(/^./, c => c.toUpperCase()) || 'Item';

const snake = (s: string) => s
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .replace(/[^A-Za-z0-9]+/g, '_')
  .toLowerCase()
  .replace(/^_+|_+$/g, '');

type Node =
  | { kind: 'primitive'; prim: 'string' | 'integer' | 'number' | 'boolean' | 'null' | 'any' }
  | { kind: 'array'; items: Node }
  | { kind: 'object'; fields: Record<string, Node> };

const merge = (a: Node, b: Node): Node => {
  if (a.kind === 'primitive' && b.kind === 'primitive' && a.prim === b.prim) return a;
  if (a.kind === 'array' && b.kind === 'array') return { kind: 'array', items: merge(a.items, b.items) };
  if (a.kind === 'object' && b.kind === 'object') {
    const fields: Record<string, Node> = { ...a.fields };
    for (const [k, v] of Object.entries(b.fields)) {
      fields[k] = fields[k] ? merge(fields[k], v) : v;
    }
    return { kind: 'object', fields };
  }
  return { kind: 'primitive', prim: 'any' };
};

const infer = (v: any): Node => {
  if (v === null) return { kind: 'primitive', prim: 'null' };
  if (Array.isArray(v)) {
    if (v.length === 0) return { kind: 'array', items: { kind: 'primitive', prim: 'any' } };
    return { kind: 'array', items: v.map(infer).reduce(merge) };
  }
  if (typeof v === 'object') {
    const fields: Record<string, Node> = {};
    for (const [k, val] of Object.entries(v)) fields[k] = infer(val);
    return { kind: 'object', fields };
  }
  if (typeof v === 'number') return { kind: 'primitive', prim: Number.isInteger(v) ? 'integer' : 'number' };
  if (typeof v === 'string') return { kind: 'primitive', prim: 'string' };
  if (typeof v === 'boolean') return { kind: 'primitive', prim: 'boolean' };
  return { kind: 'primitive', prim: 'any' };
};

const zod = (node: Node, name: string): string => {
  const types: string[] = [];
  const seen = new Set<string>();
  const render = (n: Node, hint: string): string => {
    switch (n.kind) {
      case 'primitive':
        if (n.prim === 'integer') return 'z.number().int()';
        if (n.prim === 'null') return 'z.null()';
        if (n.prim === 'any') return 'z.any()';
        return `z.${n.prim === 'number' ? 'number' : n.prim === 'boolean' ? 'boolean' : 'string'}()`;
      case 'array': return `z.array(${render(n.items, hint + 'Item')})`;
      case 'object': {
        const id = pascal(hint);
        const fields = Object.entries(n.fields)
          .map(([k, v]) => `  ${JSON.stringify(k)}: ${render(v, k)}`)
          .join(',\n');
        const decl = `export const ${id}Schema = z.object({\n${fields}\n});\nexport type ${id} = z.infer<typeof ${id}Schema>;`;
        if (!seen.has(id)) { seen.add(id); types.push(decl); }
        return `${id}Schema`;
      }
    }
  };
  const rootExpr = render(node, name);
  // If root wasn't an object, wrap it
  if (node.kind !== 'object') {
    types.push(`export const ${pascal(name)}Schema = ${rootExpr};\nexport type ${pascal(name)} = z.infer<typeof ${pascal(name)}Schema>;`);
  }
  return `import { z } from "zod";\n\n${types.join('\n\n')}\n`;
};

const goStruct = (node: Node, name: string): string => {
  const types: string[] = [];
  const seen = new Set<string>();
  const render = (n: Node, hint: string): string => {
    switch (n.kind) {
      case 'primitive':
        if (n.prim === 'integer') return 'int64';
        if (n.prim === 'number') return 'float64';
        if (n.prim === 'boolean') return 'bool';
        if (n.prim === 'null') return 'interface{}';
        if (n.prim === 'any') return 'interface{}';
        return 'string';
      case 'array': return `[]${render(n.items, hint + 'Item')}`;
      case 'object': {
        const id = pascal(hint);
        const fields = Object.entries(n.fields)
          .map(([k, v]) => `\t${pascal(k)} ${render(v, k)} \`json:"${k}"\``)
          .join('\n');
        const decl = `type ${id} struct {\n${fields}\n}`;
        if (!seen.has(id)) { seen.add(id); types.push(decl); }
        return id;
      }
    }
  };
  const rootType = render(node, name);
  if (node.kind !== 'object') {
    types.push(`type ${pascal(name)} = ${rootType}`);
  }
  return types.join('\n\n') + '\n';
};

const rustStruct = (node: Node, name: string): string => {
  const types: string[] = [];
  const seen = new Set<string>();
  const render = (n: Node, hint: string): string => {
    switch (n.kind) {
      case 'primitive':
        if (n.prim === 'integer') return 'i64';
        if (n.prim === 'number') return 'f64';
        if (n.prim === 'boolean') return 'bool';
        if (n.prim === 'null') return 'serde_json::Value';
        if (n.prim === 'any') return 'serde_json::Value';
        return 'String';
      case 'array': return `Vec<${render(n.items, hint + 'Item')}>`;
      case 'object': {
        const id = pascal(hint);
        const fields = Object.entries(n.fields)
          .map(([k, v]) => {
            const rustName = snake(k);
            const rename = rustName !== k ? `    #[serde(rename = "${k}")]\n` : '';
            return `${rename}    pub ${rustName}: ${render(v, k)},`;
          })
          .join('\n');
        const decl = `#[derive(Debug, Serialize, Deserialize)]\npub struct ${id} {\n${fields}\n}`;
        if (!seen.has(id)) { seen.add(id); types.push(decl); }
        return id;
      }
    }
  };
  const rootType = render(node, name);
  if (node.kind !== 'object') {
    types.push(`pub type ${pascal(name)} = ${rootType};`);
  }
  return `use serde::{Serialize, Deserialize};\n\n${types.join('\n\n')}\n`;
};

const pythonDataclass = (node: Node, name: string): string => {
  const types: string[] = [];
  const seen = new Set<string>();
  const render = (n: Node, hint: string): string => {
    switch (n.kind) {
      case 'primitive':
        if (n.prim === 'integer') return 'int';
        if (n.prim === 'number') return 'float';
        if (n.prim === 'boolean') return 'bool';
        if (n.prim === 'null') return 'None';
        if (n.prim === 'any') return 'Any';
        return 'str';
      case 'array': return `List[${render(n.items, hint + 'Item')}]`;
      case 'object': {
        const id = pascal(hint);
        const fields = Object.entries(n.fields)
          .map(([k, v]) => `    ${snake(k)}: ${render(v, k)}`)
          .join('\n') || '    pass';
        const decl = `@dataclass\nclass ${id}:\n${fields}`;
        if (!seen.has(id)) { seen.add(id); types.push(decl); }
        return id;
      }
    }
  };
  const rootType = render(node, name);
  if (node.kind !== 'object') {
    types.push(`${pascal(name)} = ${rootType}`);
  }
  return `from dataclasses import dataclass\nfrom typing import List, Any, Optional\n\n${types.join('\n\n\n')}\n`;
};

/** Generate code in the requested language for the supplied JSON sample. */
export const generateCode = (sample: any, lang: Lang, rootName = 'Root'): string => {
  const tree = infer(sample);
  switch (lang) {
    case 'zod': return zod(tree, rootName);
    case 'go': return goStruct(tree, rootName);
    case 'rust': return rustStruct(tree, rootName);
    case 'python': return pythonDataclass(tree, rootName);
  }
};

export type CodegenLang = Lang;
