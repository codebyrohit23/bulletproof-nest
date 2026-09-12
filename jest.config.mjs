const config = {
  rootDir: '.',

  testEnvironment: 'node',

  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],

  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  roots: ['<rootDir>/src'],

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
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
    'src/**/*.tsx',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],

  coverageDirectory: '<rootDir>/coverage',

  clearMocks: true,
  restoreMocks: true,
};

export default config;
