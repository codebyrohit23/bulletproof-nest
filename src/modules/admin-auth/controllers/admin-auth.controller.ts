import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { Public } from '#/core/auth/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessMessageResponse,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { ADMIN_AUTH_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import {
  AdminAuthResultDto,
  AdminLoginDto,
  AdminRequestPasswordResetDto,
  AdminPasswordResetTokenDto,
  AdminResetPasswordDto,
  AdminVerifyPasswordResetCodeDto,
  type AdminAuthResult,
  type AdminPasswordResetToken,
} from '../dto/index.js';
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

  /**
   * Password Reset Request
   */
  @Post('password-reset/request')
  @Public()
  @RateLimit(...ADMIN_AUTH_RATE_LIMIT.REQUEST_PASSWORD_RESET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request an admin password reset code',
    description:
      'Emails a one-time code that `/admin/auth/password-reset/verify-otp` exchanges for a reset ' +
      'token. This is also how a newly seeded admin sets a first password. No session is ' +
      'established and no password changes here.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The request was accepted. The response never discloses whether the address belongs to ' +
      'an admin — unknown, active, suspended and deactivated all read the same.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.TOO_MANY_REQUESTS)
  @ResponseMessage('If an admin account exists with this email, a verification code has been sent.')
  requestPasswordReset(@Body() body: AdminRequestPasswordResetDto): Promise<null> {
    return this.adminAuthService.requestPasswordReset(body);
  }

  /**
   * Verify Reset Code
   */
  @Post('password-reset/verify-otp')
  @Public()
  @RateLimit(...ADMIN_AUTH_RATE_LIMIT.VERIFY_PASSWORD_RESET_CODE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange an admin password reset code for a reset token',
    description:
      'Spends the code, marks the address verified, and returns a short-lived token for ' +
      '`/admin/auth/password-reset`. A wrong, expired or unknown code, an unknown address and a ' +
      'suspended admin all answer identically.',
  })
  @ApiSuccessResponse(AdminPasswordResetTokenDto, {
    status: HttpStatus.OK,
    description:
      'The code was correct and is now spent. `expiresIn` is the life of `resetToken` in seconds; ' +
      'after it lapses the flow restarts at `/admin/auth/password-reset/request`.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Verification code accepted')
  verifyPasswordResetCode(
    @Body() body: AdminVerifyPasswordResetCodeDto,
  ): Promise<AdminPasswordResetToken> {
    return this.adminAuthService.verifyPasswordResetCode(body);
  }

  /**
   * Reset Password
   */
  @Post('password-reset')
  @Public()
  @RateLimit(...ADMIN_AUTH_RATE_LIMIT.RESET_PASSWORD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set a new admin password with a reset token',
    description:
      'Spends the `token` from `/admin/auth/password-reset/verify-otp` and sets the password — ' +
      'the first one, for a newly seeded admin. Single-use, and every admin session and refresh ' +
      'token is revoked on success.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The password was set and every session revoked. No session is established here — the ' +
      'console should route to sign-in.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Password reset successfully')
  resetPassword(@Body() body: AdminResetPasswordDto): Promise<null> {
    return this.adminAuthService.resetPassword(body);
  }
}
