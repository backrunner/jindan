import Dexie from 'dexie';
import { DatabaseOptions } from '../main';
import { JinDanConfig } from '../types/config';

export interface IConfig {
  id?: number;
  config: Partial<JinDanConfig>;
  version: number;
  create_time: number;
}

export class JinDanDatabase extends Dexie {
  public config!: Dexie.Table<IConfig, number>;
  public constructor(databaseOptions: DatabaseOptions & { version: number }) {
    super(databaseOptions.name || 'jindan');
    this.version(databaseOptions.version).stores({
      config: '++id, config, version, create_time, modified_time',
    });
  }
}
