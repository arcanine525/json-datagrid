
/**
 * Represents the available themes for the application.
 */
export type Theme = 'light' | 'dark';

/**
 * Represents the different modes for viewing the JSON data.
 */
export type ViewMode = 'code' | 'tree' | 'table';

/**
 * Represents the data structure for a node in the TreeView component.
 * @property key - The key or index of the node.
 * @property value - The value of the node.
 * @property level - The nesting level of the node.
 * @property path - The unique path to the node from the root.
 */
export type TreeNodeData = {
  key: string;
  value: any;
  level: number;
  path: string;
};
