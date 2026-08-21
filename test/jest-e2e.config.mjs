import base from '../jest.config.mjs';

/*
 * End-to-end configuration. Inherits the ESM transform, resolver and module
 * mapping from the root config so the two can never drift apart — the previous
 * `jest-e2e.json` duplicated the transform block and was left behind when the
 * unit config changed.
 *
 * Jest resolves `rootDir` relative to the directory holding *this* file, so it
 * points one level up to the repository root.
 *
 * @type {import('jest').Config}
 */
const config = {
  ...base,

  rootDir: '..',

  roots: ['<rootDir>/test'],

  testRegex: '.*\\.e2e-spec\\.ts$',

  /*
   * Bootstrapping a Nest application, connecting Prisma and reaching Redis is
   * far slower than a unit test. The 5s default fails on a cold container.
   */
  testTimeout: 30_000,

  /*
   * e2e suites share one database and one Redis instance. Running them in
   * parallel makes them fight over the same rows and keys.
   */
  maxWorkers: 1,
};

export default config;
