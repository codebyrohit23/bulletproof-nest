import type { PurgeFileRow } from '../constants/purge-file-select.constants.js';
import type { PurgeFile } from '../interfaces/index.js';

export function toPurgeFile(row: PurgeFileRow): PurgeFile {
  return {
    id: row.id,
    visibility: row.visibility,
    objectKey: row.objectKey,
    workspaceId: row.workspaceId,
    uploadedAt: row.uploadedAt,
    sizeBytes: Number(row.sizeBytes),
    variants: row.variants,
  };
}
