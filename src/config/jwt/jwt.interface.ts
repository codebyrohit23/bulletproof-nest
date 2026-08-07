export interface JwtConfig {
  readonly privateKey: string;

  readonly publicKey: string;

  readonly previousPublicKey: string;

  readonly issuer: string;
}
