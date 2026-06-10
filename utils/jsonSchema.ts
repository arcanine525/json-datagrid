/**
 * Generate a JSON Schema (draft 2020-12) from a sample JSON value, and a
 * tiny validator that can check a value against such a schema. Dependency-free.
 *
 * The generator is intentionally conservative: it never emits required fields,
 * never enforces enum, and merges sibling array elements into a union — so the
 * output is a permissive but accurate "skeleton" you can refine by hand.
 */

export type JsonSchema = any;

const typeOf = (v: any): string => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
};

const detectFormat = (s: string): string | undefined => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) return 'date-time';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'date';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email';
  if (/^https?:\/\//.test(s)) return 'uri';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return 'uuid';
  return undefined;
};

const mergeSchemas = (schemas: JsonSchema[]): JsonSchema => {
  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0];
  // If all are object schemas, merge properties.
  const allObjects = schemas.every(s => s.type === 'object' && s.properties);
  if (allObjects) {
    const merged: JsonSchema = { type: 'object', properties: {} };
    for (const s of schemas) {
      for (const [k, v] of Object.entries(s.properties as Record<string, JsonSchema>)) {
        merged.properties[k] = merged.properties[k] ? mergeSchemas([merged.properties[k], v]) : v;
      }
    }
    return merged;
  }
  // Distinct primitive/array types → union.
  const types = [...new Set(schemas.map(s => s.type).filter(Boolean))];
  if (types.length === 1) return schemas[0];
  return { type: types };
};

const buildSchema = (val: any): JsonSchema => {
  const t = typeOf(val);
  switch (t) {
    case 'string': {
      const fmt = detectFormat(val);
      return fmt ? { type: 'string', format: fmt } : { type: 'string' };
    }
    case 'number':
      return Number.isInteger(val) ? { type: 'integer' } : { type: 'number' };
    case 'boolean': return { type: 'boolean' };
    case 'null': return { type: 'null' };
    case 'array': {
      if ((val as any[]).length === 0) return { type: 'array', items: {} };
      const itemSchemas = (val as any[]).map(buildSchema);
      return { type: 'array', items: mergeSchemas(itemSchemas) };
    }
    case 'object': {
      const properties: Record<string, JsonSchema> = {};
      for (const [k, v] of Object.entries(val)) properties[k] = buildSchema(v);
      return { type: 'object', properties };
    }
    default: return {};
  }
};

/**
 * Build a JSON Schema 2020-12 document for the given sample value.
 * @param title Optional `title` field on the root schema.
 */
export const generateJsonSchema = (sample: any, title = 'Root'): JsonSchema => {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title,
    ...buildSchema(sample),
  };
};

export interface ValidationError {
  path: string;
  message: string;
}

const validateAgainst = (value: any, schema: JsonSchema, path: string, errors: ValidationError[]) => {
  if (!schema || typeof schema !== 'object') return;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : null;
  if (types) {
    const actual = typeOf(value);
    const ok = types.some((t: string) => t === actual || (t === 'integer' && actual === 'number' && Number.isInteger(value)));
    if (!ok) {
      errors.push({ path, message: `expected type ${types.join(' | ')}, got ${actual}` });
      return;
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((v, i) => validateAgainst(v, schema.items, `${path}[${i}]`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value) && schema.properties) {
    for (const [k, child] of Object.entries(schema.properties as Record<string, JsonSchema>)) {
      if (k in value) validateAgainst(value[k], child, `${path}.${k}`, errors);
    }
    if (Array.isArray(schema.required)) {
      for (const req of schema.required) {
        if (!(req in value)) errors.push({ path: `${path}.${req}`, message: 'required property missing' });
      }
    }
  }
};

/**
 * Returns an array of validation errors. Empty array means the value conforms
 * to the schema. Only the spec features we need are implemented: type, items,
 * properties, required.
 */
export const validateJson = (value: any, schema: JsonSchema): ValidationError[] => {
  const errors: ValidationError[] = [];
  validateAgainst(value, schema, '$', errors);
  return errors;
};
