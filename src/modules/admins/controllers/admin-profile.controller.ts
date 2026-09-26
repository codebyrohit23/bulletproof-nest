import { Body, Controller, Get, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentAdminId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { ADMIN_PROFILE_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import { AdminProfileDto, UpdateAdminProfileDto, type AdminProfile } from '../dto/index.js';
import { AdminService } from '../services/admin.service.js';

/** Mounted under `admin/` — that path is what makes these admin-audience routes. */
@ApiTags(ADMIN_PROFILE_API_TAG.name)
@Controller({ path: 'admin/me', version: ApiVersion.V1 })
export class AdminProfileController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get Profile
   */
  @Get()
  @ApiOperation({
    summary: 'Get the current admin profile',
    description: 'Returns the profile of the signed-in admin.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminProfileDto, {
    status: HttpStatus.OK,
    description: 'The profile of the signed-in admin.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('Profile fetched successfully')
  getProfile(@CurrentAdminId() adminId: string): Promise<AdminProfile> {
    return this.adminService.getProfile(adminId);
  }

  /**
   * Update Profile
   */
  @Patch()
  @ApiOperation({
    summary: 'Update the current admin profile',
    description:
      'Changes only the fields that are sent — at least one is required. `email` cannot be ' +
      'changed here. `displayName` is not derived from the name fields, so send it too if it ' +
      'should follow a rename.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminProfileDto, {
    status: HttpStatus.OK,
    description: 'The profile after the update.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('Profile updated successfully')
  updateProfile(
    @CurrentAdminId() adminId: string,
    @Body() body: UpdateAdminProfileDto,
  ): Promise<AdminProfile> {
    return this.adminService.updateProfile(adminId, body);
  }
}
