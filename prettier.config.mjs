/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',

  trailingComma: 'all',

  arrowParens: 'always',

  bracketSpacing: true,

  bracketSameLine: false,

  objectWrap: 'preserve',

  endOfLine: 'lf',

  /*
   * Kept in step with `editor.rulers` in `.vscode/settings.json`. If one moves,
   * move the other — a ruler that disagrees with the formatter draws a limit
   * Prettier will not enforce, so lines look over-long while being correct.
   */
  printWidth: 100,

  tabWidth: 2,

  useTabs: false,

  proseWrap: 'preserve',
};
