import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Path to your schema file
  schema: 'prisma/schema.prisma',

  // Migration settings
  migrations: {
    path: 'prisma/migrations',

    /*
     * Delegates to the `db:seed` script rather than spelling the command out
     * here, for two reasons. Prisma spawns this without a shell, so an `&&`
     * chain would be passed to the first program as a literal argument. And it
     * keeps one definition of how seeding runs, so `pnpm db:seed` and a
     * `migrate reset` cannot drift apart.
     *
     * That script compiles first: the seeders boot a Nest container, and
     * esbuild — what `tsx` runs on — cannot emit `emitDecoratorMetadata`, so
     * every injected constructor parameter would arrive as `undefined`.
     */
    seed: 'pnpm db:seed',
  },

  datasource: {
    url: env('POSTGRES_DIRECT_DATABASE_URL'),
  },
});
