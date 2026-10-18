import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  StorageBucketsConfig,
  StorageConfig,
  StorageCredentialsConfig,
} from './storage.interface.js';

@Injectable()
export class StorageConfigService {
  private readonly storage: StorageConfig;

  constructor(config: ConfigService) {
    this.storage = config.getOrThrow<StorageConfig>('storage');
  }

  get endpoint(): string {
    return this.storage.endpoint;
  }

  get region(): string {
    return this.storage.region;
  }

  get credentials(): StorageCredentialsConfig {
    return this.storage.credentials;
  }

  get forcePathStyle(): boolean {
    return this.storage.forcePathStyle;
  }

  get requestTimeoutMs(): number {
    return this.storage.requestTimeoutMs;
  }

  get buckets(): StorageBucketsConfig {
    return this.storage.buckets;
  }

  get publicBaseUrl(): string {
    return this.storage.publicBaseUrl;
  }
}
