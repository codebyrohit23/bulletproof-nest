/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],

  '*.{js,mjs,cjs,json}': ['prettier --write'],

  '*.{md,yml,yaml}': ['prettier --write'],
};
