import type { FileVariantKind } from '@prisma/client';

export interface MarkReadyInput {
  readonly detectedMimeType: string;

  readonly width: number;

  readonly height: number;

  readonly sizeBytes: number;
}

export interface SaveVariantInput {
  readonly kind: FileVariantKind;

  readonly objectKey: string;

  readonly mimeType: string;

  readonly width: number;

  readonly height: number;

  readonly sizeBytes: number;
}
