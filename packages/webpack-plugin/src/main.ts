import { JinDanConstructorOptions } from 'jindan-types';
import { Compiler } from 'webpack';
import { RawSource } from 'webpack-sources';
import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';

const PLUGIN_NAME = 'JindanWebpackPlugin';

export interface JinDanWebpackPluginOptions {
  path?: string;
  injectRawContent?: boolean;
  options: JinDanConstructorOptions;
}

interface ExHtmlTagObject extends HtmlTagObject {
  closeTag?: boolean;
}

export default class JinDanWebpackPlugin {
  private readonly options: JinDanWebpackPluginOptions;
  private scriptPath: string;
  private scriptContent: string;

  public constructor(options: JinDanWebpackPluginOptions) {
    this.options = options;
    this.scriptPath = path.resolve(__dirname, './jindan.js');
    if (!fs.existsSync(this.scriptPath)) {
      throw new Error('Cannot locate the script file.');
    }
    this.scriptContent = fs.readFileSync(this.scriptPath, 'utf-8');
  }

  public apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      // inject html
      const hook =
        (compilation.hooks as any).htmlWebpackPluginAlterAssetTags ||
        HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups;
      hook.tap(
        PLUGIN_NAME,
        (
          htmlData:
            | {
                headTags?: ExHtmlTagObject[];
                bodyTags?: ExHtmlTagObject[];
              } & {
                head?: ExHtmlTagObject[];
                body?: ExHtmlTagObject[];
              },
        ) => {
          const headTagsKey = htmlData.head ? 'head' : 'headTags';
          const headTags = htmlData[headTagsKey]!;
          // find the position of the first script and link tag
          const firstScriptTagPos = headTags.findIndex((tag) => tag.tagName === 'script');
          const firstLinkTagPos = headTags.findIndex((tag) => tag.tagName === 'link');
          // create jindan script tag
          const shouldInjected: HtmlTagObject[] = [];
          if (this.options.injectRawContent) {
            const jindanScriptTag: HtmlTagObject = {
              tagName: 'script',
              attributes: {
                type: 'text/javascript',
              },
              innerHTML: this.scriptContent,
              voidTag: false,
            };
            shouldInjected.push(jindanScriptTag);
          } else {
            if (!this.options.path) {
              throw new Error('Path should be specified.');
            }
            const jindanScriptTag: ExHtmlTagObject = {
              tagName: 'script',
              attributes: {
                type: 'text/javascript',
                src: this.options.path,
              },
              innerHTML: '',
              voidTag: false,
              closeTag: true,
            };
            shouldInjected.push(jindanScriptTag);
          }
          // generate jindan execution script tag
          const { options: jindanConstructorOptions } = this.options;
          const executionScript = `(function () { var jindan = new window.JinDan(${JSON.stringify(
            jindanConstructorOptions,
          )}); window.__jindan_intance__ = jindan; })();`.trim();
          const executionScriptTag: ExHtmlTagObject = {
            tagName: 'script',
            attributes: {
              type: 'text/javascript',
            },
            innerHTML: executionScript,
            voidTag: false,
            closeTag: true,
          };
          shouldInjected.push(executionScriptTag);
          // inject to head tag
          let insertPos;
          if (firstScriptTagPos >= 0 && firstLinkTagPos >= 0) {
            insertPos = Math.min(firstScriptTagPos, firstLinkTagPos);
          } else {
            insertPos = firstScriptTagPos >= 0 ? firstScriptTagPos : firstLinkTagPos;
          }
          if (insertPos >= 0) {
            headTags.splice(insertPos, 0, ...shouldInjected);
          } else {
            headTags.push(...shouldInjected);
          }
          return htmlData;
        },
      );
    });

    // emit asset file if needed
    compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {
      if (this.options.path && !/^https?:\/\//.test(this.options.path) && !this.options.injectRawContent) {
        compilation.assets[this.formatRelativePath(this.options.path)] = new RawSource(this.scriptContent);
      }
    });
  }

  private formatRelativePath(path: string) {
    let formattedPath = path;
    formattedPath = formattedPath.replace(/^\.?[\\\/]?/, '');
    formattedPath = formattedPath.replace('/$', '');
    if (!formattedPath.endsWith('.js')) {
      throw new Error('Invalid relative path, the path should be a path of JavaScript file.');
    }
    return path;
  }
}
