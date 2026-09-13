import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Path to your schema file
  schema: 'prisma/schema.prisma',

  // Migration settings
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url: env('POSTGRES_DIRECT_DATABASE_URL'),
  },
});
