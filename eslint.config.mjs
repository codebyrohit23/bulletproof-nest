import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist/**',
    'coverage/**',
    'node_modules/**',
    'generated/**',
    '.nestjs/**',
    'eslint.config.mjs',
    '**/*.d.ts',
  ]),

  js.configs.recommended,

  tseslint.configs.recommendedTypeChecked,

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

      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],

      /*
       * -------------------------------------------------------
       * Imports
       * -------------------------------------------------------
       *
       * `import/order` is the single owner of import ordering. The editor's
       * `source.organizeImports` code action is deliberately not enabled in
       * `.vscode/settings.json`, because it sorts by different rules and
       * collapses the blank lines `newlines-between` requires — the two
       * undo each other on every save.
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

  /*
   * -------------------------------------------------------
   * Prettier — must stay last
   * -------------------------------------------------------
   *
   * Switches off every stylistic rule enabled above that Prettier also has an
   * opinion about. Last position matters: anything added after this could
   * re-enable a rule that fights the formatter.
   */
  eslintConfigPrettier,
);
