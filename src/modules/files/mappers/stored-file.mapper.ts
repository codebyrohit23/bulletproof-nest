import type { StoredFileRow } from '../constants/stored-file-select.constants.js';
import type { StoredFileSnapshot } from '../interfaces/index.js';

export function toStoredFileSnapshot(row: StoredFileRow): StoredFileSnapshot {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    uploadedByUserId: row.uploadedByUserId,
    uploadedByAdminId: row.uploadedByAdminId,
    purpose: row.purpose,
    visibility: row.visibility,
    status: row.status,
    rejectReason: row.rejectReason,
    objectKey: row.objectKey,
    originalName: row.originalName,
    declaredMimeType: row.declaredMimeType,
    detectedMimeType: row.detectedMimeType,
    sizeBytes: Number(row.sizeBytes),
    width: row.width,
    height: row.height,
    durationMs: row.durationMs,
    expiresAt: row.expiresAt,
    attachedAt: row.attachedAt,
    createdAt: row.createdAt,
    variants: row.variants,
  };
}
