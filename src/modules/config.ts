import { ConfigManagerOptions, JinDanConfig } from '../types/config';
import { JinDanDatabase } from './db';
import { Logger } from '../utils/logger';

const logger = new Logger('ConfigManager');

const CONFIG_VERSION = 1;

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
        storedRemoteConfig.sort((a, b) => b.modified_time - a.modified_time);
        remoteConfig = storedRemoteConfig[0];
      }
    } catch (err) {
      logger.error(err);
    }
    // Merge remote config to local config which transformed from the local options
    const mergedRemoteConfig = {
      ...localConfig,
      ...remoteConfig,
    };
    this.config = mergedRemoteConfig;
  }
  /**
   * Store the remote config to the local
   * @param config The config downloaded from the remote endpoint
   * @param immediate Should the remote config be merged to the local immediately
   */
  public async setupRemoteConfig(config: Partial<JinDanConfig>, immediate = false) {
    // TODO: setup remote config
  }
  /**
   * Get if JinDan should do the replacement
   */
  public getReplacementEnabled() {
    return !!this.config?.replacement.enabled;
  }
}
