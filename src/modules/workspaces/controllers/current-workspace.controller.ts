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

import { CurrentWorkspaceDto, type CurrentWorkspace } from '../dto/index.js';
import { WorkspaceService } from '../services/workspace.service.js';

/**
 * The workspace in `x-workspace-id` — singular, because the header has
 * already said which one. A tenant controller: no `@NoWorkspace()`.
 */
@ApiTags(WORKSPACES_API_TAG.name)
@ApiWorkspaceIdHeader()
@Controller({ path: 'workspace', version: ApiVersion.V1 })
export class CurrentWorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * Get Current Workspace
   */
  @Get()
  @AnyMember()
  @ApiOperation({
    summary: 'Get the current workspace',
    description:
      'The workspace named in `x-workspace-id`, with the caller’s membership in it. The call a ' +
      'client makes after choosing a workspace.',
  })
  @ApiSuccessResponse(CurrentWorkspaceDto, {
    status: HttpStatus.OK,
    description: 'The workspace and the caller’s membership.',
  })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('Workspace fetched successfully')
  @ApiDeviceIdHeader()
  getCurrentWorkspace(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentMemberId() memberId: string,
    @CurrentUserId() userId: string,
  ): Promise<CurrentWorkspace> {
    return this.workspaceService.getCurrentWorkspace(workspaceId, memberId, userId);
  }
}
