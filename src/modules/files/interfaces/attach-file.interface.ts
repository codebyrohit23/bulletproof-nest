import type { FilePurpose } from '@prisma/client';

import type { FileUploader } from './file-uploader.interface.js';

export interface AttachFileInput {
  readonly purpose: FilePurpose;

  readonly uploader: FileUploader;
}
