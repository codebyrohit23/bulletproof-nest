import { Readable } from 'node:stream';

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

import { StorageConfigService } from '#/config/storage/index.js';

import {
  SIGNED_UPLOAD_HEADERS,
  STORAGE_BUCKET,
  STORAGE_DELETE_BATCH_SIZE,
  STORAGE_URL_TTL_SECONDS,
  type StorageBucket,
} from './constants/index.js';
import { ObjectNotFoundError } from './errors/index.js';
import type {
  ObjectHead,
  PresignDownloadInput,
  PresignUploadInput,
  PresignedDownload,
  PresignedUpload,
  PutObjectInput,
} from './interfaces/index.js';
import { createS3Client } from './providers/index.js';
import { buildContentDisposition, isNotFoundError } from './utils/index.js';

/**
 * Object storage over the S3 protocol — R2 in deployment, MinIO locally.
 *
 * Mechanism only. It knows buckets and keys; it does not know what a file is
 * for, who may upload one, how large it may be or what a key should look
 * like. `modules/files` decides all of that, as `CacheService` decides TTLs
 * over `RedisCacheStore`.
 *
 * Not behind an abstract class: there is one adapter, because R2, MinIO and S3
 * speak one protocol and differ only in the endpoint, and no layer needs to
 * invert a dependency on it.
 *
 * A presigned URL is a bearer credential until it expires. Never log one.
 */
@Injectable()
export class ObjectStorageService implements OnModuleDestroy {
  private readonly client: S3Client;

  constructor(private readonly config: StorageConfigService) {
    this.client = createS3Client(config);
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }

  /**
   * A URL the client uploads to directly, so no file passes through this
   * service. The content type is signed; the size is not — R2 has no presigned
   * POST, the only form that can bound it — so a caller must `head` the object
   * afterwards and compare.
   *
   * `signableHeaders` is what signs the type. Without it the presigner drops
   * `ContentType` from the URL altogether — neither signed nor in the query —
   * and an upload of any type is accepted. The provider docs' examples omit it.
   */
  async presignUpload(input: PresignUploadInput): Promise<PresignedUpload> {
    const expiresIn = input.expiresInSeconds ?? STORAGE_URL_TTL_SECONDS.UPLOAD;
    const expiresAt = new Date(Date.now() + expiresIn * 1_000);

    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucketName(input.bucket),
        Key: input.key,
        ContentType: input.contentType,
      }),
      { expiresIn, signableHeaders: new Set(SIGNED_UPLOAD_HEADERS) },
    );

    return {
      method: 'PUT',
      url,
      headers: { 'Content-Type': input.contentType },
      expiresAt,
    };
  }

  /**
   * A short-lived read URL for a private object. Public objects need none —
   * `publicUrl` is permanent. Signing is local, so a page of these costs no
   * network round trip.
   */
  async presignDownload(input: PresignDownloadInput): Promise<PresignedDownload> {
    const expiresIn = input.expiresInSeconds ?? STORAGE_URL_TTL_SECONDS.DOWNLOAD;
    const expiresAt = new Date(Date.now() + expiresIn * 1_000);

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucketName(STORAGE_BUCKET.PRIVATE),
        Key: input.key,
        ResponseContentDisposition: buildContentDisposition(input.disposition, input.fileName),
      }),
      { expiresIn },
    );

    return { url, expiresAt };
  }

  /** The permanent CDN URL of a public object. */
  publicUrl(key: string): string {
    const path = key.split('/').map(encodeURIComponent).join('/');

    return `${this.config.publicBaseUrl}/${path}`;
  }

  /** `null` when there is no such object; throws only when storage fails. */
  async head(bucket: StorageBucket, key: string): Promise<ObjectHead | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucketName(bucket), Key: key }),
      );

      return {
        sizeBytes: result.ContentLength ?? 0,
        ...(result.ContentType !== undefined ? { contentType: result.ContentType } : {}),
        ...(result.ETag !== undefined ? { etag: result.ETag } : {}),
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  /**
   * The first `length` bytes, for sniffing a type from its magic bytes without
   * downloading the file.
   */
  async readRange(bucket: StorageBucket, key: string, length: number): Promise<Buffer> {
    const body = await this.getBody(bucket, key, `bytes=0-${length - 1}`);

    return Buffer.from(await body.transformToByteArray());
  }

  /** The whole object as a stream, so a large file never sits in memory. */
  async openStream(bucket: StorageBucket, key: string): Promise<Readable> {
    const body = await this.getBody(bucket, key);

    if (!(body instanceof Readable)) {
      throw new TypeError('Storage returned a body that is not a Node stream.');
    }

    return body;
  }

  async put(input: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName(input.bucket),
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ...(input.cacheControl !== undefined ? { CacheControl: input.cacheControl } : {}),
      }),
    );
  }

  /**
   * Deletes in batches of the protocol's maximum. A key that is already gone
   * is not an error, so a purge that is retried after a partial run is safe.
   */
  async deleteMany(bucket: StorageBucket, keys: readonly string[]): Promise<void> {
    for (let start = 0; start < keys.length; start += STORAGE_DELETE_BATCH_SIZE) {
      const batch = keys.slice(start, start + STORAGE_DELETE_BATCH_SIZE);

      const result = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName(bucket),
          Delete: { Objects: batch.map((key) => ({ Key: key })), Quiet: true },
        }),
      );

      const failed = result.Errors ?? [];

      if (failed.length > 0) {
        throw new Error(
          `${failed.length} of ${batch.length} deletes failed in the ${bucket} bucket (first: ${failed[0]?.Code ?? 'unknown'}).`,
        );
      }
    }
  }

  /** Both buckets exist and the credentials can reach them. */
  async probe(): Promise<void> {
    await Promise.all(
      Object.values(STORAGE_BUCKET).map((bucket) =>
        this.client.send(new HeadBucketCommand({ Bucket: this.bucketName(bucket) })),
      ),
    );
  }

  private async getBody(bucket: StorageBucket, key: string, range?: string) {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName(bucket),
          Key: key,
          ...(range !== undefined ? { Range: range } : {}),
        }),
      );

      if (result.Body === undefined) {
        throw new ObjectNotFoundError(bucket, key);
      }

      return result.Body;
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new ObjectNotFoundError(bucket, key, { cause: error });
      }

      throw error;
    }
  }

  private bucketName(bucket: StorageBucket): string {
    return this.config.buckets[bucket];
  }
}
