import type { ModuleMetadata } from '@nestjs/common';

export interface TenancyModuleOptions {
  /** The module that provides `WorkspaceAccessResolver`. */
  readonly imports: NonNullable<ModuleMetadata['imports']>;
}
