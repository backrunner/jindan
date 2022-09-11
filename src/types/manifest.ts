export interface JinDanManiFestItem {
  resourceType: 'script' | 'style';
  fileName: string;
  integrity?: string;
  targetParent?: 'head' | 'body'; // Insert to body by default
}

export type JinDanManifest = JinDanManiFestItem[];
