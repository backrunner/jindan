import { JinDanManifest } from './manifest';
import { FallbackOptions, RemoteOptions } from './options';

export interface ConfigManagerOptions {
  /**
   * The config which is transformed from the local options
   */
  local: JinDanConfig;
}

type FallbackConfig = FallbackOptions;
type RemoteConfig = RemoteOptions;

export interface ReplacementConfig {
  /**
   * If enabled, JinDan will block all the existed resources and use the one from fallback.
   */
  enabled: boolean;
  /**
   * All the resources that JinDan will be loaded
   */
  manifest?: JinDanManifest;
}

/**
 * Defined all configuration of JinDan
 */
export interface JinDanConfig {
  /**
   *
   */
  replacement: ReplacementConfig;
  /**
   * The same as the local options, it can be override by the remote one
   */
  remote?: RemoteConfig;
  /**
   * The same as the local options, it can be override by the remote one
   */
  fallback?: FallbackConfig;
  /**
   * The version of this config, usally the same as the database structure version
   */
  version?: number;
  /**
   * If the configuration is fetched from remote, it will contain a timestamp of the fetch.
   */
  createTime?: number;
}
