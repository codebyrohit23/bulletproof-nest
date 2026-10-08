import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentAdminId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { ADMIN_PERMISSION, RequireAdminPermission } from '#/core/permissions/index.js';
import { ParseIdPipe } from '#/core/validation/index.js';
import { ADMIN_WORKSPACES_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import {
  AdminApproveWorkspaceDto,
  AdminListWorkspacesQueryDto,
  AdminRejectWorkspaceDto,
  AdminWorkspaceDetailDto,
  AdminWorkspacePageDto,
  type AdminWorkspaceDetail,
  type AdminWorkspacePage,
} from '../dto/index.js';
import { AdminWorkspaceService } from '../services/admin-workspace.service.js';

/**
 * Mounted under `admin/` — that path is what makes these admin-audience routes.
 *
 * One route per action, so that admin permissions can attach one to each:
 * reading the list is not the same grant as deciding a review.
 */
@ApiTags(ADMIN_WORKSPACES_API_TAG.name)
@Controller({ path: 'admin/workspaces', version: ApiVersion.V1 })
export class AdminWorkspaceController {
  constructor(private readonly adminWorkspaceService: AdminWorkspaceService) {}

  /**
   * List Workspaces
   */
  @Get()
  @RequireAdminPermission(ADMIN_PERMISSION.workspace.read)
  @ApiOperation({
    summary: 'List workspaces',
    description:
      'Every workspace on the platform, one page at a time. `status=PENDING_APPROVAL` with ' +
      '`order=asc` is the review queue, oldest first.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminWorkspacePageDto, {
    status: HttpStatus.OK,
    description: 'One page of workspaces. A page past the end is an empty `items`, not an error.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED)
  @ResponseMessage('Workspaces fetched successfully')
  listWorkspaces(@Query() query: AdminListWorkspacesQueryDto): Promise<AdminWorkspacePage> {
    return this.adminWorkspaceService.listWorkspaces(query);
  }

  /**
   * Get Workspace
   */
  @Get(':id')
  @RequireAdminPermission(ADMIN_PERMISSION.workspace.read)
  @ApiOperation({
    summary: 'Get a workspace',
    description: 'One workspace with its owner, review history and active member count.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminWorkspaceDetailDto, {
    status: HttpStatus.OK,
    description: 'The workspace.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('Workspace fetched successfully')
  getWorkspace(@Param('id', ParseIdPipe) id: string): Promise<AdminWorkspaceDetail> {
    return this.adminWorkspaceService.getWorkspace(id);
  }

  /**
   * Approve Workspace
   */
  @Post(':id/approve')
  @RequireAdminPermission(ADMIN_PERMISSION.workspace.review)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a workspace',
    description:
      'Moves a workspace from `PENDING_APPROVAL` to `ACTIVE`, so its members can use it. ' +
      'Only a pending workspace can be approved; if another admin decided first, this is a 409.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminWorkspaceDetailDto, {
    status: HttpStatus.OK,
    description: 'The workspace after approval.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Workspace approved successfully')
  approveWorkspace(
    @CurrentAdminId() adminId: string,
    @Param('id', ParseIdPipe) id: string,
    @Body() body: AdminApproveWorkspaceDto,
  ): Promise<AdminWorkspaceDetail> {
    return this.adminWorkspaceService.approveWorkspace(adminId, id, body);
  }

  /**
   * Reject Workspace
   */
  @Post(':id/reject')
  @RequireAdminPermission(ADMIN_PERMISSION.workspace.review)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a workspace',
    description:
      'Moves a workspace from `PENDING_APPROVAL` to `REJECTED`, which is final. The note is ' +
      'shown to the owner, so write the reason in words they can act on.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminWorkspaceDetailDto, {
    status: HttpStatus.OK,
    description: 'The workspace after rejection.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Workspace rejected successfully')
  rejectWorkspace(
    @CurrentAdminId() adminId: string,
    @Param('id', ParseIdPipe) id: string,
    @Body() body: AdminRejectWorkspaceDto,
  ): Promise<AdminWorkspaceDetail> {
    return this.adminWorkspaceService.rejectWorkspace(adminId, id, body);
  }
}
