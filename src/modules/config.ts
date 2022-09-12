import { ConfigManagerOptions, JinDanConfig } from '../types/config';
import { JinDanDatabase } from './db';
import { Logger } from '../utils/logger';
import { mergeWith } from '../utils/merge';
import { CONFIG_VERSION } from '../constants';
import { pickOneFromGroup } from '../utils/random';
import { formatFallbackDomain } from '../utils/string';
import { composeOTPDomains } from '../utils/otp';

const logger = new Logger('ConfigManager');

export class JinDanConfigManager {
  private db: JinDanDatabase;
  private config?: JinDanConfig;

  public constructor(opts: ConfigManagerOptions) {
    this.db = new JinDanDatabase({
      ...opts.database,
      version: CONFIG_VERSION,
    });
    this.initConfig(opts.local);
  }

  /**
   *
   * @param localConfig
   */
  public async initConfig(localConfig: JinDanConfig) {
    let remoteConfig: Partial<JinDanConfig> = {};
    try {
      if (!this.db.isOpen()) {
        throw new Error('Database is not opened.');
      }
      const storedRemoteConfig = await this.db.config
        .where({
          version: CONFIG_VERSION,
        })
        .toArray();
      if (storedRemoteConfig.length > 0) {
        storedRemoteConfig.sort((a, b) => b.create_time - a.create_time);
        remoteConfig = storedRemoteConfig[0].config;
      }
    } catch (err) {
      logger.error(err);
    }
    // Merge remote config to local config which transformed from the local options
    this.config = mergeWith(localConfig, remoteConfig);
  }

  /**
   * Store the remote config to the local
   * @param config The config downloaded from the remote endpoint
   * @param immediate Should the remote config be merged to the local immediately
   */
  public async setupRemoteConfig(config: Partial<JinDanConfig>, immediate = false) {
    const latestCreateTime = Date.now();
    await this.db.config.add({
      config,
      version: CONFIG_VERSION,
      create_time: latestCreateTime,
    });
    if (immediate) {
      this.config = mergeWith(this.config, config);
    }
    // Try to remove the useless config in the local database
    this.cleanOutdatedConfig(latestCreateTime);
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

  /**
   * Remove outdated config
   */
  private async cleanOutdatedConfig(lastestCreatedTime: number) {
    const outdatedConfig = await this.db.config.where('create_time').below(lastestCreatedTime).toArray();
    await this.db.config.bulkDelete(outdatedConfig.map((item) => item.id as number));
  }
}
