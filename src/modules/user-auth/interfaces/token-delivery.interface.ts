import type { UserTokenDelivery } from '../constants/index.js';

export interface PresentedRefreshToken {
  readonly token: string;

  readonly delivery: UserTokenDelivery;
}
