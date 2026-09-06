import type { TokenDelivery } from '../constants/index.js';

export interface PresentedRefreshToken {
  readonly token: string;

  readonly delivery: TokenDelivery;
}
