import { ResourceNodeTagNames } from './constants';
import { JinDanConstructorOptions } from './types/options';

class JinDan {
  private options: JinDanConstructorOptions;
  private observer: MutationObserver;

  public constructor(options: JinDanConstructorOptions) {
    this.options = options;
    this.observer = new MutationObserver(this.mutationCallback.bind(this));
  }

  private preventScriptExec(node: HTMLScriptElement) {
    // Set mark for script tag
    node.type = 'javascript/blocked';
    // For Firefox, we need to use event to prevent script execution
    const beforeScriptExecuteListener = function (event: Event) {
      // Prevent only marked scripts from executing
      if (node.getAttribute('type') === 'javascript/blocked') event.preventDefault();
      node.removeEventListener('beforescriptexecute', beforeScriptExecuteListener);
    };
    node.addEventListener('beforescriptexecute', beforeScriptExecuteListener);
  }

  private removeStyleNode(node: HTMLStyleElement) {
    node.parentElement?.removeChild(node);
  }

  private removeLinkNode(node: HTMLLinkElement) {
    node.parentElement?.removeChild(node);
  }

  private preventNodeBehaviour(node: HTMLElement) {
    const foramttedNodeName = node.tagName.toLowerCase();
    switch (foramttedNodeName) {
      case 'script':
        this.preventScriptExec(node as HTMLScriptElement);
        break;
      case 'style':
        this.removeStyleNode(node as HTMLStyleElement);
        break;
      case 'link':
        this.removeLinkNode(node as HTMLLinkElement);
        break;
    }
  }

  private mutationCallback(mutations: MutationRecord[]) {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        if (!ResourceNodeTagNames.includes(node.nodeName.toLowerCase())) {
          return;
        }
        this.preventNodeBehaviour(node as HTMLElement);
      });
    });
  }
}

export default JinDan;

// Interface exports
export * from './types/options';
