import type { RequestIdentityPatch } from '#/core/context/index.js';

import type { AuthFailureReason } from '../constants/auth.constants.js';

export type AuthenticationResult =
  | { readonly ok: true; readonly identity: RequestIdentityPatch }
  | {
      readonly ok: false;
      readonly reason: AuthFailureReason;
      readonly subject?: RequestIdentityPatch;
    };

export interface RequestAuthenticator {
  authenticate(token: string, deviceId: string): Promise<AuthenticationResult>;
}
