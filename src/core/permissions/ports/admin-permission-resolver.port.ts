import type { AdminGrant } from '../interfaces/index.js';

export abstract class AdminPermissionResolver {
  abstract resolve(adminId: string): Promise<AdminGrant | null>;
}
