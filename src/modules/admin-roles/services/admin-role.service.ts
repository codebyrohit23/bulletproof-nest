import { Injectable } from '@nestjs/common';

import { AdminRoleRepository } from '../repositories/index.js';

/**
 * Admin roles as clients see them. Not on the guard's path, so it reads the
 * database directly, without a cache.
 */
@Injectable()
export class AdminRoleService {
  constructor(private readonly roleRepo: AdminRoleRepository) {}

  /** By name. */
  async findSummaries(roleIds: readonly string[]): Promise<{ id: string; name: string }[]> {
    return this.roleRepo.findSummaries(roleIds);
  }
}
