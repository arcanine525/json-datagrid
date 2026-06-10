/**
 * Tiny dependency-free mock-data generator driven by a JSON Schema (or by a
 * JSON sample, via `generateJsonSchema`). It produces plausible-looking data
 * — names, emails, numbers, dates — without pulling in faker.
 *
 * Seeded by a mulberry32 PRNG so the same seed always yields the same output.
 */

const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Robin', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Linh', 'Mai', 'Bao', 'Trang', 'Hieu', 'Nam', 'An', 'Dung'];
const LAST_NAMES = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];
const CITIES = ['Hanoi', 'HCMC', 'Da Nang', 'Hue', 'Tokyo', 'London', 'Berlin', 'Sydney', 'Toronto', 'San Francisco'];
const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor'];

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface Ctx { rand: () => number; depth: number; }

const pick = <T>(arr: T[], ctx: Ctx): T => arr[Math.floor(ctx.rand() * arr.length)];
const randInt = (min: number, max: number, ctx: Ctx) => Math.floor(ctx.rand() * (max - min + 1)) + min;
const sentence = (ctx: Ctx) =>
  Array.from({ length: randInt(3, 8, ctx) }, () => pick(WORDS, ctx)).join(' ');

/** Generate one mock value matching `schema`. Recognises common formats. */
const generate = (schema: any, ctx: Ctx, hint = ''): any => {
  if (!schema || typeof schema !== 'object') return null;
  if (ctx.depth > 8) return null;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const t = types[0] || (schema.properties ? 'object' : schema.items ? 'array' : 'string');
  ctx.depth++;
  try {
    switch (t) {
      case 'null': return null;
      case 'boolean': return ctx.rand() < 0.5;
      case 'integer': return randInt(schema.minimum ?? 0, schema.maximum ?? 10_000, ctx);
      case 'number': return Math.round(ctx.rand() * 10_000) / 100;
      case 'string': {
        const fmt = schema.format as string | undefined;
        if (fmt === 'email') return `${pick(FIRST_NAMES, ctx).toLowerCase()}@example.com`;
        if (fmt === 'date') return new Date(Date.now() - randInt(0, 365 * 5, ctx) * 86400000).toISOString().slice(0, 10);
        if (fmt === 'date-time') return new Date(Date.now() - randInt(0, 365 * 5, ctx) * 86400000).toISOString();
        if (fmt === 'uri') return `https://example.com/${pick(WORDS, ctx)}`;
        if (fmt === 'uuid') return Array.from({ length: 36 }, (_, i) => {
          if (i === 8 || i === 13 || i === 18 || i === 23) return '-';
          if (i === 14) return '4';
          return Math.floor(ctx.rand() * 16).toString(16);
        }).join('');
        const lower = hint.toLowerCase();
        if (lower.includes('name')) return `${pick(FIRST_NAMES, ctx)} ${pick(LAST_NAMES, ctx)}`;
        if (lower.includes('first')) return pick(FIRST_NAMES, ctx);
        if (lower.includes('last')) return pick(LAST_NAMES, ctx);
        if (lower.includes('email')) return `${pick(FIRST_NAMES, ctx).toLowerCase()}@example.com`;
        if (lower.includes('city')) return pick(CITIES, ctx);
        if (lower.includes('id')) return `${pick(WORDS, ctx)}-${randInt(100, 999, ctx)}`;
        return sentence(ctx);
      }
      case 'array': {
        const len = randInt(2, 5, ctx);
        return Array.from({ length: len }, () => generate(schema.items ?? {}, ctx, hint));
      }
      case 'object': {
        const out: Record<string, any> = {};
        for (const [k, sub] of Object.entries(schema.properties || {})) out[k] = generate(sub, ctx, k);
        return out;
      }
    }
  } finally {
    ctx.depth--;
  }
  return null;
};

/** Top-level entry point: produce `count` mock items shaped like `schema`. */
export const generateMockData = (schema: any, count = 10, seed = 1): any[] => {
  const ctx: Ctx = { rand: mulberry32(seed), depth: 0 };
  const itemSchema = schema?.type === 'array' && schema.items ? schema.items : schema;
  return Array.from({ length: count }, () => generate(itemSchema, ctx));
};
