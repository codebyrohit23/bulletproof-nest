import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { ApiVersion, WORKSPACES_API_TAG } from '#/shared/constants/index.js';

import { CreateWorkspaceDto, WorkspaceDto, type Workspace } from '../dto/index.js';
import { WORKSPACE_RATE_LIMIT } from '../rate-limit/workspace-limits.constants.js';
import { WorkspaceService } from '../services/workspace.service.js';

@ApiTags(WORKSPACES_API_TAG.name)
@Controller({ path: 'workspaces', version: ApiVersion.V1 })
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * Create Workspace
   */
  @Post()
  @RateLimit(...WORKSPACE_RATE_LIMIT.CREATE)
  @ApiOperation({
    summary: 'Create a workspace',
    description:
      'Creates a workspace owned by the signed-in user, who becomes its first member. It ' +
      'starts `PENDING_APPROVAL` and cannot be used until a LeadFlow admin approves it. A user ' +
      'may have one workspace awaiting review at a time. `slug` is derived from `name` when ' +
      'omitted, with a short suffix if that is taken.',
  })
  @ApiSuccessResponse(WorkspaceDto, {
    status: HttpStatus.CREATED,
    description: 'The new workspace.',
  })
  @ApiErrorResponses(
    HttpStatus.CONFLICT,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Workspace created successfully')
  @ApiDeviceIdHeader()
  createWorkspace(
    @CurrentUserId() userId: string,
    @Body() body: CreateWorkspaceDto,
  ): Promise<Workspace> {
    return this.workspaceService.createWorkspace(userId, body);
  }
}
