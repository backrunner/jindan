export interface JinDanManifestItem {
  tagName: 'script' | 'style' | 'link';
  fileName?: string;
  content?: string; // If is pure style tag, the content will be the value of this property
  integrity?: string;
  targetParent?: 'head' | 'body'; // Insert to body by default
  attributes?: Record<string, string>;
}

export type JinDanManifest = JinDanManifestItem[];
