import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
  ApiWorkspaceIdHeader,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { AnyMember } from '#/core/permissions/index.js';
import { ApiVersion, WORKSPACE_ROLES_API_TAG } from '#/shared/constants/index.js';

import {
  WorkspacePermissionCatalogueDto,
  type WorkspacePermissionCatalogue,
} from '../dto/index.js';
import { WorkspaceRoleService } from '../services/workspace-role.service.js';

@ApiTags(WORKSPACE_ROLES_API_TAG.name)
@ApiWorkspaceIdHeader()
@Controller({ path: 'workspace/permissions', version: ApiVersion.V1 })
export class WorkspacePermissionController {
  constructor(private readonly roleService: WorkspaceRoleService) {}

  /**
   * List Permissions
   */
  @Get()
  @AnyMember()
  @ApiOperation({
    summary: 'List the permissions a role can grant',
    description:
      'Every permission in the workspace catalogue, for a role editor. Group by `resource`; ' +
      'disable what is `restricted`, and what the caller does not hold in ' +
      '`GET /workspace/access`.',
  })
  @ApiSuccessResponse(WorkspacePermissionCatalogueDto, {
    status: HttpStatus.OK,
    description: 'The catalogue, in declaration order.',
  })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('Permissions fetched successfully')
  @ApiDeviceIdHeader()
  listPermissions(): WorkspacePermissionCatalogue {
    return this.roleService.listPermissions();
  }
}
