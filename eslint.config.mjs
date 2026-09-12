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
    files: ['**/*.ts', '**/*.tsx'],

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
   * Layer boundaries
   * -------------------------------------------------------
   *
   * The dependency direction this tree is arranged around:
   *
   *     modules  ──→  core / infrastructure  ──→  shared
   *     config   ──→  core (constants only)
   *
   * Arrows point down and never back up. These rules are that sentence, made
   * checkable.
   */
  {
    files: ['src/shared/**/*.ts'],

    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^#/(core|infrastructure|modules|config)/',
              message:
                'shared/ is the leaf: everything may depend on it, so it depends on nothing. ' +
                'One upward import ends that guarantee and opens a cycle back through core. ' +
                'Move the value into shared/ and have the other layer import it from here.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/core/**/*.ts', 'src/infrastructure/**/*.ts'],

    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^#/modules/',
              message:
                'core/ and infrastructure/ are what feature modules are built from. Importing a ' +
                'module here inverts the layering, so neither can be reasoned about or extracted ' +
                'without dragging a feature behind it. Move the shared value to shared/, or have ' +
                'the module satisfy a port declared here — see core/auth/ports.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/config/**/*.ts'],

    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^#/modules/',
              message: 'config/ is read during bootstrap, before any feature module exists.',
            },
            {
              /*
               * The cycle this repository has hit twice. A `core/*` barrel
               * exports that subsystem's Module, the Module imports
               * AppConfigModule, and AppConfigModule loads this file again —
               * "Cannot access 'X' before initialization" at boot, with every
               * static check green.
               */
              regex: '^#/core/[^/]+(/index\\.js)?$',
              message:
                'Import the constants file directly (#/core/<area>/constants/<name>.constants.js), ' +
                "never the barrel. A core barrel exports that area's Module, which imports " +
                'AppConfigModule, which loads config again — a startup cycle that typecheck and ' +
                'lint both pass and only the running process reveals.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/modules/**/*.ts'],

    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^#/modules/[^/]+/(?!index\\.js$)',
              message:
                "A module's public API is its index.ts. Reaching past it couples you to internals " +
                'its owner is free to change. Import the barrel instead — and within your own ' +
                'module, use a relative path.',
            },
          ],
        },
      ],
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
