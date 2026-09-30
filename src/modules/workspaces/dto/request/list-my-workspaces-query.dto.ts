import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';

import { offsetPaginationQuerySchema } from '#/shared/pagination/index.js';

const listMyWorkspacesQuerySchema = offsetPaginationQuerySchema();

export class ListMyWorkspacesQueryDto extends createZodDto(listMyWorkspacesQuerySchema) {}

export type ListMyWorkspacesQuery = z.infer<typeof listMyWorkspacesQuerySchema>;
