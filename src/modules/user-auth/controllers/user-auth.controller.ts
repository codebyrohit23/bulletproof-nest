import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { Public } from '#/core/auth/index.js';
import {
  ApiDeviceIdHeader,
  ApiErrorResponses,
  ApiSuccessMessageResponse,
  ApiSuccessResponse,
} from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { RateLimit } from '#/core/rate-limit/index.js';
import { ApiVersion } from '#/shared/constants/index.js';

import { TOKEN_DELIVERY, USER_AUTH_API_TAG } from '../constants/index.js';
import {
  AuthResultDto,
  AuthTokensDto,
  ChangePasswordDto,
  LoginDto,
  OtpLoginDto,
  OtpLoginRequestDto,
  PasswordResetTokenDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterResponseDto,
  ResendVerificationDto,
  ResetPasswordDto,
  ResetPasswordRequestDto,
  VerifyCodeDto,
  VerifyResetOtpDto,
  type AuthResult,
  type AuthTokens,
  type PasswordResetToken,
  type RegisterResponse,
} from '../dto/index.js';
import { AUTH_RATE_LIMIT } from '../rate-limit/user-auth-limits.constants.js';
import { AuthTokenDeliveryService } from '../services/auth-token-delivery.service.js';
import { UserAuthService } from '../services/user-auth.service.js';

