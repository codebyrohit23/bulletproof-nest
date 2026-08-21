import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponses, ApiSuccessResponse } from '#/core/documentation/index.js';
import { ResponseMessage } from '#/core/interceptors/index.js';
import { ApiVersion } from '#/shared/constants/index.js';

import { USER_AUTH_API_TAG } from '../constants/index.js';
import { AuthUserDto, LoginDto, RegisterDto, VerifyCodeDto, type AuthUser } from '../dto/index.js';
import { UserAuthService } from '../services/user-auth.service.js';

@ApiTags(USER_AUTH_API_TAG.name)
@Controller({ path: 'auth', version: ApiVersion.V1 })
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.CONFLICT,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('User registered successfully')
  registerUser(@Body() payload: RegisterDto) {
    return this.userAuthService.registerUser(payload);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a registration code and activate the account' })
  @ApiSuccessResponse(AuthUserDto, {
    status: HttpStatus.OK,
    description: 'The identifier was proven and the account is now active.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Account verified successfully')
  verifyRegistration(@Body() payload: VerifyCodeDto): Promise<AuthUser> {
    return this.userAuthService.verifyRegistration(payload);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in to the account' })
  @ApiSuccessResponse(AuthUserDto, {
    status: HttpStatus.OK,
    description: 'The user has been successfully authenticated and logged in.',
  })
  @ApiErrorResponses(
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.BAD_REQUEST,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  @ResponseMessage('Login successful')
  login(@Body() payload: LoginDto): Promise<AuthUser> {
    return this.userAuthService.login(payload);
  }
}
