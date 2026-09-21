import { NestFactory } from '@nestjs/core';

import { SEED_KIND, SeedRunner, type SeedKind } from '#/core/seeding/index.js';

import { SeedModule } from './seed.module.js';

/**
 * The seed entry point, named by `prisma.config.ts`.
 *
 * Prisma runs it itself after `migrate reset`, and after a `migrate dev` that
 * had to recreate the database — which is the point of registering it there
 * rather than leaving it a script somebody remembers to call. A reset then
 * leaves a usable environment instead of an empty one.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS COMPILED RATHER THAN RUN WITH `tsx`
 * ---------------------------------------------------------------------------
 * `tsx` is esbuild, and esbuild cannot emit `emitDecoratorMetadata` — it does
 * not resolve types, so there is no `design:paramtypes` for Nest to read. Every
 * constructor parameter arrives as `undefined` and the container fails on the
 * first provider it builds, with an error that names the symptom and not the
 * cause. **Nothing that boots a Nest container can run under `tsx` in this
 * repository**; it goes through `dist`, the same way `start:prod` does.
 *
 * This also holds no seeding logic. The seeders run inside the container, where
 * they share `PasswordService`, `TransactionService` and the repositories with
 * the running application. A standalone script would need its own
 * `PrismaClient` and its own password hashing, and the day those Argon2
 * parameters drift from `core/security` the seeded admin simply cannot sign in
 * — no error, no exception, just a password that does not verify.
 *
 *   pnpm db:seed
 *   pnpm db:seed --only=admins
 *   pnpm db:seed --kinds=reference
 */
const app = await NestFactory.createApplicationContext(SeedModule, {
  /* Nest's own lifecycle chatter is noise in a CLI; our logger still reports. */
  logger: ['error', 'warn'],
});

try {
  await app.get(SeedRunner).run(parseArguments(process.argv.slice(2)));
} finally {
  await app.close();
}

function parseArguments(argv: readonly string[]): { only: string[]; kinds?: SeedKind[] } {
  const only = readList(argv, '--only');
  const kinds = readList(argv, '--kinds');
  const unknown = kinds.filter((kind) => !isSeedKind(kind));

  if (unknown.length > 0) {
    throw new Error(
      `Unknown seed kind: ${unknown.join(', ')}. ` +
        `Expected one of ${Object.values(SEED_KIND).join(', ')}.`,
    );
  }

  return kinds.length > 0 ? { only, kinds: kinds.filter(isSeedKind) } : { only };
}

function readList(argv: readonly string[], flag: string): string[] {
  const prefix = `${flag}=`;

  return argv
    .filter((argument) => argument.startsWith(prefix))
    .flatMap((argument) => argument.slice(prefix.length).split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function isSeedKind(value: string): value is SeedKind {
  return (Object.values(SEED_KIND) as string[]).includes(value);
}
