import { Body, Controller, Get, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { ApiVersion, USER_PROFILE_API_TAG } from '#/shared/constants/index.js';

import { UpdateProfileDto, UserProfileDto, type UserProfile } from '../dto/index.js';
import { UserService } from '../services/user.service.js';

@ApiTags(USER_PROFILE_API_TAG.name)
@Controller({ path: 'users/me', version: ApiVersion.V1 })
export class UserProfileController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get Profile
   */
  @Get()
  @ApiOperation({
    summary: 'Get the current profile',
    description: 'Returns the profile of the signed-in user.',
  })
  @ApiSuccessResponse(UserProfileDto, {
    status: HttpStatus.OK,
    description: 'The profile of the signed-in user.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('Profile fetched successfully')
  @ApiDeviceIdHeader()
  getProfile(): Promise<UserProfile> {
    return this.userService.getProfile();
  }

  /**
   * Update Profile
   */
  @Patch()
  @ApiOperation({
    summary: 'Update the current profile',
    description:
      'Changes only the fields that are sent — at least one is required. `displayName` is not ' +
      'derived from the name fields, so send it too if it should follow a rename.',
  })
  @ApiSuccessResponse(UserProfileDto, {
    status: HttpStatus.OK,
    description: 'The profile after the update.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('Profile updated successfully')
  @ApiDeviceIdHeader()
  updateProfile(@Body() body: UpdateProfileDto): Promise<UserProfile> {
    return this.userService.updateProfile(body);
  }
}
