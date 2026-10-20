import { FileVariantKind } from '@prisma/client';

import type { StoredFileSnapshot, StoredFileVariantSnapshot } from '../interfaces/index.js';

export function findThumbnail(file: StoredFileSnapshot): StoredFileVariantSnapshot | undefined {
  return file.variants.find((variant) => variant.kind === FileVariantKind.THUMBNAIL);
}
