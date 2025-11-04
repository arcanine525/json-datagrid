
export type Theme = 'light' | 'dark';

export type ViewMode = 'code' | 'tree' | 'table';

export type TreeNodeData = {
  key: string;
  value: any;
  level: number;
  path: string;
};
