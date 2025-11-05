<div align="center">
<img width="1200" height="475" alt="JSON DataGrid Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JSON DataGrid: Your Ultimate JSON Toolkit

JSON DataGrid is a powerful and intuitive web-based tool designed to help you view, analyze, and manipulate JSON data with ease. Whether you're a developer debugging an API response, a data analyst exploring a dataset, or just someone who needs to make sense of a JSON file, this tool has you covered.

**[View your app in AI Studio](https://ai.studio/apps/drive/1ednuLS71LDC1lA8SnhXbu9aaCcXYMEQR)**

## Key Features

- **Multiple Data Views**:
  - **Code View**: Displays the raw JSON with syntax highlighting and a copy-to-clipboard feature.
  - **Tree View**: Presents the JSON in a collapsible, hierarchical tree structure, making it easy to navigate complex, nested data.
  - **Table View**: Automatically converts an array of JSON objects into a sortable and filterable table.
- **Flexible Data Input**:
  - **Paste**: Directly paste your raw JSON into the input panel.
  - **Fetch from URL**: Load JSON data from any public URL.
  - **File Upload & Drag-and-Drop**: Easily open `.json` files from your local machine.
- **Data Manipulation & Export**:
  - **Format/Minify**: Clean up your JSON with a single click to make it more readable or compact.
  - **Export Options**: Download your data as a `.json`, `.csv`, or `.yaml` file.
- **User-Friendly Interface**:
  - **Light & Dark Modes**: Switch between themes for your comfort.
  - **Keyboard Shortcuts**: `Ctrl + Alt + F` to format and `Ctrl + Alt + M` to minify.
  - **Responsive Design**: Works seamlessly on both desktop and mobile devices.

## Getting Started

To run the JSON DataGrid application locally, follow these simple steps:

### Prerequisites

- **Node.js**: Ensure you have a recent version of Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd json-datagrid
    ```

2.  **Install Dependencies**:
    Use `npm` to install the necessary packages.
    ```bash
    npm install
    ```

### Running the Application

Once the dependencies are installed, you can start the development server:

```bash
npm run dev
```

The application will be up and running at `http://localhost:5173`.

## Project Structure

This project is built with **React**, **Vite**, and **TypeScript**. Here's a brief overview of the key files and directories:

-   `src/`
    -   `App.tsx`: The main application component that manages the overall layout and state.
    -   `index.tsx`: The entry point of the React application.
    -   `components/`: Contains all the reusable React components.
        -   `Header.tsx`: The top navigation bar with the title and theme toggle.
        -   `InputPanel.tsx`: The left-side panel for JSON input and controls.
        -   `ViewPanel.tsx`: The right-side panel that houses the different data views.
        -   `CodeView.tsx`, `TreeView.tsx`, `TableView.tsx`: The components for each specific data view.
        -   `Icons.tsx`: A collection of SVG icon components used throughout the UI.
    -   `hooks/`: Home to the custom React hooks.
        -   `useJsonProcessor.ts`: A hook to parse and validate the raw JSON string.
        -   `useLocalStorage.ts`: A hook to persist state in the browser's local storage.
    -   `utils.ts`: A collection of utility functions, such as data conversion (e.g., to CSV/YAML) and file download helpers.
    -   `types.ts`: Defines the TypeScript types and interfaces used across the application.
-   `public/`: Static assets that are served directly.
-   `package.json`: Lists the project's dependencies and scripts.
-   `vite.config.ts`: The configuration file for the Vite build tool.

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please feel free to:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or fix.
3.  **Make your changes** and commit them with a clear message.
4.  **Push your branch** and submit a pull request.

---
Built with ❤️ and a passion for clean, accessible data.
