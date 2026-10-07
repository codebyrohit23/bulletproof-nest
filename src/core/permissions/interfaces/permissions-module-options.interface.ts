import type { ModuleMetadata } from '@nestjs/common';

export interface PermissionsModuleOptions {
  readonly imports: NonNullable<ModuleMetadata['imports']>;
}
