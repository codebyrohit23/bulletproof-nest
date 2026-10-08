import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentAdminId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { AnyAdmin } from '#/core/permissions/index.js';
import { ADMIN_PROFILE_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import { AdminAccessDto, type AdminAccess } from '../dto/index.js';
import { AdminAccessViewService } from '../services/admin-access-view.service.js';

/** Mounted under `admin/` — that path is what makes these admin-audience routes. */
@ApiTags(ADMIN_PROFILE_API_TAG.name)
@Controller({ path: 'admin/me', version: ApiVersion.V1 })
export class AdminAccessController {
  constructor(private readonly accessView: AdminAccessViewService) {}

  /**
   * Get My Access
   */
  @Get('access')
  @AnyAdmin()
  @ApiOperation({
    summary: 'Get what the signed-in admin may do',
    description:
      'The admin’s roles and permission keys. The console shows or hides UI from ' +
      '`permissions`, and refetches in the background to pick up role changes.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminAccessDto, {
    status: HttpStatus.OK,
    description: 'The admin’s roles and permissions.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  @ResponseMessage('Access fetched successfully')
  getAccess(@CurrentAdminId() adminId: string): Promise<AdminAccess> {
    return this.accessView.getAccess(adminId);
  }
}
