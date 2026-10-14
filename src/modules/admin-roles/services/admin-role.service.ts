import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { AppLoggerService } from '#/core/logger/index.js';
import {
  ADMIN_PERMISSION_CATALOGUE,
  missingPermissions,
  type AdminGrant,
  type AdminPermissionKey,
} from '#/core/permissions/index.js';
import {
  isUniqueConstraintViolation,
  TransactionService,
} from '#/infrastructure/database/prisma/index.js';

import { AdminRoleGrantsCacheService } from '../cache/admin-role-grants.cache.js';
import { AdminUserRolesCacheService } from '../cache/admin-user-roles.cache.js';
import {
  ADMIN_ROLE_ERROR_MESSAGE,
  ADMIN_ROLES_LOG_CONTEXT,
  MAX_ADMIN_ROLES,
} from '../constants/index.js';
import type {
  AdminPermissionCatalogue,
  AdminRole,
  AdminRoleList,
  CreateAdminRoleInput,
  UpdateAdminRoleInput,
} from '../dto/index.js';
import { toAdminRole, toPermissionCatalogueItem } from '../mappers/index.js';
import {
  AdminRoleRepository,
  AdminUserRoleRepository,
  type AdminRoleRow,
} from '../repositories/index.js';

/**
 * Admin roles as the platform team manages them. The workspace role service's
 * rules on the admin plane, in the same order — role within the caller,
 * restricted, beyond the caller, name, limit — without default roles or a
 * tenant. A role holding a permission the caller lacks is read-only to them.
 *
 * `role.manage` is restricted, so only a super admin reaches the writes and
 * both caller checks are satisfied by construction. They still run: they are
 * what keeps this safe the day that key stops being restricted.
 */
@Injectable()
export class AdminRoleService {
  constructor(
    private readonly roleRepo: AdminRoleRepository,
    private readonly userRoleRepo: AdminUserRoleRepository,
    private readonly grantsCache: AdminRoleGrantsCacheService,
    private readonly userRolesCache: AdminUserRolesCacheService,
    private readonly transaction: TransactionService,
    private readonly logger: AppLoggerService,
  ) {}

  /** The catalogue a role editor shows — from code, not the mirror table. */
  listPermissions(): AdminPermissionCatalogue {
    return { items: ADMIN_PERMISSION_CATALOGUE.entries.map(toPermissionCatalogueItem) };
  }

  /** By name. */
  async findSummaries(roleIds: readonly string[]): Promise<{ id: string; name: string }[]> {
    return this.roleRepo.findSummaries(roleIds);
  }

  async list(): Promise<AdminRoleList> {
    return { items: await this.present(await this.roleRepo.findAll()) };
  }

  async get(roleId: string): Promise<AdminRole> {
    const [role] = await this.present([await this.findOrThrow(roleId)]);

    return role as AdminRole;
  }

  async create(caller: AdminGrant, input: CreateAdminRoleInput): Promise<AdminRole> {
    const permissions = this.checkGrantable(caller, input.permissions);

    const roleId = await this.withNameConflict(() =>
      this.transaction.run(async () => {
        await this.assertNameFree(input.name);

        if ((await this.roleRepo.count()) >= MAX_ADMIN_ROLES) {
          throw new UnprocessableEntityException(ADMIN_ROLE_ERROR_MESSAGE.LIMIT_REACHED);
        }

        const role = await this.roleRepo.create({
          name: input.name,
          description: input.description ?? null,
        });

        await this.roleRepo.replaceGrants(role.id, [...permissions]);

        return role.id;
      }),
    );

    this.log('createRole', roleId);

    return this.get(roleId);
  }

  async update(
    caller: AdminGrant,
    roleId: string,
    input: UpdateAdminRoleInput,
  ): Promise<AdminRole> {
    const role = await this.findOrThrow(roleId);

    await this.assertRoleWithinCaller(caller, role.id);

    const permissions =
      input.permissions === undefined ? undefined : this.checkGrantable(caller, input.permissions);

    await this.withNameConflict(() =>
      this.transaction.run(async () => {
        if (input.name !== undefined) {
          await this.assertNameFree(input.name, role.id);
        }

        await this.roleRepo.update(role.id, {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        });

        if (permissions !== undefined) {
          await this.roleRepo.replaceGrants(role.id, [...permissions]);

          await this.transaction.runAfterCommit(() => this.grantsCache.invalidate(role.id));
        }
      }),
    );

    this.log('updateRole', role.id);

    return this.get(role.id);
  }

