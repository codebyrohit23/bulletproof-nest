export { FilesModule } from './files.module.js';

export { FilesService } from './services/index.js';

export { FILE_SCOPE, type FileScope } from './constants/index.js';

export { attachedImageSchema, type AttachedImage } from './dto/index.js';

export { adminUploader, userUploader, workspaceUploader } from './utils/index.js';

export type {
  AdminFileUploader,
  AttachFileInput,
  FileUploader,
  UserFileUploader,
  WorkspaceFileUploader,
} from './interfaces/index.js';
