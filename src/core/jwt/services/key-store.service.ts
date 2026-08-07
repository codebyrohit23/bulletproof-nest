import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { CompactSign, calculateJwkThumbprint, compactVerify, exportJWK, importPKCS8, importSPKI } from 'jose';
import type { CryptoKey } from 'jose';

import { JwtConfigService } from '#/config/jwt/index.js';

import { JWT_ALGORITHM, JWT_LOG_CONTEXT } from '../constants/jwt.constants.js';

@Injectable()
export class KeyStoreService implements OnModuleInit {
  private readonly logger = new Logger(JWT_LOG_CONTEXT);

  private signingKeyValue?: CryptoKey;

  private signingKidValue?: string;

  private readonly verificationKeys = new Map<string, CryptoKey>();

  constructor(private readonly config: JwtConfigService) {}

  async onModuleInit(): Promise<void> {
    const privateKey = await this.importPrivateKey();

    const publicKey = await this.importPublicKey(this.config.publicKey, 'JWT_PUBLIC_KEY');

    await this.assertKeysArePaired(privateKey, publicKey);

    const kid = await this.thumbprintOf(publicKey);

    this.signingKeyValue = privateKey;
    this.signingKidValue = kid;
    this.verificationKeys.set(kid, publicKey);

    await this.registerPreviousKey(kid);

    this.logger.log(`JWT keys loaded (kid ${kid}, ${this.verificationKeys.size} accepted)`);
  }

  get signingKey(): CryptoKey {
    if (this.signingKeyValue === undefined) {
      throw new Error('JWT signing key requested before the key store finished initialising');
    }

    return this.signingKeyValue;
  }

  get signingKid(): string {
    if (this.signingKidValue === undefined) {
      throw new Error('JWT signing key id requested before the key store finished initialising');
    }

    return this.signingKidValue;
  }

  getVerificationKey(kid: string): CryptoKey | undefined {
    return this.verificationKeys.get(kid);
  }

  private async importPrivateKey(): Promise<CryptoKey> {
    try {
      return await importPKCS8(this.config.privateKey, JWT_ALGORITHM);
    } catch (error) {
      throw new Error('JWT_PRIVATE_KEY is not a usable Ed25519 private key', { cause: error });
    }
  }

  private async importPublicKey(pem: string, variable: string): Promise<CryptoKey> {
    try {
      return await importSPKI(pem, JWT_ALGORITHM);
    } catch (error) {
      throw new Error(`${variable} is not a usable Ed25519 public key`, { cause: error });
    }
  }

  private async registerPreviousKey(currentKid: string): Promise<void> {
    const pem = this.config.previousPublicKey;

    if (pem.length === 0) {
      return;
    }

    const previousKey = await this.importPublicKey(pem, 'JWT_PUBLIC_KEY_PREVIOUS');

    const previousKid = await this.thumbprintOf(previousKey);

    if (previousKid === currentKid) {
      this.logger.warn('JWT_PUBLIC_KEY_PREVIOUS matches the current key and was ignored');

      return;
    }

    this.verificationKeys.set(previousKid, previousKey);

    this.logger.log(`Accepting tokens from the previous key (kid ${previousKid}) until they expire`);
  }

  private async assertKeysArePaired(privateKey: CryptoKey, publicKey: CryptoKey): Promise<void> {
    try {
      const probe = await new CompactSign(new TextEncoder().encode('leadflow-keypair-probe'))
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .sign(privateKey);

      await compactVerify(probe, publicKey);
    } catch (error) {
      throw new Error('JWT_PUBLIC_KEY does not belong to JWT_PRIVATE_KEY — tokens signed now could never be verified', {
        cause: error,
      });
    }
  }

  private async thumbprintOf(key: CryptoKey): Promise<string> {
    return calculateJwkThumbprint(await exportJWK(key));
  }
}
