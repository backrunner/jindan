import { CommonHtmlKeyTagNames } from '../constants';

export interface JinDanCachedDOMNode {
  node: HTMLElement;
  originalParent: HTMLElement | null;
}

export class DocumentNodeCache {
  private cachedNodes: JinDanCachedDOMNode[] = [];

  public add(node: HTMLElement) {
    this.cachedNodes.push({
      node,
      originalParent: this.getNodeParent(node),
    });
  }

  public getCachedNodes(): JinDanCachedDOMNode[] {
    return this.cachedNodes;
  }

  public clear() {
    while (this.cachedNodes.length) {
      this.cachedNodes.shift();
    }
  }

  private getNodeParent(node: HTMLElement) {
    if (node.parentElement) {
      if (!CommonHtmlKeyTagNames.includes(node.parentElement.tagName)) {
        return document.body;
      }
      return node.parentElement;
    }
    return null;
  }
}
