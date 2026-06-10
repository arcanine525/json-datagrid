/**
 * Encode arbitrary text into a URL-safe fragment using gzip + base64. Used by
 * the Share view to make small documents shareable with a single click.
 *
 * Falls back to plain base64 when CompressionStream is unavailable.
 */

const toBase64Url = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (s: string): Uint8Array => {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

export const encodeShare = async (text: string): Promise<string> => {
  if (typeof CompressionStream === 'undefined') {
    return 'p.' + toBase64Url(new TextEncoder().encode(text));
  }
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  return 'g.' + toBase64Url(buf);
};

export const decodeShare = async (fragment: string): Promise<string | null> => {
  try {
    if (fragment.startsWith('g.')) {
      const bytes = fromBase64Url(fragment.slice(2));
      if (typeof DecompressionStream === 'undefined') return null;
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return await new Response(stream).text();
    }
    if (fragment.startsWith('p.')) {
      return new TextDecoder().decode(fromBase64Url(fragment.slice(2)));
    }
  } catch {}
  return null;
};
