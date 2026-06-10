<div align="center">
<img width="1200" height="475" alt="JSON DataGrid Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JSON DataGrid: Your Ultimate JSON Toolkit

JSON DataGrid is a powerful and intuitive web-based tool designed to help you view, analyze, and manipulate JSON data with ease. Whether you're a developer debugging an API response, a data analyst exploring a dataset, or just someone who needs to make sense of a JSON file, this tool has you covered.

**[View your app in AI Studio](https://ai.studio/apps/drive/1ednuLS71LDC1lA8SnhXbu9aaCcXYMEQR)**

## Key Features

### Data Views
- **Code View** — raw JSON with syntax highlighting and copy-to-clipboard.
- **Tree View** — collapsible hierarchical view with:
  - **Type badges** (str / num / bool / null / arr / obj).
  - **Array length** indicators.
  - **Depth control** (expand to depth 1 – 5, expand-all, collapse-all).
  - **Path Copier** — per-node menu copies the path as JSON Pointer, JSONPath, dot, or bracket notation.
  - **In-tree search** (Ctrl/⌘+F) with case-sensitive, regex, key/value scoping, prev/next navigation, and auto-scroll to the active match.
  - **Big-file mode** — auto-detected (~10 k+ nodes); tree starts collapsed and prompts before expand-all.
- **Table View** — sortable, filterable, **paginated** table with:
  - **Column hide/show** menu.
  - **Multi-column sort** (shift-click headers).
  - **CSV + XLSX export** of the filtered view (no library — XLSX is hand-built).
- **Schema View** — generates a **TypeScript interface**, **JSON Schema (draft 2020-12)**, **Zod schema**, **Go struct**, **Rust struct**, or **Python dataclass** from the JSON. Includes a **schema validator** (paste a schema, see violations live).
- **Stats View** — total keys, max depth, array/object counts, byte size, type distribution chart, top keys, and duplicate-key detection.
- **Query View** — run **JSONPath** expressions (`$.users[?(@.age>18)].name`) against the document; live match count and copy-result.
- **Diff View** — paste a second JSON and see added / removed / changed paths side-by-side.
- **Convert View** — render the JSON as **YAML, XML, CSV, TOML, Markdown table, HTML table, or SQL INSERTs**. Reverse import (YAML / XML → JSON) is built in too.
- **Mock View** — synthesise plausible-looking data shaped like the current document (seeded PRNG, smart field hints for `name`/`email`/`city`/`uuid`/`date`).
- **API View** — Postman-lite client: pick method, headers, body, send the request, inspect the response, and "Send to editor" to load JSON straight into a new tab. Saved requests persist in localStorage.
- **Share View** — encode the document into a gzip+base64 URL fragment; the recipient opens the link and the app auto-loads it into a fresh tab.
- **History View** — every open tab is searchable, renamable, pinnable, and persists in localStorage.

### Input
- **Paste, fetch from URL, file upload, or drag-and-drop** a `.json` file.
- **JSON Repair (auto-fix)** — when input fails to parse, an inline banner detects fixable issues (trailing commas, single quotes, unquoted keys, `//` and `/* */` comments) and offers a one-click Auto-fix.
- **Multi-tab editing** — open many documents side-by-side; pin the important ones, switch instantly, persisted across sessions.

### Data Manipulation & Export
- **Format / Minify** with a single click.
- **Minify size comparison** — see raw and gzip sizes before/after with the percentage saved.
- Built-in download as `.json`, `.csv`, `.yaml`; the Convert view extends this with XML, TOML, Markdown, HTML, SQL. The Table view adds **XLSX** export.

### UX
- **Light & Dark mode** toggle.
- **i18n** — Vietnamese / English language switcher in the header.
- **PWA / Offline mode** — installable to the home-screen and works fully offline (registered service worker caches the app shell).
- **Keyboard Shortcut Panel** — press `?` anywhere outside an input to see every shortcut.
- **Keyboard shortcuts**:
  - `Ctrl/⌘ + Alt + F` — Format
  - `Ctrl/⌘ + Alt + M` — Minify
  - `Ctrl/⌘ + F` — Search in Tree view
  - `?` — Toggle the shortcut help panel
  - `Esc` — Close panels / cancel search
- **Responsive design** — works on desktop and mobile.

## Getting Started

### Prerequisites

- **Node.js**: A recent version of Node.js. Download from [nodejs.org](https://nodejs.org/).

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd json-datagrid
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

This project is built with **React 19**, **Vite 6**, and **TypeScript**. Key paths:

- `App.tsx` — root component; layout, theme, locale, multi-tab state, share-URL auto-load, shortcuts.
- `index.tsx` — entry point; registers the offline service worker in production builds.
- `i18n.ts` — string dictionary + `t()` resolver.
- `components/`
  - `Header.tsx` — title, theme toggle, locale picker, shortcut help trigger.
  - `TabBar.tsx` — horizontal multi-tab strip.
  - `InputPanel.tsx` — JSON input, URL fetch, file upload, JSON Repair banner, minify size stats.
  - `ViewPanel.tsx` — tabbed container hosting every view component.
  - `CodeView.tsx`, `TreeView.tsx`, `TableView.tsx`
  - `SchemaView.tsx` — TS / JSON Schema / Zod / Go / Rust / Python generator + validator.
  - `StatsView.tsx` — structural statistics dashboard.
  - `QueryView.tsx` — JSONPath playground.
  - `DiffView.tsx` — structural diff between source and a pasted target.
  - `ConvertView.tsx` — JSON → YAML / XML / CSV / TOML / Markdown / HTML / SQL (and reverse import).
  - `MockView.tsx` — schema-driven mock data generator.
  - `ApiView.tsx` — Postman-lite request runner.
  - `ShareView.tsx` — gzip+base64 URL share.
  - `HistoryView.tsx` — searchable list of all open tabs with pin/rename/delete.
  - `ShortcutPanel.tsx` — modal listing all keyboard shortcuts.
  - `Icons.tsx` — SVG icon set.
- `hooks/`
  - `useJsonProcessor.ts` — parse + validate raw JSON; detect table compatibility.
  - `useLocalStorage.ts` — persisted state.
  - `useTabs.ts` — multi-tab state, persisted in localStorage.
- `utils.ts` — shared helpers (CSV, YAML, TS-interface conversion, file download).
- `utils/repair.ts` — JSON repair.
- `utils/jsonpath.ts` — JSONPath engine.
- `utils/jsonSchema.ts` — JSON Schema generator + validator.
- `utils/codegen.ts` — Zod / Go / Rust / Python code generation.
- `utils/convert.ts` — YAML / XML / TOML / Markdown / HTML / SQL converters + gzip-size estimator.
- `utils/mock.ts` — schema-driven mock data + seeded PRNG.
- `utils/xlsx.ts` — XLSX writer + minimal ZIP (no library).
- `utils/share.ts` — gzip+base64 URL fragment codec.
- `public/manifest.webmanifest` — PWA manifest.
- `public/sw.js` — service worker (offline cache).
- `types.ts` — shared TypeScript types.

Every converter, JSONPath engine, JSON repair routine, schema generator/validator, code generator, mock data, XLSX writer, and share-URL codec is **dependency-free** — the only runtime libraries are React and `json-to-ts`.

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please:

1. **Fork the repository.**
2. **Create a new branch** for your feature or fix.
3. **Make your changes** and commit them with a clear message.
4. **Push your branch** and submit a pull request.

---
Built with ❤️ and a passion for clean, accessible data.
