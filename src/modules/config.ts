import { ConfigManagerOptions, JinDanConfig } from '../types/config';
import { Logger } from '../utils/logger';
import { mergeWith } from '../utils/merge';
import { CONFIG_VERSION } from '../constants';
import { pickOneFromGroup } from '../utils/random';
import { formatFallbackDomain } from '../utils/string';
import { composeOTPDomains } from '../utils/otp';

const REMOTE_CONFIG_STORE_KEY = '__jindan_remote_config';

const logger = new Logger('ConfigManager');

export class JinDanConfigManager {
  public static getStoredRemoteConfig() {
    let storedRemoteConfig: Partial<JinDanConfig> = {};
    try {
      const storedRemoteConfigRaw = window.localStorage.getItem(REMOTE_CONFIG_STORE_KEY);
      if (storedRemoteConfigRaw) {
        storedRemoteConfig = JSON.parse(storedRemoteConfigRaw);
      }
    } catch (err) {
      logger.error(err);
      return null;
    }
    return storedRemoteConfig;
  }

  public static getStoredRemoteConfigMeta() {
    const storedRemoteConfig = JinDanConfigManager.getStoredRemoteConfig();
    if (storedRemoteConfig) {
      return {
        version: storedRemoteConfig.version,
        createTime: storedRemoteConfig.createTime,
      };
    }
    return null;
  }

  private config?: JinDanConfig;

  public constructor(opts: ConfigManagerOptions) {
    this.initConfig(opts.local);
  }

  /**
   *
   * @param localConfig
   */
  public async initConfig(localConfig: JinDanConfig) {
    const storedRemoteConfig = JinDanConfigManager.getStoredRemoteConfig();
    // Merge remote config to local config which transformed from the local options
    this.config = mergeWith(localConfig, storedRemoteConfig);
  }

  /**
   * Store the remote config to the local
   * @param config The config downloaded from the remote endpoint
   * @param immediate Should the remote config be merged to the local immediately
   */
  public async setupRemoteConfig(config: Partial<JinDanConfig>, immediate = false) {
    const latestCreateTime = Date.now();
    window.localStorage.setItem(
      REMOTE_CONFIG_STORE_KEY,
      JSON.stringify({
        ...config,
        version: CONFIG_VERSION,
        createTime: latestCreateTime,
      }),
    );
    if (immediate) {
      this.config = mergeWith(this.config, config);
    }
  }

  /**
   * Get if JinDan should do the replacement
   */
  public getReplacementEnabled() {
    return !!this.config?.replacement.enabled;
  }

  /**
   * Get the resource replacement base url
   */
  public async getReplacementBaseUrl() {
    // Resource fallback is different from the endpoint, the result should be single.
    if (!this.config?.fallback?.resource?.otp?.enabled) {
      const fallbackDomains = this.config?.fallback?.resource?.domains;
      if (!fallbackDomains || !Array.isArray(fallbackDomains)) {
        throw new Error('No suitable fallback domains available.');
      }
      return formatFallbackDomain(pickOneFromGroup(fallbackDomains));
    }
    // If OTP enabled, compose domains with OTP
    const otpDomains = await composeOTPDomains(this.config.fallback.resource.otp);
    return formatFallbackDomain(pickOneFromGroup(otpDomains));
  }

  public getResourceManifest() {
    return this.config?.replacement.manifest || [];
  }
}
