import { JinDanManifest, JinDanManifestItem } from 'jindan-types';

const formatResourceFileName = (fileName: string) => {
  return fileName.replace(/^\//, '');
};

const setAttributes = (node: HTMLElement, attributes: Record<string, string>) => {
  Object.keys(attributes).forEach((key) => {
    node.setAttribute(key, attributes[key]);
  });
};

const addScriptTagToDocument = (resource: JinDanManifestItem, baseUrl: string) => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  if (resource.content) {
    script.innerHTML = resource.content;
  } else if (resource.fileName) {
    script.src = `${baseUrl}/${formatResourceFileName(resource.fileName)}`;
  }
  if (resource.integrity) {
    script.setAttribute('integrity', resource.integrity);
  }
  if (resource.attributes) {
    setAttributes(script, resource.attributes);
  }
  const appendTarget = resource.targetParent || 'body';
  document[appendTarget].appendChild(script);
};

const addLinkTagToDocument = (resource: JinDanManifestItem, baseUrl: string) => {
  if (!resource.fileName) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${baseUrl}/${formatResourceFileName(resource.fileName)}`;
  if (resource.attributes) {
    setAttributes(link, resource.attributes);
  }
  const appendTarget = resource.targetParent || 'body';
  document[appendTarget].appendChild(link);
};

const addStyleTagToDocument = (resource: JinDanManifestItem, baseUrl: string) => {
  if (!resource.content) {
    // Ignore the empty content script tag
    return;
  }
  const style = document.createElement('style');
  style.innerHTML = resource.content;
  if (resource.attributes) {
    setAttributes(style, resource.attributes);
  }
  const appendTarget = resource.targetParent || 'body';
  document[appendTarget].appendChild(style);
};

export const addResourcesToDocument = (manifest: JinDanManifest, baseUrl: string) => {
  manifest.forEach((item) => {
    switch (item.tagName) {
      case 'script':
        addScriptTagToDocument(item, baseUrl);
        break;
      case 'link':
        addLinkTagToDocument(item, baseUrl);
        break;
      case 'style':
        addStyleTagToDocument(item, baseUrl);
        break;
    }
  });
};
