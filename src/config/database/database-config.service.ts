import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // value import — required for DI metadata

import type { DatabaseConfig, PostgresConfig } from './database.interface.js';

@Injectable()
export class DatabaseConfigService {
  private readonly database: DatabaseConfig;

  constructor(config: ConfigService) {
    this.database = config.getOrThrow<DatabaseConfig>('database');
  }

  get postgres(): PostgresConfig {
    return this.database.postgres;
  }
}
