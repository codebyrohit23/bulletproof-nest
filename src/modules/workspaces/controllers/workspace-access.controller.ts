import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentMemberId, CurrentUserId, CurrentWorkspaceId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
  ApiWorkspaceIdHeader,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { AnyMember } from '#/core/permissions/index.js';
import { ApiVersion, WORKSPACES_API_TAG } from '#/shared/constants/index.js';

import { WorkspaceAccessDto, type WorkspaceAccess } from '../dto/index.js';
import { WorkspaceAccessViewService } from '../services/workspace-access-view.service.js';

@ApiTags(WORKSPACES_API_TAG.name)
@ApiWorkspaceIdHeader()
@Controller({ path: 'workspace', version: ApiVersion.V1 })
export class WorkspaceAccessController {
  constructor(private readonly accessView: WorkspaceAccessViewService) {}

  /**
   * Get My Access
   */
  @Get('access')
  @AnyMember()
  @ApiOperation({
    summary: 'Get what the caller may do in the current workspace',
    description:
      'The caller’s roles and permission keys in the workspace named in `x-workspace-id`. A ' +
      'client shows or hides UI from `permissions`, and refetches in the background to pick up ' +
      'role changes.',
  })
  @ApiSuccessResponse(WorkspaceAccessDto, {
    status: HttpStatus.OK,
    description: 'The caller’s roles and permissions.',
  })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('Access fetched successfully')
  @ApiDeviceIdHeader()
  getAccess(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentMemberId() memberId: string,
    @CurrentUserId() userId: string,
  ): Promise<WorkspaceAccess> {
    return this.accessView.getAccess({ workspaceId, memberId, userId });
  }
}
