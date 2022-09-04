import { JinDanConfigManager } from '../modules/config';
import { ApplicationInfo } from './app';
import { JinDanConfig } from './config';
import { EndpointFallbackOptions, RemoteOptions } from './options';

export interface EndPointConstructorOpts extends RemoteOptions {
  appInfo: ApplicationInfo;
  fallbackOptions: EndpointFallbackOptions;
  configManager: JinDanConfigManager;
  token?: string;
}

export interface EndpointResponse {
  code: number;
  message?: string;
  data: Partial<JinDanConfig>;
}
