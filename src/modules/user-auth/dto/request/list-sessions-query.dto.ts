import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { offsetPaginationQuerySchema } from '#/shared/pagination/index.js';

import { SESSION_LIST_STATUS } from '../../constants/index.js';

const listSessionsQuerySchema = offsetPaginationQuerySchema({
  status: z
    .enum(SESSION_LIST_STATUS)
    .default(SESSION_LIST_STATUS.ACTIVE)
    .describe(
      '`active` — signed in now, the default. `ended` — signed out or expired in the last 90 ' +
        'days. `all` — both.',
    ),
});

export class ListSessionsQueryDto extends createZodDto(listSessionsQuerySchema) {}

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
