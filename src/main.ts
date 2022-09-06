import { CONFIG_VERSION, ResourceNodeTagNames } from './constants';
import { JinDanConfigManager } from './modules/config';
import { JinDanEndpoint } from './modules/endpoint';
import { ApplicationInfo } from './types/app';
import { JinDanConstructorOptions } from './types/options';
import { addResourcesToDocument } from './utils/resource';

class JinDan {
  private options: JinDanConstructorOptions;
  private observer: MutationObserver;
  private appInfo: ApplicationInfo;
  private async: boolean;
  // modules
  private endpoint: JinDanEndpoint;
  private configManager: JinDanConfigManager;

  public constructor(options: JinDanConstructorOptions) {
    this.options = options;
    this.appInfo = options.appInfo;
    this.async = this.options.remote.async !== false;
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
    // Set mark for script tag
    node.type = 'jindan/blocked';
    // For Firefox, we need to use event to prevent script execution
    const beforeScriptExecuteListener = function (event: Event) {
      // Prevent only marked scripts from executing
      if (node.getAttribute('type') === 'jindan/blocked') event.preventDefault();
      node.removeEventListener('beforescriptexecute', beforeScriptExecuteListener);
    };
    node.addEventListener('beforescriptexecute', beforeScriptExecuteListener);
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
    // TODO: hold the parsing of all related nodes
  }

  private async checkLatestConfig() {
    await this.endpoint.request(this.options.remote.fetchOptions);
    const shouldReplacement = this.configManager.getReplacementEnabled();
    if (shouldReplacement) {
      this.replaceResources();
      return;
    }
    // TODO: release all the resources
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