  async remove(caller: AdminGrant, roleId: string): Promise<null> {
    const role = await this.findOrThrow(roleId);

    await this.assertRoleWithinCaller(caller, role.id);

    await this.transaction.run(async () => {
      const holders = await this.userRoleRepo.findHolderIds(role.id);

      await this.userRoleRepo.removeRoleFromAll(role.id);

      await this.roleRepo.delete(role.id);

      await this.transaction.runAfterCommit(async () => {
        await this.grantsCache.invalidate(role.id);

        await this.userRolesCache.invalidate(holders);
      });
    });

    this.log('deleteRole', role.id);

    return null;
  }

  private checkGrantable(
    caller: AdminGrant,
    requested: readonly string[],
  ): ReadonlySet<AdminPermissionKey> {
    const permissions = ADMIN_PERMISSION_CATALOGUE.narrow(requested);

    if ([...permissions].some((key) => ADMIN_PERMISSION_CATALOGUE.restrictedKeys.has(key))) {
      throw new UnprocessableEntityException(ADMIN_ROLE_ERROR_MESSAGE.RESTRICTED_PERMISSION);
    }

    assertWithinCaller(caller, permissions, ADMIN_ROLE_ERROR_MESSAGE.BEYOND_CALLER);

    return permissions;
  }

  /** The role's grants as they authorize, so a stale or restricted row does not lock it. */
  private async assertRoleWithinCaller(caller: AdminGrant, roleId: string): Promise<void> {
    const grants = await this.roleRepo.findGrants([roleId]);

    const current = [...ADMIN_PERMISSION_CATALOGUE.narrow(grants.get(roleId) ?? [])].filter(
      (key) => !ADMIN_PERMISSION_CATALOGUE.restrictedKeys.has(key),
    );

    assertWithinCaller(caller, current, ADMIN_ROLE_ERROR_MESSAGE.ROLE_BEYOND_CALLER);
  }

  private async assertNameFree(name: string, exceptId?: string): Promise<void> {
    if (await this.roleRepo.isNameTaken(name, exceptId)) {
      throw new ConflictException(ADMIN_ROLE_ERROR_MESSAGE.NAME_TAKEN);
    }
  }

  /** Two requests that pass the name check together meet at the unique index; the loser gets the same 409. */
  private async withNameConflict<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(ADMIN_ROLE_ERROR_MESSAGE.NAME_TAKEN);
      }

      throw error;
    }
  }

  private async findOrThrow(roleId: string): Promise<AdminRoleRow> {
    const role = await this.roleRepo.findById(roleId);

    if (role === null) {
      throw new NotFoundException(ADMIN_ROLE_ERROR_MESSAGE.NOT_FOUND);
    }

    return role;
  }

  /** Permissions and admin counts for every role, in two queries. */
  private async present(rows: readonly AdminRoleRow[]): Promise<AdminRole[]> {
    const ids = rows.map((row) => row.id);

    if (ids.length === 0) {
      return [];
    }

    const [grants, counts] = await Promise.all([
      this.roleRepo.findGrants(ids),
      this.userRoleRepo.countHolders(ids),
    ]);

    return rows.map((row) =>
      toAdminRole(
        row,
        [...ADMIN_PERMISSION_CATALOGUE.narrow(grants.get(row.id) ?? [])],
        counts.get(row.id) ?? 0,
      ),
    );
  }

  /** The audit trail until there is one: which role changed, never its permissions. */
  private log(operation: string, roleId: string): void {
    this.logger.info('Admin role changed', {
      context: ADMIN_ROLES_LOG_CONTEXT,
      operation,
      metadata: { roleId },
    });
  }
}

function assertWithinCaller(
  caller: AdminGrant,
  keys: Iterable<AdminPermissionKey>,
  message: string,
): void {
  if (missingPermissions(keys, caller.permissions).length > 0) {
    throw new ForbiddenException(message);
  }
}
