export interface JinDanManiFestItem {
  resourceType: 'script' | 'style';
  fileName: string;
  integrity?: string;
}

export type JinDanManifest = JinDanManiFestItem[];
