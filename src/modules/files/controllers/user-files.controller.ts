import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { NoWorkspace } from '#/core/tenancy/index.js';
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
import { userUploader } from '../utils/index.js';

/** A user's own files, outside any workspace — their avatar. */
@ApiTags(FILES_API_TAG.name)
@Controller({ path: 'users/me/files', version: ApiVersion.V1 })
export class UserFilesController {
  constructor(private readonly uploads: FileUploadService) {}

  /**
   * Start Upload
   */
  @Post('uploads')
  @NoWorkspace()
  @RateLimit(...FILE_RATE_LIMIT.UPLOAD)
  @ApiOperation({
    summary: 'Start uploading a personal file',
    description:
      'Returns where to send the file. `PUT` it to `upload.url` with `upload.headers`, then call ' +
      '`complete`. Accepts the `user` purposes only — `USER_AVATAR`.',
  })
  @ApiSuccessResponse(StartedUploadDto, {
    status: HttpStatus.CREATED,
    description: 'The pending file and where to upload it.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Upload started')
  @ApiDeviceIdHeader()
  start(@CurrentUserId() userId: string, @Body() body: StartUploadDto): Promise<StartedUpload> {
    return this.uploads.start(userUploader(userId), body);
  }

  /**
   * Complete Upload
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @NoWorkspace()
  @ApiOperation({
    summary: 'Confirm a personal upload',
    description:
      'Call after the `PUT` succeeds. Checks the stored file and queues it for processing. ' +
      'Safe to repeat.',
  })
  @ApiSuccessResponse(FileViewDto, { status: HttpStatus.OK, description: 'The confirmed file.' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Upload completed')
  @ApiDeviceIdHeader()
  complete(
    @CurrentUserId() userId: string,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<FileView> {
    return this.uploads.complete(userUploader(userId), id);
  }

  /**
   * Get File
   */
  @Get(':id')
  @NoWorkspace()
  @ApiOperation({
    summary: 'Get one of my personal uploads',
    description: 'Poll after `complete` until `status` is `READY` or `REJECTED`.',
  })
  @ApiSuccessResponse(FileViewDto, { status: HttpStatus.OK, description: 'The file.' })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('File fetched successfully')
  @ApiDeviceIdHeader()
  get(@CurrentUserId() userId: string, @Param('id', ParseIdPipe) id: string): Promise<FileView> {
    return this.uploads.get(userUploader(userId), id);
  }
}
