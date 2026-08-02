export interface RedisLockHandle {
  readonly key: string;

  readonly token: string;
}
