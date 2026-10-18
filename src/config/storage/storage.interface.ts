export interface StorageConfig {
  readonly endpoint: string;

  readonly region: string;

  readonly credentials: StorageCredentialsConfig;

  readonly forcePathStyle: boolean;

  readonly requestTimeoutMs: number;

  readonly buckets: StorageBucketsConfig;

  /** No trailing slash. */
  readonly publicBaseUrl: string;
}

export interface StorageCredentialsConfig {
  readonly accessKeyId: string;

  readonly secretAccessKey: string;
}

export interface StorageBucketsConfig {
  readonly private: string;

  readonly public: string;
}
