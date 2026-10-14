import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { AppLoggerService } from '#/core/logger/index.js';
import {
  missingPermissions,
  WORKSPACE_PERMISSION,
  WORKSPACE_PERMISSION_CATALOGUE,
  type WorkspaceGrant,
  type WorkspacePermissionKey,
} from '#/core/permissions/index.js';
import {
  isUniqueConstraintViolation,
  TransactionService,
} from '#/infrastructure/database/prisma/index.js';

import { WorkspaceMemberRolesCacheService } from '../cache/workspace-member-roles.cache.js';
import { WorkspaceRoleGrantsCacheService } from '../cache/workspace-role-grants.cache.js';
import {
  MAX_CUSTOM_ROLES,
  WORKSPACE_DEFAULT_ROLES,
  WORKSPACE_ROLE_ERROR_MESSAGE,
  WORKSPACE_ROLES_LOG_CONTEXT,
} from '../constants/index.js';
import type {
  CreateWorkspaceRoleInput,
  UpdateWorkspaceRoleInput,
  WorkspacePermissionCatalogue,
  WorkspaceRole,
  WorkspaceRoleList,
} from '../dto/index.js';
import type { WorkspaceRoleSummary } from '../interfaces/index.js';
import { toPermissionCatalogueItem, toWorkspaceRole } from '../mappers/index.js';
import {
  WorkspaceMemberRoleRepository,
  WorkspaceRoleRepository,
  type WorkspaceRoleRow,
} from '../repositories/index.js';

import { WorkspaceRoleGrantsService } from './workspace-role-grants.service.js';

const DEFAULT_ROLE_ORDER: readonly string[] = WORKSPACE_PERMISSION_CATALOGUE.defaultRoles;

/** A custom role may not take a default role's name, whatever the case. */
const DEFAULT_ROLE_NAMES: ReadonlySet<string> = new Set(
  Object.values(WORKSPACE_DEFAULT_ROLES).map((role) => role.name.toLowerCase()),
);

/**
 * Roles as a workspace manages them: list, read, create, edit, delete.
 *
 * Every write checks, in this order, so the message names the first rule a
 * request breaks: the role is editable (custom), the role as it stands is
 * within the caller, no permission is restricted, no permission is beyond the
 * caller, the name is free, the limit is not reached. The caller's permissions
 * are the grant the guard resolved for this request — the same answer it
 * authorised the route with.
 *
 * A role holding a permission the caller lacks is read-only to them — no
 * rename, no edit, no delete. Checking only the new set was the first design:
 * it let the caller strip a permission they never held from a role the owner
 * had built. Checking only the difference was rejected as two rules for the
 * client to mirror where this is one.
 *
 * Caches are invalidated after commit: a role's grants key when its
 * permissions change or it is deleted, and its holders' member-roles keys when
 * it is deleted.
 */
@Injectable()
export class WorkspaceRoleService {
  constructor(
    private readonly roleRepo: WorkspaceRoleRepository,
    private readonly memberRoleRepo: WorkspaceMemberRoleRepository,
    private readonly roleGrants: WorkspaceRoleGrantsService,
    private readonly grantsCache: WorkspaceRoleGrantsCacheService,
    private readonly memberRolesCache: WorkspaceMemberRolesCacheService,
    private readonly transaction: TransactionService,
    private readonly logger: AppLoggerService,
  ) {}

  /** The catalogue a role editor shows — from code, not the mirror table. */
  listPermissions(): WorkspacePermissionCatalogue {
    return { items: WORKSPACE_PERMISSION_CATALOGUE.entries.map(toPermissionCatalogueItem) };
  }

  /** Default roles first, in catalogue order, then custom roles by name. */
  async findSummaries(roleIds: readonly string[]): Promise<WorkspaceRoleSummary[]> {
    const roles = await this.roleRepo.findSummaries(roleIds);

    return roles.sort(compareRoles);
  }

  async list(workspaceId: string, caller: WorkspaceGrant): Promise<WorkspaceRoleList> {
    const rows = (await this.roleRepo.findVisible(workspaceId)).sort(compareRoles);

    return { items: await this.present(workspaceId, caller, rows) };
  }

  async get(workspaceId: string, caller: WorkspaceGrant, roleId: string): Promise<WorkspaceRole> {
    const row = await this.findOrThrow(workspaceId, roleId);

    const [role] = await this.present(workspaceId, caller, [row]);

    return role as WorkspaceRole;
  }

