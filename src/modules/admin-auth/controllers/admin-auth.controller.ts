import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { Public } from '#/core/auth/index.js';
import { CurrentAdminId, CurrentSessionId } from '#/core/context/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessMessageResponse,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { ParseIdPipe } from '#/core/validation/index.js';
import { ADMIN_AUTH_API_TAG, ApiVersion } from '#/shared/constants/index.js';

import {
  AdminAuthResultDto,
  AdminAuthTokensDto,
  AdminChangePasswordDto,
  AdminListSessionsQueryDto,
  AdminLoginDto,
  AdminRequestPasswordResetDto,
  AdminPasswordResetTokenDto,
  AdminResetPasswordDto,
  AdminRevokedSessionsDto,
  AdminSessionPageDto,
  AdminVerifyPasswordResetCodeDto,
  type AdminAuthResult,
  type AdminAuthTokens,
  type AdminPasswordResetToken,
  type AdminRevokedSessions,
  type AdminSessionPage,
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
   * Refresh
   */
  @Post('refresh')
  @Public()
  @RateLimit(...ADMIN_AUTH_RATE_LIMIT.REFRESH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh an expired admin access token',
    description:
      'Reads the refresh cookie and rotates on use: the presented token is spent and a ' +
      'replacement set as the cookie. Presenting a spent token again ends the session.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminAuthTokensDto, {
    status: HttpStatus.OK,
    description: 'A fresh access token. The new refresh token is in the cookie, never the body.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.TOO_MANY_REQUESTS)
  @ResponseMessage('Token refreshed successfully')
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AdminAuthTokens> {
    try {
      const { tokens, refreshToken } = await this.adminAuthService.refreshSession(
        this.delivery.read(request),
      );

      this.delivery.set(reply, refreshToken);

      return tokens;
    } catch (error) {
      /* A refusal makes the cookie worthless — drop it so the browser stops replaying it. */
      this.delivery.clear(reply);

      throw error;
    }
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
      'Emails a one-time code that `/admin/auth/password-reset/verify-code` exchanges for a reset ' +
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
  @Post('password-reset/verify-code')
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
      'Spends the `token` from `/admin/auth/password-reset/verify-code` and sets the password — ' +
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

  /**
   * Change Password
   */
  @Post('password-change')
  @RateLimit(...ADMIN_AUTH_RATE_LIMIT.CHANGE_PASSWORD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change the current admin password',
    description:
      'Changes the password of the signed-in admin, after checking the current one. Every ' +
      '**other** session and refresh token is revoked; this one stays signed in.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The password was changed and every other device signed out. The current session and its ' +
      'tokens keep working.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Password changed successfully')
  changePassword(
    @CurrentAdminId() adminId: string,
    @CurrentSessionId() sessionId: string,
    @Body() body: AdminChangePasswordDto,
  ): Promise<null> {
    return this.adminAuthService.changePassword(adminId, sessionId, body);
  }

  /**
   * Logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out of the admin console',
    description: 'Revokes the current session and its refresh tokens, and clears the cookie.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description: 'The current session was revoked.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED)
  @ResponseMessage('Logged out successfully')
  async logout(
    @CurrentSessionId() sessionId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<null> {
    await this.adminAuthService.logout(sessionId);

    this.delivery.clear(reply);

    return null;
  }

  /**
   * List Sessions
   */
  @Get('sessions')
  @ApiOperation({
    summary: 'List signed-in devices and recent sign-ins',
    description:
      'The signed-in admin’s sessions, most recently active first, one page at a time. ' +
      '`status=active` (the default) lists devices signed in now; `ended` lists sessions ' +
      'signed out or expired in the last 90 days, each with `endReason`; `all` lists both. ' +
      'The session that made the request is marked `current`.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminSessionPageDto, {
    status: HttpStatus.OK,
    description: 'One page of sessions. A page past the end is an empty `items`, not an error.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Sessions fetched successfully')
  listSessions(
    @CurrentAdminId() adminId: string,
    @CurrentSessionId() currentSessionId: string,
    @Query() query: AdminListSessionsQueryDto,
  ): Promise<AdminSessionPage> {
    return this.adminAuthService.listSessions(adminId, currentSessionId, query);
  }

  /**
   * Revoke Other Sessions
   */
  @Post('sessions/revoke-others')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out every other device',
    description:
      'Revokes every live session except the current one, with their refresh tokens. Takes ' +
      'effect on the next request those devices make.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AdminRevokedSessionsDto, {
    status: HttpStatus.OK,
    description: 'How many other sessions were revoked. Zero is a success.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED)
  @ResponseMessage('Other sessions revoked successfully')
  revokeOtherSessions(
    @CurrentAdminId() adminId: string,
    @CurrentSessionId() currentSessionId: string,
  ): Promise<AdminRevokedSessions> {
    return this.adminAuthService.revokeOtherSessions(adminId, currentSessionId);
  }

  /**
   * Revoke Session
   */
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out one device',
    description:
      'Revokes one of the signed-in admin’s sessions and its refresh tokens. Revoking the ' +
      'current session is a logout, and clears the refresh cookie.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description: 'The session was revoked.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
  @ResponseMessage('Session revoked successfully')
  async revokeSession(
    @CurrentAdminId() adminId: string,
    @CurrentSessionId() currentSessionId: string,
    @Param('id', ParseIdPipe) id: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<null> {
    const { wasCurrent } = await this.adminAuthService.revokeSession(adminId, currentSessionId, id);

    if (wasCurrent) {
      this.delivery.clear(reply);
    }

    return null;
  }
}
