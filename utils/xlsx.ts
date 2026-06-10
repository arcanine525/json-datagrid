/**
 * Build a minimal Excel 2007+ workbook (.xlsx) from an array of flat JSON
 * objects, without any external library. We hand-craft the OOXML parts and
 * ZIP them into the final file.
 *
 * Compatible with Excel, Numbers, and LibreOffice for simple tabular data.
 */

const xmlEsc = (s: string) => s.replace(/[<>&"']/g, c => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
}[c]!));

// --- Tiny ZIP (store, no deflate) ---
// .xlsx is technically a ZIP. We use STORE method so we don't need a deflate
// implementation. Excel accepts stored entries.
const crc32Table = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crc32Table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const enc = new TextEncoder();

interface ZipEntry { name: string; data: Uint8Array; }

const buildZip = (entries: ZipEntry[]): Uint8Array => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);
    const local = new Uint8Array(30 + nameBytes.length + e.data.length);
    const dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true); // version
    dv.setUint16(6, 0, true); // flags
    dv.setUint16(8, 0, true); // method = store
    dv.setUint16(10, 0, true); // time
    dv.setUint16(12, 0x21, true); // date (1980-01-01)
    dv.setUint32(14, crc, true);
    dv.setUint32(18, e.data.length, true);
    dv.setUint32(22, e.data.length, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(e.data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(central.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, 0, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, 0, true);
    cdv.setUint16(14, 0x21, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, e.data.length, true);
    cdv.setUint32(24, e.data.length, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    offset += local.length;
  }
  const centralSize = centralParts.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array(22);
  const edv = new DataView(end.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, entries.length, true);
  edv.setUint16(10, entries.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, offset, true);

  const totalLocal = localParts.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(totalLocal + centralSize + 22);
  let p = 0;
  for (const part of localParts) { out.set(part, p); p += part.length; }
  for (const part of centralParts) { out.set(part, p); p += part.length; }
  out.set(end, p);
  return out;
};

const colName = (n: number): string => {
  let s = '';
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
  return s;
};

/**
 * Build a single-sheet workbook from an array of flat objects.
 * Mixed types are coerced: strings/numbers/booleans → cell value, anything
 * else → JSON-stringified text.
 */
export const buildXlsx = (rows: any[], sheetName = 'Sheet1'): Uint8Array => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Need a non-empty array of objects.');
  }
  const headers = Array.from(new Set(rows.flatMap(r => (r && typeof r === 'object') ? Object.keys(r) : [])));

  const rowXml = (cells: string[], r: number) => {
    const inner = cells.map((c, i) => c).join('');
    return `<row r="${r}">${inner}</row>`;
  };
  const cellXml = (val: any, ref: string): string => {
    if (val === null || val === undefined || val === '') return `<c r="${ref}"/>`;
    if (typeof val === 'number' && Number.isFinite(val)) return `<c r="${ref}"><v>${val}</v></c>`;
    if (typeof val === 'boolean') return `<c r="${ref}" t="b"><v>${val ? 1 : 0}</v></c>`;
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(s)}</t></is></c>`;
  };

  const headerRow = rowXml(headers.map((h, i) => cellXml(h, `${colName(i)}1`)), 1);
  const bodyRows = rows.map((row, ri) => rowXml(
    headers.map((h, ci) => cellXml(row?.[h], `${colName(ci)}${ri + 2}`)),
    ri + 2
  )).join('');

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${headerRow}${bodyRows}</sheetData></worksheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${xmlEsc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  return buildZip([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels', data: enc.encode(rootRels) },
    { name: 'xl/workbook.xml', data: enc.encode(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRels) },
    { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheet) },
  ]);
};
