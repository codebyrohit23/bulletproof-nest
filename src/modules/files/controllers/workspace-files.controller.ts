import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUserId, CurrentWorkspaceId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
  ApiWorkspaceIdHeader,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { AnyMember } from '#/core/permissions/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { ParseIdPipe } from '#/core/validation/index.js';
import { ApiVersion, FILES_API_TAG } from '#/shared/constants/index.js';

import {
  FileViewDto,
  StartUploadDto,
  StartedUploadDto,
  type FileView,
  type StartedUpload,
} from '../dto/index.js';
import { FILE_RATE_LIMIT } from '../rate-limit/file-limits.constants.js';
import { FileUploadService } from '../services/index.js';
import { workspaceUploader } from '../utils/index.js';

/**
 * Files in the workspace named by `x-workspace-id` — its logo.
 *
 * `@AnyMember()`, not a permission: uploading authorizes nothing. The route
 * that attaches the file carries the permission — `PUT /workspace/logo`
 * requires `workspace.update`.
 */
@ApiTags(FILES_API_TAG.name)
@ApiWorkspaceIdHeader()
@Controller({ path: 'workspace/files', version: ApiVersion.V1 })
export class WorkspaceFilesController {
  constructor(private readonly uploads: FileUploadService) {}

  /**
   * Start Upload
   */
  @Post('uploads')
  @AnyMember()
  @RateLimit(...FILE_RATE_LIMIT.UPLOAD)
  @ApiOperation({
    summary: 'Start uploading a workspace file',
    description:
      'Returns where to send the file. `PUT` it to `upload.url` with `upload.headers`, then call ' +
      '`complete`. Accepts the `workspace` purposes only — `WORKSPACE_LOGO`. Counts against ' +
      'the workspace’s storage.',
  })
  @ApiSuccessResponse(StartedUploadDto, {
    status: HttpStatus.CREATED,
    description: 'The pending file and where to upload it.',
  })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Upload started')
  @ApiDeviceIdHeader()
  start(
    @CurrentUserId() userId: string,
    @CurrentWorkspaceId() workspaceId: string,
    @Body() body: StartUploadDto,
  ): Promise<StartedUpload> {
    return this.uploads.start(workspaceUploader(userId, workspaceId), body);
  }

  /**
   * Complete Upload
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @AnyMember()
  @ApiOperation({
    summary: 'Confirm a workspace upload',
    description:
      'Call after the `PUT` succeeds. Checks the stored file, counts it against the ' +
      'workspace’s storage and queues it for processing. Safe to repeat.',
  })
  @ApiSuccessResponse(FileViewDto, { status: HttpStatus.OK, description: 'The confirmed file.' })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Upload completed')
  @ApiDeviceIdHeader()
  complete(
    @CurrentUserId() userId: string,
    @CurrentWorkspaceId() workspaceId: string,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<FileView> {
    return this.uploads.complete(workspaceUploader(userId, workspaceId), id);
  }

  /**
   * Get File
   */
  @Get(':id')
  @AnyMember()
  @ApiOperation({
    summary: 'Get one of my uploads in this workspace',
    description: 'Poll after `complete` until `status` is `READY` or `REJECTED`.',
  })
  @ApiSuccessResponse(FileViewDto, { status: HttpStatus.OK, description: 'The file.' })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  @ResponseMessage('File fetched successfully')
  @ApiDeviceIdHeader()
  get(
    @CurrentUserId() userId: string,
    @CurrentWorkspaceId() workspaceId: string,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<FileView> {
    return this.uploads.get(workspaceUploader(userId, workspaceId), id);
  }
}
