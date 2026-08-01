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

  // Connection used by the CLI (migrate, studio, db pull, etc.)
  // NOTE: if you're behind a pooler (PgBouncer/Supabase/RDS Proxy),
  // this should be the DIRECT (non-pooled) URL, not the pooled one your app uses.
  datasource: {
    url: env('POSTGRES_DATABASE_URL'),
  },

  // Optional: only needed if you use `prisma migrate dev` and require
  // a scratch DB for shadow diffing (common in CI or protected prod DBs)
  // datasource: {
  //   url: env('POSTGRES_DATABASE_URL'),
  //   shadowDatabaseUrl: env('POSTGRES_SHADOW_DATABASE_URL'),
  // },
});
