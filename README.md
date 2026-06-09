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
- **Table View** — sortable, filterable table for arrays of objects.
- **Schema View** — generates a TypeScript `interface` from the JSON.
- **Stats View** — total keys, max depth, array/object counts, byte size, type distribution chart, top keys, and duplicate-key detection.
- **Query View** — run **JSONPath** expressions (`$.users[?(@.age>18)].name`) against the document; live match count and copy-result.
- **Diff View** — paste a second JSON and see added / removed / changed paths side-by-side.
- **Convert View** — render the JSON as **YAML, XML, CSV, TOML, Markdown table, HTML table, or SQL INSERTs**. Reverse import (YAML / XML → JSON) is built in too.

### Input
- **Paste, fetch from URL, file upload, or drag-and-drop** a `.json` file.
- **JSON Repair (auto-fix)** — when input fails to parse, an inline banner detects fixable issues (trailing commas, single quotes, unquoted keys, `//` and `/* */` comments) and offers a one-click Auto-fix.

### Data Manipulation & Export
- **Format / Minify** with a single click.
- **Minify size comparison** — see raw and gzip sizes before/after with the percentage saved.
- Built-in download as `.json`, `.csv`, `.yaml`; the Convert view extends this with XML, TOML, Markdown, HTML, and SQL.

### UX
- **Light & Dark mode** toggle.
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

- `App.tsx` — root component; layout, theme, keyboard shortcuts, shortcut modal.
- `components/`
  - `Header.tsx` — title, theme toggle, shortcut help trigger.
  - `InputPanel.tsx` — JSON input, URL fetch, file upload, JSON Repair banner, minify size stats.
  - `ViewPanel.tsx` — tabbed container hosting every view component.
  - `CodeView.tsx`, `TreeView.tsx`, `TableView.tsx`, `SchemaView.tsx`
  - `StatsView.tsx` — structural statistics dashboard.
  - `QueryView.tsx` — JSONPath playground.
  - `DiffView.tsx` — structural diff between source and a pasted target.
  - `ConvertView.tsx` — JSON → YAML / XML / CSV / TOML / Markdown / HTML / SQL (and reverse import).
  - `ShortcutPanel.tsx` — modal listing all keyboard shortcuts.
  - `Icons.tsx` — SVG icon set.
- `hooks/`
  - `useJsonProcessor.ts` — parse + validate raw JSON; detect table compatibility.
  - `useLocalStorage.ts` — persisted state.
- `utils.ts` — shared helpers (CSV, YAML, TS-interface conversion, file download).
- `utils/repair.ts` — dependency-free JSON repair.
- `utils/jsonpath.ts` — dependency-free JSONPath engine.
- `utils/convert.ts` — multi-format converters (YAML / XML / TOML / Markdown / HTML / SQL) and gzip-size estimator.
- `types.ts` — shared TypeScript types.

All format converters, JSONPath, search, repair, and stats logic are **dependency-free** — the only runtime libraries are React and `json-to-ts`.

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please:

1. **Fork the repository.**
2. **Create a new branch** for your feature or fix.
3. **Make your changes** and commit them with a clear message.
4. **Push your branch** and submit a pull request.

---
Built with ❤️ and a passion for clean, accessible data.
