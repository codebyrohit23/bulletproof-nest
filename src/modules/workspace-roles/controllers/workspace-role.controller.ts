import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentWorkspaceId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessMessageResponse,
  ApiSuccessResponse,
  ApiWorkspaceIdHeader,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import {
  CurrentWorkspaceGrant,
  RequirePermission,
  WORKSPACE_PERMISSION,
  type WorkspaceGrant,
} from '#/core/permissions/index.js';
import { ParseIdPipe } from '#/core/validation/index.js';
import { ApiVersion, WORKSPACE_ROLES_API_TAG } from '#/shared/constants/index.js';

import {
  CreateWorkspaceRoleDto,
  UpdateWorkspaceRoleDto,
  WorkspaceRoleDto,
  WorkspaceRoleListDto,
  type WorkspaceRole,
  type WorkspaceRoleList,
} from '../dto/index.js';
import { WorkspaceRoleService } from '../services/workspace-role.service.js';

@ApiTags(WORKSPACE_ROLES_API_TAG.name)
@ApiWorkspaceIdHeader()
@Controller({ path: 'workspace/roles', version: ApiVersion.V1 })
export class WorkspaceRoleController {
  constructor(private readonly roleService: WorkspaceRoleService) {}

  /**
   * List Roles
   */
  @Get()
  @RequirePermission(WORKSPACE_PERMISSION.role.read)
  @ApiOperation({
    summary: 'List the workspace’s roles',
    description:
      'The default roles every workspace has, then this workspace’s custom roles by name, each ' +
      'with its permissions and how many members hold it.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(WorkspaceRoleListDto, { status: HttpStatus.OK, description: 'Every role.' })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND)
  @ResponseMessage('Roles fetched successfully')
  list(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentWorkspaceGrant() caller: WorkspaceGrant,
  ): Promise<WorkspaceRoleList> {
    return this.roleService.list(workspaceId, caller);
  }

  /**
   * Get Role
   */
  @Get(':id')
  @RequirePermission(WORKSPACE_PERMISSION.role.read)
  @ApiOperation({
    summary: 'Get one role',
    description: 'A default role or one of this workspace’s.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(WorkspaceRoleDto, { status: HttpStatus.OK, description: 'The role.' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('Role fetched successfully')
  get(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentWorkspaceGrant() caller: WorkspaceGrant,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<WorkspaceRole> {
    return this.roleService.get(workspaceId, caller, id);
  }

  /**
   * Create Role
   */
  @Post()
  @RequirePermission(WORKSPACE_PERMISSION.role.manage)
  @ApiOperation({
    summary: 'Create a custom role',
    description:
      'A role this workspace defines. Its permissions may not include an owner-only one, nor one ' +
      'the caller does not hold. To vary a default role, send its permissions here.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(WorkspaceRoleDto, {
    status: HttpStatus.CREATED,
    description: 'The new role.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.CONFLICT,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('Role created successfully')
  create(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentWorkspaceGrant() caller: WorkspaceGrant,
    @Body() body: CreateWorkspaceRoleDto,
  ): Promise<WorkspaceRole> {
    return this.roleService.create(workspaceId, caller, body);
  }

  /**
   * Update Role
   */
  @Patch(':id')
  @RequirePermission(WORKSPACE_PERMISSION.role.manage)
  @ApiOperation({
    summary: 'Update a custom role',
    description:
      'Changes only the fields sent. `permissions` replaces the whole set, and every member ' +
      'holding the role has the new set on their next request. A role with a permission the ' +
      'caller does not hold cannot be changed by them; nor can default roles.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(WorkspaceRoleDto, {
    status: HttpStatus.OK,
    description: 'The role after the update.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Role updated successfully')
  update(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentWorkspaceGrant() caller: WorkspaceGrant,
    @Param('id', ParseIdPipe) id: string,
    @Body() body: UpdateWorkspaceRoleDto,
  ): Promise<WorkspaceRole> {
    return this.roleService.update(workspaceId, caller, id, body);
  }

  /**
   * Delete Role
   */
  @Delete(':id')
  @RequirePermission(WORKSPACE_PERMISSION.role.manage)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a custom role',
    description:
      'Removes the role from every member who holds it — their other roles stay — and deletes ' +
      'it. Refused while a pending invitation grants it, and when the role has a permission the ' +
      'caller does not. Default roles cannot be deleted.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessMessageResponse({ status: HttpStatus.OK, description: 'The role was deleted.' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Role deleted successfully')
  remove(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentWorkspaceGrant() caller: WorkspaceGrant,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<null> {
    return this.roleService.remove(workspaceId, caller, id);
  }
}
