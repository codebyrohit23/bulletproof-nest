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

import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessMessageResponse,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import {
  ADMIN_PERMISSION,
  CurrentAdminGrant,
  RequireAdminPermission,
  type AdminGrant,
} from '#/core/permissions/index.js';
import { ParseIdPipe } from '#/core/validation/index.js';
import { ADMIN_ROLES_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import {
  AdminRoleDto,
  AdminRoleListDto,
  CreateAdminRoleDto,
  UpdateAdminRoleDto,
  type AdminRole,
  type AdminRoleList,
} from '../dto/index.js';
import { AdminRoleService } from '../services/admin-role.service.js';

/** Mounted under `admin/` — that path is what makes these admin-audience routes. */
@ApiTags(ADMIN_ROLES_API_TAG.name)
@Controller({ path: 'admin/roles', version: ApiVersion.V1 })
export class AdminRoleController {
  constructor(private readonly roleService: AdminRoleService) {}

  /**
   * List Roles
   */
  @Get()
  @RequireAdminPermission(ADMIN_PERMISSION.role.read)
  @ApiOperation({
    summary: 'List admin roles',
    description: 'Every admin role by name, with its permissions and how many admins hold it.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminRoleListDto, { status: HttpStatus.OK, description: 'Every role.' })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  @ResponseMessage('Roles fetched successfully')
  list(): Promise<AdminRoleList> {
    return this.roleService.list();
  }

  /**
   * Get Role
   */
  @Get(':id')
  @RequireAdminPermission(ADMIN_PERMISSION.role.read)
  @ApiOperation({ summary: 'Get one admin role' })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminRoleDto, { status: HttpStatus.OK, description: 'The role.' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('Role fetched successfully')
  get(@Param('id', ParseIdPipe) id: string): Promise<AdminRole> {
    return this.roleService.get(id);
  }

  /**
   * Create Role
   */
  @Post()
  @RequireAdminPermission(ADMIN_PERMISSION.role.manage)
  @ApiOperation({
    summary: 'Create an admin role',
    description:
      'Super admin only. Its permissions may not include a super-admin-only one — creating ' +
      'admins, assigning roles, managing roles.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminRoleDto, { status: HttpStatus.CREATED, description: 'The new role.' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Role created successfully')
  create(
    @CurrentAdminGrant() caller: AdminGrant,
    @Body() body: CreateAdminRoleDto,
  ): Promise<AdminRole> {
    return this.roleService.create(caller, body);
  }

  /**
   * Update Role
   */
  @Patch(':id')
  @RequireAdminPermission(ADMIN_PERMISSION.role.manage)
  @ApiOperation({
    summary: 'Update an admin role',
    description:
      'Super admin only. Changes only the fields sent; `permissions` replaces the whole set, and ' +
      'every admin holding the role has the new set on their next request.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminRoleDto, {
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
    @CurrentAdminGrant() caller: AdminGrant,
    @Param('id', ParseIdPipe) id: string,
    @Body() body: UpdateAdminRoleDto,
  ): Promise<AdminRole> {
    return this.roleService.update(caller, id, body);
  }

  /**
   * Delete Role
   */
  @Delete(':id')
  @RequireAdminPermission(ADMIN_PERMISSION.role.manage)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an admin role',
    description:
      'Super admin only. Removes the role from every admin who holds it — their other roles stay ' +
      '— and deletes it.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessMessageResponse({ status: HttpStatus.OK, description: 'The role was deleted.' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('Role deleted successfully')
  remove(
    @CurrentAdminGrant() caller: AdminGrant,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<null> {
    return this.roleService.remove(caller, id);
  }
}