  async create(
    workspaceId: string,
    caller: WorkspaceGrant,
    input: CreateWorkspaceRoleInput,
  ): Promise<WorkspaceRole> {
    const permissions = this.checkGrantable(caller, input.permissions);

    const roleId = await this.withNameConflict(() =>
      this.transaction.run(async () => {
        await this.assertNameFree(workspaceId, input.name);

        if ((await this.roleRepo.countCustom(workspaceId)) >= MAX_CUSTOM_ROLES) {
          throw new UnprocessableEntityException(WORKSPACE_ROLE_ERROR_MESSAGE.LIMIT_REACHED);
        }

        const role = await this.roleRepo.createCustom(workspaceId, {
          name: input.name,
          description: input.description ?? null,
        });

        await this.roleRepo.addGrants(role.id, [...permissions]);

        return role.id;
      }),
    );

    this.log('createRole', workspaceId, roleId);

    return this.get(workspaceId, caller, roleId);
  }

  async update(
    workspaceId: string,
    caller: WorkspaceGrant,
    roleId: string,
    input: UpdateWorkspaceRoleInput,
  ): Promise<WorkspaceRole> {
    const role = await this.findEditableOrThrow(workspaceId, roleId);

    await this.assertRoleWithinCaller(caller, role.id);

    const permissions =
      input.permissions === undefined ? undefined : this.checkGrantable(caller, input.permissions);

    await this.withNameConflict(() =>
      this.transaction.run(async () => {
        if (input.name !== undefined) {
          await this.assertNameFree(workspaceId, input.name, role.id);
        }

        await this.roleRepo.updateCustom(role.id, {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        });

        if (permissions !== undefined) {
          await this.roleRepo.replaceGrants(role.id, [...permissions]);

          await this.transaction.runAfterCommit(() => this.grantsCache.invalidate(role.id));
        }
      }),
    );

    this.log('updateRole', workspaceId, role.id);

    return this.get(workspaceId, caller, role.id);
  }

  async remove(workspaceId: string, caller: WorkspaceGrant, roleId: string): Promise<null> {
    const role = await this.findEditableOrThrow(workspaceId, roleId);

    await this.assertRoleWithinCaller(caller, role.id);

    if ((await this.roleRepo.countPendingInvitations(workspaceId, role.id)) > 0) {
      throw new ConflictException(WORKSPACE_ROLE_ERROR_MESSAGE.PENDING_INVITATIONS);
    }

    await this.transaction.run(async () => {
      const holders = await this.memberRoleRepo.findHolderIds(workspaceId, role.id);

      await this.memberRoleRepo.removeRoleFromAll(workspaceId, role.id);

      await this.roleRepo.deleteCustom(role.id);

      await this.transaction.runAfterCommit(async () => {
        await this.grantsCache.invalidate(role.id);

        await this.memberRolesCache.invalidate(workspaceId, holders);
      });
    });

    this.log('deleteRole', workspaceId, role.id);

    return null;
  }

  /**
   * Restricted first, then beyond the caller — so a request for an owner-only
   * key is told why, not merely that it was refused.
   */
  private checkGrantable(
    caller: WorkspaceGrant,
    requested: readonly string[],
  ): ReadonlySet<WorkspacePermissionKey> {
    const permissions = WORKSPACE_PERMISSION_CATALOGUE.narrow(requested);

    if ([...permissions].some((key) => WORKSPACE_PERMISSION_CATALOGUE.restrictedKeys.has(key))) {
      throw new UnprocessableEntityException(WORKSPACE_ROLE_ERROR_MESSAGE.RESTRICTED_PERMISSION);
    }

    assertWithinCaller(caller, permissions, WORKSPACE_ROLE_ERROR_MESSAGE.BEYOND_CALLER);

    return permissions;
  }

  /**
   * The role's grants as they authorize — known, unrestricted keys — so a stale
   * or wrongly restricted row, which grants nothing, does not lock it either.
   */
  private async assertRoleWithinCaller(caller: WorkspaceGrant, roleId: string): Promise<void> {
    const grants = await this.roleRepo.findGrants([roleId]);

    assertWithinCaller(
      caller,
      authorizingKeys(grants.get(roleId) ?? []),
      WORKSPACE_ROLE_ERROR_MESSAGE.ROLE_BEYOND_CALLER,
    );
  }

