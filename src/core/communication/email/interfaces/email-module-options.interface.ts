import type { ModuleMetadata } from '@nestjs/common';

export interface EmailModuleOptions {
  readonly imports: NonNullable<ModuleMetadata['imports']>;
}
