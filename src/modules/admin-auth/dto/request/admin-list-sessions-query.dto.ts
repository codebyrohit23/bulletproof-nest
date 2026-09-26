import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { offsetPaginationQuerySchema } from '#/shared/pagination/index.js';

import { ADMIN_SESSION_LIST_STATUS } from '../../constants/index.js';

const adminListSessionsQuerySchema = offsetPaginationQuerySchema({
  status: z
    .enum(ADMIN_SESSION_LIST_STATUS)
    .default(ADMIN_SESSION_LIST_STATUS.ACTIVE)
    .describe(
      '`active` — signed in now, the default. `ended` — signed out or expired in the last 90 ' +
        'days. `all` — both.',
    ),
});

export class AdminListSessionsQueryDto extends createZodDto(adminListSessionsQuerySchema) {}

export type AdminListSessionsQuery = z.infer<typeof adminListSessionsQuerySchema>;
