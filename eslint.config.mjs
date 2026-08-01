// @ts-check

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'generated/**',
      '.nestjs/**',
      'eslint.config.mjs',
      '**/*.d.ts',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked,

  prettierRecommended,

  /*
   * -------------------------------------------------------
   * Type-aware program resolution — TypeScript files only
   * -------------------------------------------------------
   *
   * `projectService` replaces the older `project: ['./tsconfig.json']`.
   *
   * `project` builds one TypeScript program and caches it for the lifetime of
   * the ESLint process. In an editor that process is long-lived, so a type
   * changed in a file you do not have open is never re-read: the cached program
   * still holds the old shape, the type resolves to TypeScript's internal
   * `error` type, and rules like `no-unsafe-assignment` fire on code that is
   * perfectly valid. The CLI passes, the editor does not, and the only cure is
   * restarting the ESLint server.
   *
   * `projectService` uses the same incremental project service the TypeScript
   * language server uses, so it tracks edits across the whole project and stays
   * in sync. It also discovers `tsconfig.spec.json` and any future project
   * config on its own, instead of needing each one listed here.
   */
  {
    files: ['**/*.ts'],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  /*
   * -------------------------------------------------------
   * Shared rules
   * -------------------------------------------------------
   */
  {
    languageOptions: {
      sourceType: 'module',

      globals: {
        ...globals.node,
      },
    },

    settings: {
      'import/resolver': {
        typescript: true,
      },
    },

    plugins: {
      import: importPlugin,
    },

    rules: {
      /*
       * -------------------------------------------------------
       * TypeScript
       * -------------------------------------------------------
       */

      '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/no-floating-promises': 'error',

      '@typescript-eslint/await-thenable': 'error',

      '@typescript-eslint/no-misused-promises': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      /*
       * -------------------------------------------------------
       * Imports
       * -------------------------------------------------------
       */

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],

          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],

          pathGroupsExcludedImportTypes: ['builtin'],

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },

          'newlines-between': 'always',
        },
      ],

      /*
       * -------------------------------------------------------
       * General
       * -------------------------------------------------------
       */

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],

      'no-debugger': 'error',

      /*
       * -------------------------------------------------------
       * Prettier
       * -------------------------------------------------------
       */

      'prettier/prettier': 'error',
    },
  },

  /*
   * -------------------------------------------------------
   * Tooling configs
   * -------------------------------------------------------
   *
   * `prettier.config.mjs`, `commitlint.config.mjs` and friends belong to no
   * tsconfig, so type-aware rules cannot run against them. Turning those rules
   * off is the supported way to say so — the alternative, excluding them from
   * the project, would report them as unlintable instead.
   */
  {
    files: ['**/*.{js,mjs,cjs}'],

    extends: [tseslint.configs.disableTypeChecked],
  },

  /*
   * -------------------------------------------------------
   * Standalone scripts
   * -------------------------------------------------------
   *
   * `scripts/` and `prisma/seed*` are CLI entry points run by hand or by
   * `prisma migrate`. Their output goes to a terminal, so `console.log` is the
   * correct mechanism there rather than the application logger.
   */
  {
    files: ['scripts/**/*.ts', 'prisma/**/*.ts'],

    rules: {
      'no-console': 'off',
    },
  },

  /*
   * -------------------------------------------------------
   * Tests
   * -------------------------------------------------------
   *
   * Type-aware linting stays on here — a test is the last place you want an
   * unnoticed floating promise. Only `any` is relaxed, for fixtures and mocks.
   */
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],

    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },

    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
