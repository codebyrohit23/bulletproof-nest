import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { AnyAdmin } from '#/core/permissions/index.js';
import { ADMIN_ROLES_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import { AdminPermissionCatalogueDto, type AdminPermissionCatalogue } from '../dto/index.js';
import { AdminRoleService } from '../services/admin-role.service.js';

/** Mounted under `admin/` — that path is what makes these admin-audience routes. */
@ApiTags(ADMIN_ROLES_API_TAG.name)
@Controller({ path: 'admin/permissions', version: ApiVersion.V1 })
export class AdminPermissionController {
  constructor(private readonly roleService: AdminRoleService) {}

  /**
   * List Permissions
   */
  @Get()
  @AnyAdmin()
  @ApiOperation({
    summary: 'List the permissions an admin role can grant',
    description:
      'Every permission in the admin catalogue, for a role editor. Group by `resource`; ' +
      'disable what is `restricted`, and what the caller does not hold in ' +
      '`GET /admin/me/access`.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminPermissionCatalogueDto, {
    status: HttpStatus.OK,
    description: 'The catalogue, in declaration order.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED)
  @ResponseMessage('Permissions fetched successfully')
  listPermissions(): AdminPermissionCatalogue {
    return this.roleService.listPermissions();
  }
}
