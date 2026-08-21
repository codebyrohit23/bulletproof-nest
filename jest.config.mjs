/*
 * ===========================================================================
 * Jest — ESM
 * ===========================================================================
 *
 * This package is `"type": "module"` and TypeScript compiles with
 * `module: NodeNext`, so the test runner has to be told to run ESM too.
 * Without the three settings below, Jest loads the compiled output as
 * CommonJS and fails on the very first line of every suite with
 * `SyntaxError: Cannot use import statement outside a module`:
 *
 *   1. `extensionsToTreatAsEsm` — treat .ts as a real ES module.
 *   2. `useESM: true` on the ts-jest transform — emit ESM rather than
 *      ts-jest's default CommonJS downlevel.
 *   3. `NODE_OPTIONS=--experimental-vm-modules` — set by the `test` scripts in
 *      package.json. Jest's ESM support runs on Node's VM modules API, which
 *      is still behind that flag. It cannot be set from this file.
 *
 * `moduleNameMapper` exists because `verbatimModuleSyntax` requires runtime
 * import specifiers to carry a `.js` extension even though the source file is
 * `.ts`. Node resolves that at runtime; Jest's resolver does not, so the
 * extension is stripped back off here.
 *
 * @type {import('jest').Config}
 */
const config = {
  rootDir: '.',

  testEnvironment: 'node',

  moduleFileExtensions: ['js', 'json', 'ts'],

  extensionsToTreatAsEsm: ['.ts'],

  roots: ['<rootDir>/src'],

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,

        /*
         * The spec project, not the default one — it adds the `jest` and
         * `node` type packages that the root tsconfig deliberately omits.
         */
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },

  moduleNameMapper: {
    // `#/foo/bar.js` -> `src/foo/bar` (the package.json `imports` subpath)
    '^#/(.*)\\.js$': '<rootDir>/src/$1',
    '^#/(.*)$': '<rootDir>/src/$1',

    // `./foo.js` / `../foo.js` -> `./foo` / `../foo`
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],

  coverageDirectory: '<rootDir>/coverage',

  /*
   * Mock state does not leak between tests. Without this a `jest.spyOn` in one
   * test silently changes the behaviour of the next one in the same file.
   */
  clearMocks: true,
  restoreMocks: true,
};

export default config;
