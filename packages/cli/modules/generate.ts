import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';
import { JinDanManifest } from '../../../src/types/manifest';
import { getIntegrity } from '../utils/integrity';

const formatFileName = (fileName: string) => {
  if (!fileName.includes('/')) return fileName;
  const lastSlashIdx = fileName.lastIndexOf('/');
  const lastPart = fileName.slice(lastSlashIdx + 1);
  const queryIdx = lastPart.indexOf('?');
  if (queryIdx >= 0) {
    return lastPart.slice(0, queryIdx);
  }
  return lastPart;
};

const getHtmlBaseDirPath = (htmlPath: string) => {
  return path.dirname(htmlPath);
};

const getRelativePath = (path: string) => {
  let res = path;
  const httpProtoTester = /^https?:\/\//;
  if (httpProtoTester.test(path)) {
    res = res.replace(httpProtoTester, '');
    const firstSlashIdx = res.indexOf('/');
    // e.g.: https://pwp.app/js/a.js => js/a.js
    res = res.slice(firstSlashIdx + 1);
  } else if (res.startsWith('/')) {
    res = res.slice(1);
  }
  return res;
};

const getIntegrityInfo = (htmlPath: string, relativePath: string) => {
  const htmlBaseDirPath = getHtmlBaseDirPath(htmlPath);
  const targetFilePath = path.resolve(htmlBaseDirPath, relativePath);
  if (!fs.existsSync(targetFilePath)) {
    return;
  }
  const integrity = getIntegrity(targetFilePath);
  if (!integrity) {
    return;
  }
  return {
    integrity,
  };
};

const getScriptTagHandler = (manifest: JinDanManifest, htmlPath: string, targetParent: 'head' | 'body') => {
  return (index, el) => {
    if (typeof el.attribs['jindan-ignore'] !== 'undefined' || !el.attribs?.src) {
      return;
    }
    const relativePath = getRelativePath(el.attribs.src);
    const integrityInfo = getIntegrityInfo(htmlPath, relativePath);
    manifest.push({
      tagName: 'script',
      fileName: formatFileName(el.attribs.src),
      targetParent,
      attributes: el.attribs,
      ...(integrityInfo || null),
    });
  };
};

const getLinkTagHandler = (manifest: JinDanManifest, targetParent: 'head' | 'body') => {
  return (index, el) => {
    const rel = el.attribs.rel;
    if (rel !== 'stylesheet' || typeof el.attribs['jindan-ignore'] !== 'undefined') {
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
    if (typeof el.attribs['jindan-ignore'] !== 'undefined' || !content) {
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

export const generateManifest = async ({ content, htmlPath }: { content: string; htmlPath: string }) => {
  const manifest: JinDanManifest = [];
  const $ = cheerio.load(content);
  // find head and body tag
  const head = $('head');
  const body = $('body');
  // process head tags
  const scriptHeadTags = head.find('script');
  if (scriptHeadTags.length > 0) {
    scriptHeadTags.each(getScriptTagHandler(manifest, htmlPath, 'head'));
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
    scriptBodyTags.each(getScriptTagHandler(manifest, htmlPath, 'body'));
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
