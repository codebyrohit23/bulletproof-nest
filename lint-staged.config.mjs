/*
 * Order matters: ESLint first, Prettier second.
 *
 * `eslint --fix` can rewrite code — reordering imports via `import/order`,
 * stripping unused ones — and its output is not guaranteed to be formatted.
 * Prettier runs afterwards to lay out whatever ESLint produced. Reversing the
 * two would leave ESLint's edits unformatted in the commit.
 *
 * This is not double work: ESLint no longer runs Prettier internally, because
 * `eslint-plugin-prettier` was removed — see the header of eslint.config.mjs.
 *
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{ts,tsx}': ['eslint --fix --max-warnings 0 --no-warn-ignored', 'prettier --write'],

  '*.{js,mjs,cjs}': ['eslint --fix --max-warnings 0 --no-warn-ignored', 'prettier --write'],

  '*.{json,jsonc,md,yml,yaml}': ['prettier --write'],

  /*
   * Formatting only — `prisma validate` needs a reachable DATABASE_URL, which
   * is not a safe assumption inside a commit hook.
   */
  '*.prisma': ['prisma format'],
};
