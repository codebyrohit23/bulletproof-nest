import { Module } from '@nestjs/common';

import { AdminFilesController } from './controllers/admin-files.controller.js';
import { UserFilesController } from './controllers/user-files.controller.js';
import { WorkspaceFilesController } from './controllers/workspace-files.controller.js';
import { ProcessFileJob } from './jobs/process-file.job.js';
import { PurgeDeletedFilesJob } from './jobs/purge-deleted-files.job.js';
import { PurgeUnattachedFilesJob } from './jobs/purge-unattached-files.job.js';
import { StorageUsageRepository, StoredFileRepository } from './repositories/index.js';
import {
  FilePurgeService,
  FileUploadService,
  FileViewService,
  FilesService,
} from './services/index.js';

@Module({
  controllers: [UserFilesController, WorkspaceFilesController, AdminFilesController],
  providers: [
    StoredFileRepository,
    StorageUsageRepository,
    FileViewService,
    FileUploadService,
    FilesService,
    FilePurgeService,
    ProcessFileJob,
    PurgeUnattachedFilesJob,
    PurgeDeletedFilesJob,
  ],
  exports: [FilesService],
})
export class FilesModule {}