@ApiTags(USER_AUTH_API_TAG.name)
@Controller({ path: 'auth', version: ApiVersion.V1 })
export class UserAuthController {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly delivery: AuthTokenDeliveryService,
  ) {}

  /**
   * Register User
   */
  @Post('register')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.REGISTER)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a pending account and sends a verification code. No session is established here ' +
      '— the client signs in at `/auth/verification/verify`.',
  })
  @ApiSuccessResponse(RegisterResponseDto, {
    status: HttpStatus.CREATED,
    description:
      'The account was created and a verification code sent. An identifier that already belongs ' +
      'to an account answers 409 — whether or not it has been verified.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('User registered successfully')
  registerUser(@Body() body: RegisterDto): Promise<RegisterResponse> {
    return this.userAuthService.registerUser(body);
  }

  /**
   * Verify your identity
   */
  @Post('verification/verify')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.VERIFY_REGISTRATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a registration code and sign in',
    description:
      'Activates the account and establishes a device session, on the same terms as `/auth/login`. ' +
      'A suspended or deactivated account is marked verified but refused a session with a `401`.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AuthResultDto, {
    status: HttpStatus.OK,
    description:
      'The identifier was proven and a device session established. `status` is always ' +
      '`AUTHENTICATED` here and the tokens are usable immediately.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Account verified successfully')
  async verifyRegistration(
    @Body() body: VerifyCodeDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResult> {
    const result = await this.userAuthService.verifyRegistration(body);
    return this.delivery.applyToAuthResult(result, this.delivery.resolve(body.platform), reply);
  }

  /**
   * Resend Verification
   */
  @Post('verification/resend')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.RESEND_VERIFICATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend the registration verification code',
    description:
      'Sends a fresh verification code to an account that is not yet verified. No session is ' +
      'established here, and requests are rate-limited.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The request was accepted. Whether a code was sent is deliberately not disclosed — an ' +
      'unregistered, an already-verified and an unverified identifier answer the same way.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.TOO_MANY_REQUESTS)
  @ResponseMessage('If the account requires verification, a new verification code has been sent.')
  resendVerification(@Body() body: ResendVerificationDto): Promise<null> {
    return this.userAuthService.resendVerification(body);
  }

  /**
   * Login User
   */
  @Post('login')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.LOGIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in to the account',
    description:
      'Establishes a session bound to `X-Device-Id` — one per device, and signing in again ' +
      'supersedes the previous one. Branch on `status`, not on the HTTP code.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AuthResultDto, {
    status: HttpStatus.OK,
    description:
      '`AUTHENTICATED` carries tokens and a live session. `VERIFICATION_REQUIRED` carries neither ' +
      'and means the address was never verified — a fresh code has just been sent.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Login successful')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResult> {
    const result = await this.userAuthService.login(body);
    return this.delivery.applyToAuthResult(result, this.delivery.resolve(body.platform), reply);
  }

  /**
   * OTP Request For Login
   */
  @Post('otp/request')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.REQUEST_LOGIN_OTP)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a one-time login code',
    description:
      'Sends a one-time code that `/auth/otp/verify` exchanges for a session. No password is ' +
      'involved, no session is established here, and requests are rate-limited.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The request was accepted. Whether a code was sent is deliberately not disclosed — ' +
      'a registered and an unregistered identifier answer the same way.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.TOO_MANY_REQUESTS)
  @ResponseMessage('If the account exists, a login code has been sent.')
  requestLoginOtp(@Body() body: OtpLoginRequestDto): Promise<null> {
    return this.userAuthService.requestLoginOtp(body);
  }

  /**
   * Login With OTP
   */
  @Post('otp/verify')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.VERIFY_LOGIN_OTP)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a one-time login code for a session',
    description:
      'Completes the flow from `/auth/otp/request`: a valid code establishes a session bound to ' +
      '`X-Device-Id`. A wrong, expired, misdirected or unknown code is answered identically.',
  })
  @ApiDeviceIdHeader()
  @ApiSuccessResponse(AuthResultDto, {
    status: HttpStatus.OK,
    description:
      'The code was correct and a device session established. `status` is always ' +
      '`AUTHENTICATED` here and the tokens are usable immediately.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Login successful')
  async loginWithOtp(
    @Body() body: OtpLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResult> {
    const result = await this.userAuthService.loginWithOtp(body);
    return this.delivery.applyToAuthResult(result, this.delivery.resolve(body.platform), reply);
  }

  /**
   * Refresh
   */
  @Post('refresh')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.REFRESH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh an expired access token',
    description:
      'Rotates on use: the presented token is spent and a replacement issued. Web uses the ' +
      'refresh cookie; native clients send and receive `refreshToken` in the body.',
  })
  @ApiDeviceIdHeader()
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiSuccessResponse(AuthTokensDto, {
    status: HttpStatus.OK,
    description: '`refreshToken` is returned to native clients only — web receives it as a cookie.',
  })
  @ApiErrorResponses(
    HttpStatus.UNAUTHORIZED,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Token refreshed successfully')
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthTokens> {
    const presented = this.delivery.read(request);
    const delivery = presented?.delivery ?? TOKEN_DELIVERY.COOKIE;

    try {
      const tokens = await this.userAuthService.refreshSession(presented?.token);

      return this.delivery.applyToTokens(tokens, delivery, reply);
    } catch (error) {
      /* A refusal makes the cookie worthless — drop it so the browser stops replaying it. */
      if (delivery === TOKEN_DELIVERY.COOKIE) {
        this.delivery.clear(reply);
      }

      throw error;
    }
  }

  /**
   * Password Reset Request
   */
  @Post('password-reset/request')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.REQUEST_PASSWORD_RESET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset code',
    description:
      'Sends a one-time code that `/auth/password-reset/verify-otp` exchanges for a reset token. ' +
      'No session is established here, no password changes, and requests are rate-limited.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The request was accepted. The response body never discloses whether the address belongs ' +
      'to an account — registered, unregistered, suspended and deactivated all read the same.',
  })
  @ApiErrorResponses(HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.TOO_MANY_REQUESTS)
  @ResponseMessage('If an account exists with this email, a verification code has been sent.')
  resetPasswordRequest(@Body() body: ResetPasswordRequestDto): Promise<null> {
    return this.userAuthService.resetPasswordRequest(body);
  }

  /**
   * Verify Reset Code
   */
  @Post('password-reset/verify-otp')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.VERIFY_RESET_OTP)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a password reset code for a reset token',
    description:
      'Spends the code and returns a short-lived token. Send it back as `token` in the body at ' +
      '`/auth/password-reset` — a wrong, expired, misdirected or unknown code answers identically.',
  })
  @ApiSuccessResponse(PasswordResetTokenDto, {
    status: HttpStatus.OK,
    description:
      'The code was correct and is now spent. `expiresIn` is the life of `resetToken` in seconds; ' +
      'after it lapses the flow restarts at `/auth/password-reset/request`.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Verification code accepted')
  verifyResetOtp(@Body() body: VerifyResetOtpDto): Promise<PasswordResetToken> {
    return this.userAuthService.verifyResetOtp(body);
  }

  /**
   * Reset Password
   */
  @Post('password-reset')
  @Public()
  @RateLimit(...AUTH_RATE_LIMIT.RESET_PASSWORD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set a new password with a reset token',
    description:
      'Spends the `token` from `/auth/password-reset/verify-otp`, sent in the body, and replaces ' +
      'the password. Single-use, and every session and refresh token is revoked on success.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The password was replaced and every session revoked. No session is established here — the ' +
      'client should route to sign-in.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Password reset successfully')
  resetPassword(@Body() body: ResetPasswordDto): Promise<null> {
    return this.userAuthService.resetPassword(body);
  }

  /**
   * Change Password
   */
  @Post('password-change')
  @RateLimit(...AUTH_RATE_LIMIT.CHANGE_PASSWORD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change the current password',
    description:
      'Changes the password of the signed-in user, after checking the current one. Every ' +
      '**other** session and refresh token is revoked; this one stays signed in.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description:
      'The password was changed and every other device signed out. The current session and its ' +
      'tokens keep working — no re-authentication is needed here.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Password changed successfully')
  @ApiDeviceIdHeader()
  changePassword(@Body() body: ChangePasswordDto): Promise<null> {
    return this.userAuthService.changePassword(body);
  }

  /**
   * Logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout the current user',
    description: 'The user was logged out successfully and  cuurent session were revoked.',
  })
  @ApiSuccessMessageResponse({
    status: HttpStatus.OK,
    description: 'The user was logged out successfully and  cuurent session were revoked.',
  })
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED)
  @ResponseMessage('Logged out successfully')
  @ApiDeviceIdHeader()
  async logout(@Res({ passthrough: true }) reply: FastifyReply): Promise<null> {
    await this.userAuthService.logout();
    this.delivery.clear(reply);
    return null;
  }
}
