import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { ApiVersion, WORKSPACES_API_TAG } from '#/shared/constants/index.js';

import {
  ListMyWorkspacesQueryDto,
  MyWorkspacePageDto,
  type MyWorkspacePage,
} from '../dto/index.js';
import { WorkspaceService } from '../services/workspace.service.js';

/**
 * The caller's workspaces, across all of them — so this lives under
 * `users/me`, not under a workspace, and will not take `x-workspace-id`.
 */
@ApiTags(WORKSPACES_API_TAG.name)
@Controller({ path: 'users/me/workspaces', version: ApiVersion.V1 })
export class MyWorkspacesController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * List My Workspaces
   */
  @Get()
  @ApiOperation({
    summary: 'List my workspaces',
    description:
      'The workspaces the signed-in user belongs to, for the workspace switcher: most recently ' +
      'opened first, then newest joined. Includes workspaces awaiting review and rejected ones, ' +
      'so their status can be shown; only `ACTIVE` ones can be opened.',
  })
  @ApiSuccessResponse(MyWorkspacePageDto, {
    status: HttpStatus.OK,
    description: 'One page of workspaces. A page past the end is an empty `items`, not an error.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED)
  @ResponseMessage('Workspaces fetched successfully')
  @ApiDeviceIdHeader()
  listMyWorkspaces(
    @CurrentUserId() userId: string,
    @Query() query: ListMyWorkspacesQueryDto,
  ): Promise<MyWorkspacePage> {
    return this.workspaceService.listMyWorkspaces(userId, query);
  }
}
