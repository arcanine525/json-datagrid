/**
 * Minimal hand-rolled i18n. Each top-level key is a stable string ID; each
 * inner key is a locale. Add a new language by adding a column. Falls back to
 * English if a key/locale is missing.
 */

export type Locale = 'en' | 'vi';

const dict = {
  app_title: { en: 'JSON DataGrid', vi: 'JSON DataGrid' },
  tab_code: { en: 'Code', vi: 'Mã' },
  tab_tree: { en: 'Tree', vi: 'Cây' },
  tab_table: { en: 'Table', vi: 'Bảng' },
  tab_schema: { en: 'Schema', vi: 'Schema' },
  tab_stats: { en: 'Stats', vi: 'Thống kê' },
  tab_query: { en: 'Query', vi: 'Truy vấn' },
  tab_diff: { en: 'Diff', vi: 'So sánh' },
  tab_convert: { en: 'Convert', vi: 'Chuyển đổi' },
  tab_mock: { en: 'Mock', vi: 'Dữ liệu mẫu' },
  tab_api: { en: 'API', vi: 'API' },
  tab_share: { en: 'Share', vi: 'Chia sẻ' },
  tab_history: { en: 'History', vi: 'Lịch sử' },
  format: { en: 'Format', vi: 'Định dạng' },
  minify: { en: 'Minify', vi: 'Nén' },
  fetch: { en: 'Fetch', vi: 'Tải' },
  upload_file: { en: 'Upload File', vi: 'Tải tệp' },
  waiting_valid_json: { en: 'Waiting for valid JSON…', vi: 'Đang chờ JSON hợp lệ…' },
  input_empty: { en: 'Input is empty.', vi: 'Đầu vào trống.' },
  copy: { en: 'Copy', vi: 'Sao chép' },
  download: { en: 'Download', vi: 'Tải xuống' },
  shortcuts: { en: 'Keyboard shortcuts', vi: 'Phím tắt' },
  language: { en: 'Language', vi: 'Ngôn ngữ' },
  search_placeholder: { en: 'Search keys / values…', vi: 'Tìm kiếm khóa / giá trị…' },
  expand_all: { en: 'Expand all', vi: 'Mở rộng' },
  collapse_all: { en: 'Collapse all', vi: 'Thu gọn' },
  depth: { en: 'Depth', vi: 'Độ sâu' },
} satisfies Record<string, Record<Locale, string>>;

export type DictKey = keyof typeof dict;

/** Resolve a string for the given locale. */
export const t = (key: DictKey, locale: Locale): string => {
  const entry = dict[key] as Record<Locale, string> | undefined;
  if (!entry) return key;
  return entry[locale] ?? entry.en;
};

export const LOCALE_OPTIONS: Array<{ code: Locale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];
