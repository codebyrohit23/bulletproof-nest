import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { offsetPaginationQuerySchema } from '#/shared/pagination/index.js';

import { USER_SESSION_LIST_STATUS } from '../../constants/index.js';

const userListSessionsQuerySchema = offsetPaginationQuerySchema({
  status: z
    .enum(USER_SESSION_LIST_STATUS)
    .default(USER_SESSION_LIST_STATUS.ACTIVE)
    .describe(
      '`active` — signed in now, the default. `ended` — signed out or expired in the last 90 ' +
        'days. `all` — both.',
    ),
});

export class UserListSessionsQueryDto extends createZodDto(userListSessionsQuerySchema) {}

export type UserListSessionsQuery = z.infer<typeof userListSessionsQuerySchema>;
