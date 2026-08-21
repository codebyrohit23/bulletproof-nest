/*
 * Knip reports unused files, exports and dependencies.
 *
 * It exists here because dependency drift is invisible until someone goes
 * looking: this repository had accumulated @types/express (on a Fastify
 * service), ts-node, tsconfig-paths and tsc-alias — all installed, none
 * referenced anywhere. Nothing failed, so nothing surfaced them.
 *
 * It runs with `continue-on-error` in CI. Knip's unused-export detection is
 * heuristic and a barrel-heavy Nest codebase produces false positives; the
 * report is there to be read, not to block a merge.
 *
 * @type {import('knip').KnipConfig}
 */
export default {
  entry: [
    'src/main.ts',
    'prisma/seed.ts',
    'prisma.config.ts',
    'scripts/**/*.ts',
    'test/**/*.e2e-spec.ts',
    'src/**/*.spec.ts',
  ],

  project: ['src/**/*.ts', 'scripts/**/*.ts', 'prisma/**/*.ts'],

  ignore: ['generated/**', 'dist/**', 'coverage/**'],

  ignoreDependencies: [
    /*
     * Loaded by name at runtime or by another tool, never imported, so static
     * analysis cannot see the reference:
     *
     *   reflect-metadata  — side-effect import required by Nest's DI
     *   pino-pretty       — resolved by string in the Pino transport config
     *   ts-jest           — named in jest.config.mjs `transform`
     *   cross-env         — invoked from package.json scripts
     */
    'reflect-metadata',
    'pino-pretty',
    'ts-jest',
    'cross-env',

    // Resolved from the `extends: ['@commitlint/config-conventional']` string
    // in commitlint.config.mjs.
    '@commitlint/config-conventional',

    /*
     * Correctly reported as unused today, and deliberately kept.
     *
     * `test/app.e2e-spec.ts` was reduced to a container-resolution smoke test
     * when the `GET /` controller it exercised was removed, so nothing makes an
     * HTTP request yet. These come back into use with the first real endpoint
     * test; removing and reinstalling them is churn, not hygiene.
     */
    'supertest',
    '@types/supertest',
  ],

  /*
   * Nest modules, controllers and providers are instantiated by the DI
   * container from decorator metadata, so knip sees their exports as unused.
   */
  ignoreExportsUsedInFile: true,
};
