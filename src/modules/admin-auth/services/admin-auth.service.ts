import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminStatus } from '@prisma/client';

import { AUTH_FAILURE_REASON } from '#/core/auth/index.js';
import { RequestContextService } from '#/core/context/index.js';
import { JWT_AUDIENCE, JwtSignerService, TOKEN_TTL_SECONDS } from '#/core/jwt/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { AdminService } from '#/modules/admins/index.js';

import {
  ADMIN_AUTH_ERROR_MESSAGE,
  ADMIN_AUTH_LOG_CONTEXT,
  ADMIN_AUTH_RESULT_STATUS,
} from '../constants/index.js';
import type { AdminAuthResult, AdminLoginInput } from '../dto/index.js';
import { toAuthAdmin } from '../mappers/index.js';
import { resolveAdminDeviceContext } from '../utils/index.js';

import { AdminCredentialService } from './admin-credential.service.js';
import { AdminRefreshTokenService } from './admin-refresh-token.service.js';
import { AdminSessionService } from './admin-session.service.js';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly adminService: AdminService,
    private readonly credentialService: AdminCredentialService,
    private readonly sessionService: AdminSessionService,
    private readonly refreshTokenService: AdminRefreshTokenService,
    private readonly jwtSigner: JwtSignerService,
    private readonly requestContext: RequestContextService,
  ) {}

  async login(payload: AdminLoginInput): Promise<{
    result: AdminAuthResult;
    refreshToken: string;
  }> {
    const { email, password } = payload;

    const deviceId = this.requireDeviceId('login');

    const admin = await this.adminService.findByEmail(email);

    if (admin === null) {
      throw await this.credentialService.invalidCredentialsError(password);
    }

    const credential = await this.credentialService.findByAdminId(admin.id);

    await this.credentialService.verifyPassword(
      admin.id,
      password,
      credential?.passwordHash ?? null,
    );

    this.assertCanSignIn(admin.status, admin.id);

    const device = resolveAdminDeviceContext(deviceId, this.requestContext.get());

    const session = await this.sessionService.startForDevice({ adminId: admin.id, device });

    const refreshToken = await this.refreshTokenService.issue(session.id, admin.id);

    const accessToken = await this.jwtSigner.signAccessToken(
      { sub: admin.id, sid: session.id },
      JWT_AUDIENCE.ADMIN,
    );

    this.requestContext.setIdentity({ adminId: admin.id, sessionId: session.id });

    return {
      result: {
        status: ADMIN_AUTH_RESULT_STATUS.AUTHENTICATED,
        admin: toAuthAdmin(admin),
        tokens: { accessToken, expiresIn: TOKEN_TTL_SECONDS.ACCESS },
      },
      refreshToken: refreshToken.token,
    };
  }

  private assertCanSignIn(status: AdminStatus, adminId: string): void {
    if (status === AdminStatus.ACTIVE) {
      return;
    }

    this.logger.warn('Refused a session to an admin that is not active', {
      context: ADMIN_AUTH_LOG_CONTEXT,
      operation: 'login',
      metadata: {
        adminId,
        status,
        reason:
          status === AdminStatus.SUSPENDED
            ? AUTH_FAILURE_REASON.ACCOUNT_SUSPENDED
            : AUTH_FAILURE_REASON.ACCOUNT_DEACTIVATED,
      },
    });

    throw new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
  }

  private requireDeviceId(operation: string): string {
    const deviceId = this.requestContext.deviceId;

    if (deviceId === undefined) {
      this.logger.warn('Rejected an admin sign-in with no usable device id', {
        context: ADMIN_AUTH_LOG_CONTEXT,
        operation,
        metadata: { reason: AUTH_FAILURE_REASON.DEVICE_ID_MISSING },
      });

      throw new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    return deviceId;
  }
}
