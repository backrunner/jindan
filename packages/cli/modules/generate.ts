import * as cheerio from 'cheerio';
import { JinDanManifest } from '../../../src/types/manifest';

const formatFileName = (fileName: string) => {
  if (!fileName.includes('/')) return fileName;
  const lastSlashIdx = fileName.lastIndexOf('/');
  const lastPart = fileName.slice(lastSlashIdx + 1);
  const queryIdx = lastPart.indexOf('?');
  if (queryIdx >= 0) {
    return lastPart;
  }
  return lastPart.slice(0, queryIdx);
};

const getScriptTagHandler = (manifest: JinDanManifest, targetParent: 'head' | 'body') => {
  return (index, el) => {
    if (el.attribs['jindan-ignore']) {
      return;
    }
    manifest.push({
      tagName: 'script',
      fileName: formatFileName(el.attribs.src),
      targetParent,
      attributes: el.attribs,
    });
  };
};

const getLinkTagHandler = (manifest: JinDanManifest, targetParent: 'head' | 'body') => {
  return (index, el) => {
    const rel = el.attribs.rel;
    if (rel !== 'stylesheet' || el.attribs['jindan-ignore']) {
      return;
    }
    manifest.push({
      tagName: 'link',
      fileName: formatFileName(el.attribs.href),
      targetParent,
      attributes: el.attribs,
    });
  };
};

const getStyleTagHandler = ($: cheerio.CheerioAPI, manifest, targetParent: 'head' | 'body') => {
  return (index, el: cheerio.Element) => {
    const content = $(el).html();
    if (el.attribs['jindan-ignore'] || !content) {
      return;
    }
    manifest.push({
      tagName: 'style',
      content,
      targetParent,
      attributes: el.attribs,
    });
  };
};

export const generateManifest = async (htmlContent: string) => {
  const manifest: JinDanManifest = [];
  const $ = cheerio.load(htmlContent);
  // find head and body tag
  const head = $('head');
  const body = $('body');
  // process head tags
  const scriptHeadTags = head.find('script');
  if (scriptHeadTags.length > 0) {
    scriptHeadTags.each(getScriptTagHandler(manifest, 'head'));
  }
  const linkHeadTags = head.find('link');
  if (linkHeadTags.length > 0) {
    linkHeadTags.each(getLinkTagHandler(manifest, 'head'));
  }
  const styleHeadTags = head.find('style');
  if (styleHeadTags.length > 0) {
    styleHeadTags.each(getStyleTagHandler($, manifest, 'head'));
  }
  // process body tags
  const scriptBodyTags = body.find('script');
  if (scriptBodyTags.length > 0) {
    scriptBodyTags.each(getScriptTagHandler(manifest, 'body'));
  }
  const linkBodyTags = body.find('link');
  if (linkBodyTags.length > 0) {
    linkBodyTags.each(getLinkTagHandler(manifest, 'body'));
  }
  const styleBodyTags = body.find('style');
  if (styleBodyTags.length > 0) {
    styleBodyTags.each(getStyleTagHandler($, manifest, 'body'));
  }
  return manifest;
};