  private async assertNameFree(
    workspaceId: string,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    if (
      DEFAULT_ROLE_NAMES.has(name.toLowerCase()) ||
      (await this.roleRepo.isNameTaken(workspaceId, name, exceptId))
    ) {
      throw new ConflictException(WORKSPACE_ROLE_ERROR_MESSAGE.NAME_TAKEN);
    }
  }

  /** Two requests that pass the name check together meet at the unique index; the loser gets the same 409. */
  private async withNameConflict<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(WORKSPACE_ROLE_ERROR_MESSAGE.NAME_TAKEN);
      }

      throw error;
    }
  }

  private async findOrThrow(workspaceId: string, roleId: string): Promise<WorkspaceRoleRow> {
    const role = await this.roleRepo.findVisibleById(workspaceId, roleId);

    if (role === null) {
      throw new NotFoundException(WORKSPACE_ROLE_ERROR_MESSAGE.NOT_FOUND);
    }

    return role;
  }

  private async findEditableOrThrow(
    workspaceId: string,
    roleId: string,
  ): Promise<WorkspaceRoleRow> {
    const role = await this.findOrThrow(workspaceId, roleId);

    if (role.isSystem) {
      throw new UnprocessableEntityException(WORKSPACE_ROLE_ERROR_MESSAGE.NOT_EDITABLE);
    }

    return role;
  }

  /**
   * Permissions — default roles from the catalogue, custom from their grants —
   * and member counts, in two queries. `editable` is the write rules answered
   * for this caller, so a client shows edit controls from one field.
   */
  private async present(
    workspaceId: string,
    caller: WorkspaceGrant,
    rows: readonly WorkspaceRoleRow[],
  ): Promise<WorkspaceRole[]> {
    const ids = rows.map((row) => row.id);

    const customIds = rows.filter((row) => !row.isSystem).map((row) => row.id);

    const [grants, counts] = await Promise.all([
      customIds.length > 0 ? this.roleRepo.findGrants(customIds) : new Map<string, string[]>(),
      this.memberRoleRepo.countHolders(workspaceId, ids),
    ]);

    const canManage = caller.permissions.has(WORKSPACE_PERMISSION.role.manage);

    return rows.map((row) => {
      if (row.isSystem && row.key !== null) {
        return toWorkspaceRole(row, {
          permissions: [...this.roleGrants.defaultRolePermissions(row.key)],
          memberCount: counts.get(row.id) ?? 0,
          editable: false,
        });
      }

      const stored = grants.get(row.id) ?? [];

      return toWorkspaceRole(row, {
        permissions: [...WORKSPACE_PERMISSION_CATALOGUE.narrow(stored)],
        memberCount: counts.get(row.id) ?? 0,
        editable:
          canManage && missingPermissions(authorizingKeys(stored), caller.permissions).length === 0,
      });
    });
  }

  /** The audit trail until there is one: who changed which role, never the permissions themselves. */
  private log(operation: string, workspaceId: string, roleId: string): void {
    this.logger.info('Workspace role changed', {
      context: WORKSPACE_ROLES_LOG_CONTEXT,
      operation,
      metadata: { workspaceId, roleId },
    });
  }
}

/** A stored grant as it authorizes: known keys, restricted ones dropped — the resolver's reading. */
function authorizingKeys(stored: readonly string[]): WorkspacePermissionKey[] {
  return [...WORKSPACE_PERMISSION_CATALOGUE.narrow(stored)].filter(
    (key) => !WORKSPACE_PERMISSION_CATALOGUE.restrictedKeys.has(key),
  );
}

function assertWithinCaller(
  caller: WorkspaceGrant,
  keys: Iterable<WorkspacePermissionKey>,
  message: string,
): void {
  if (missingPermissions(keys, caller.permissions).length > 0) {
    throw new ForbiddenException(message);
  }
}

function compareRoles(
  a: { isSystem: boolean; key: string | null; name: string },
  b: { isSystem: boolean; key: string | null; name: string },
): number {
  if (a.isSystem !== b.isSystem) {
    return a.isSystem ? -1 : 1;
  }

  if (a.isSystem) {
    return DEFAULT_ROLE_ORDER.indexOf(a.key ?? '') - DEFAULT_ROLE_ORDER.indexOf(b.key ?? '');
  }

  return a.name.localeCompare(b.name);
}
