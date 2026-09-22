export interface CreateAdminRefreshTokenInput {
  readonly adminId: string;

  readonly sessionId: string;

  readonly tokenHash: string;
}

export interface IssuedAdminRefreshToken {
  readonly token: string;

  readonly expiresAt: Date;
}
