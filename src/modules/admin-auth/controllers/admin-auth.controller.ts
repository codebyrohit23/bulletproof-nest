import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { Public } from '#/core/auth/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { ADMIN_AUTH_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import { AdminAuthResultDto, AdminLoginDto, type AdminAuthResult } from '../dto/index.js';
import { ADMIN_AUTH_RATE_LIMIT } from '../rate-limit/admin-auth-limits.constants.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminTokenDeliveryService } from '../services/admin-token-delivery.service.js';

@ApiTags(ADMIN_AUTH_API_TAG.name)
@Controller({ path: 'admin/auth', version: ApiVersion.V1 })
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly delivery: AdminTokenDeliveryService,
  ) {}

  /**
   * Admin Login
   */
  @Post('login')
  @Public()
  @RateLimit(...ADMIN_AUTH_RATE_LIMIT.LOGIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in to the admin console',
    description:
      'Establishes a session bound to `X-Device-Id` — one per device, and signing in again ' +
      'supersedes the previous one. The refresh token is set as an HttpOnly cookie scoped to ' +
      '`/api/v1/admin/auth` and never appears in the body. Branch on `status`.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminAuthResultDto, {
    status: HttpStatus.OK,
    description: 'The password was correct and a device session established.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Signed in successfully')
  async login(
    @Body() body: AdminLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AdminAuthResult> {
    const { result, refreshToken } = await this.adminAuthService.login(body);

    this.delivery.set(reply, refreshToken);

    return result;
  }
}
