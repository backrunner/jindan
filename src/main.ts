import { nanoid } from 'nanoid';
import { CONFIG_VERSION, ResourceNodeTagNames, StyleNodeTagNames } from './constants';
import { JinDanConfigManager } from './modules/config';
import { JinDanEndpoint } from './modules/endpoint';
import { ApplicationInfo } from './types/app';
import { JinDanConstructorOptions } from './types/options';
import { DocumentNodeCache } from './utils/cache';
import { addResourcesToDocument } from './utils/resource';

interface ExtendedWindow extends Window {
  __jindan_script_exec_handler?: Record<string, (e: Event) => void>;
}

class JinDan {
  private options: JinDanConstructorOptions;
  private observer: MutationObserver;
  private appInfo: ApplicationInfo;
  private async: boolean;
  // modules
  private endpoint: JinDanEndpoint;
  private configManager: JinDanConfigManager;
  private nodeCache: DocumentNodeCache;

  public constructor(options: JinDanConstructorOptions) {
    this.options = options;
    this.appInfo = options.appInfo;
    this.async = this.options.remote.async !== false;
    this.nodeCache = new DocumentNodeCache();
    this.observer = new MutationObserver(this.async ? this.nodeBlockCheck.bind(this) : this.holdNodeParsing.bind(this));
    // If not in the async mode, we should observe the dom immediately
    if (!this.async) {
      this.observer.observe(document.documentElement);
    }
    this.configManager = new JinDanConfigManager({
      local: {
        replacement: {
          enabled: false,
        },
        remote: options.remote,
        fallback: options.fallback,
        version: CONFIG_VERSION,
      },
    });
    this.endpoint = new JinDanEndpoint({
      ...options.remote,
      appInfo: options.appInfo,
      fallbackOptions: options.fallback.endpoint,
      configManager: this.configManager,
    });
    this.checkLatestConfig();
  }

  private preventScriptExec(node: HTMLScriptElement) {
    // Bypass the flagged node
    if (node.getAttribute('jindan-ignore')) {
      return;
    }
    const scriptId = nanoid();
    const extendedWindow = window as ExtendedWindow;
    if (!extendedWindow.__jindan_script_exec_handler) {
      extendedWindow.__jindan_script_exec_handler = {};
    }
    // Set mark for script tag
    node.type = 'jindan/blocked';
    node.setAttribute('data-jindan-id', scriptId);
    // For Firefox, we need to use event to prevent script execution
    const beforeScriptExecuteListener = function (event: Event) {
      // Prevent only marked scripts from executing
      if (node.getAttribute('type') === 'jindan/blocked') event.preventDefault();
      node.removeEventListener('beforescriptexecute', beforeScriptExecuteListener);
    };
    extendedWindow.__jindan_script_exec_handler[scriptId] = beforeScriptExecuteListener;
    node.addEventListener('beforescriptexecute', beforeScriptExecuteListener);
  }

  private restoreBlockedScript(node: HTMLScriptElement) {
    const scriptId = node.getAttribute('data-jindan-id');
    if (!scriptId) {
      throw new Error('Script node does not have a proper id.');
    }
    const extendedWindow = window as ExtendedWindow;
    const eventHandler = extendedWindow.__jindan_script_exec_handler?.[scriptId];
    if (eventHandler) {
      node.removeEventListener('beforescriptexecute', eventHandler);
    }
    node.type = 'text/javascript';
  }

  private removeStyleNode(node: HTMLStyleElement) {
    if (node.getAttribute('jindan-ignore')) {
      return;
    }
    node.parentElement?.removeChild(node);
  }

  private removeLinkNode(node: HTMLLinkElement) {
    if (node.rel !== 'stylesheet' || node.getAttribute('jindan-ignore')) {
      return;
    }
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

  private nodeBlockCheck(mutations: MutationRecord[]) {
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

  private holdNodeParsing(mutations: MutationRecord[]) {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        const elementNode = node as HTMLElement;
        // If is script node, just prevent execution
        if (elementNode.tagName === 'script') {
          this.preventScriptExec(elementNode as HTMLScriptElement);
        }
        if (StyleNodeTagNames.includes(elementNode.tagName)) {
          this.nodeCache.add(elementNode);
          // Remove the node from the DOM tree temporarily
          elementNode.remove();
        }
      });
    });
  }

  private async checkLatestConfig() {
    await this.endpoint.request(this.options.remote.fetchOptions);
    const shouldReplacement = this.configManager.getReplacementEnabled();
    if (shouldReplacement) {
      this.replaceResources();
      // Nodes in local cache and which has been blocked will not be used anymore, so we need do a clear.
      this.nodeCache.clear();
      // TODO: clear useless script node
      return;
    }
    // Firstly, release all the resources node
    const cachedNodes = this.nodeCache.getCachedNodes();
    cachedNodes.forEach((cachedNode) => {
      const { node, originalParent } = cachedNode;
      if (originalParent) {
        originalParent.appendChild(node);
      } else {
        document.body.appendChild(node);
      }
    });
    // Execute all the script node
    const blockedScriptNodes = document.querySelectorAll('script[type="jindan/blocked"]');
    blockedScriptNodes.forEach((blockedScriptNode) => {
      this.restoreBlockedScript(blockedScriptNode as HTMLScriptElement);
    });
    // Clear local node cache
    this.nodeCache.clear();
  }

  /**
   * Do the resource replacement
   */
  private replaceResources() {
    addResourcesToDocument(this.configManager.getResourceManifest());
  }
}

export default JinDan;

// Interface exports
export * from './types/options';
