import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SeedConfig } from './seed.interface.js';

@Injectable()
export class SeedConfigService {
  private readonly seed: SeedConfig;

  constructor(config: ConfigService) {
    this.seed = config.getOrThrow<SeedConfig>('seed');
  }

  get adminEmail(): string | undefined {
    return this.seed.adminEmail;
  }

  get adminName(): string {
    return this.seed.adminName;
  }
}
