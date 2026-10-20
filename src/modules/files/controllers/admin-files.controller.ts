import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentAdminId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { AnyAdmin } from '#/core/permissions/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { ParseIdPipe } from '#/core/validation/index.js';
import { ADMIN_FILES_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import {
  FileViewDto,
  StartUploadDto,
  StartedUploadDto,
  type FileView,
  type StartedUpload,
} from '../dto/index.js';
import { FILE_RATE_LIMIT } from '../rate-limit/file-limits.constants.js';
import { FileUploadService } from '../services/index.js';
import { adminUploader } from '../utils/index.js';

/** Mounted under `admin/` — that path is what makes these admin-audience routes. */
@ApiTags(ADMIN_FILES_API_TAG.name)
@Controller({ path: 'admin/me/files', version: ApiVersion.V1 })
export class AdminFilesController {
  constructor(private readonly uploads: FileUploadService) {}

  /**
   * Start Upload
   */
  @Post('uploads')
  @AnyAdmin()
  @RateLimit(...FILE_RATE_LIMIT.UPLOAD)
  @ApiOperation({
    summary: 'Start uploading an admin file',
    description:
      'Returns where to send the file. `PUT` it to `upload.url` with `upload.headers`, then call ' +
      '`complete`. Accepts the `admin` purposes only — `ADMIN_AVATAR`.',
  })
  @ApiDeviceIdHeader()
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
  start(@CurrentAdminId() adminId: string, @Body() body: StartUploadDto): Promise<StartedUpload> {
    return this.uploads.start(adminUploader(adminId), body);
  }

  /**
   * Complete Upload
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @AnyAdmin()
  @ApiOperation({
    summary: 'Confirm an admin upload',
    description:
      'Call after the `PUT` succeeds. Checks the stored file and queues it for processing. ' +
      'Safe to repeat.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(FileViewDto, { status: HttpStatus.OK, description: 'The confirmed file.' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  @ResponseMessage('Upload completed')
  complete(
    @CurrentAdminId() adminId: string,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<FileView> {
    return this.uploads.complete(adminUploader(adminId), id);
  }

  /**
   * Get File
   */
  @Get(':id')
  @AnyAdmin()
  @ApiOperation({
    summary: 'Get one of my admin uploads',
    description: 'Poll after `complete` until `status` is `READY` or `REJECTED`.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(FileViewDto, { status: HttpStatus.OK, description: 'The file.' })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('File fetched successfully')
  get(@CurrentAdminId() adminId: string, @Param('id', ParseIdPipe) id: string): Promise<FileView> {
    return this.uploads.get(adminUploader(adminId), id);
  }
}
