// Flat config (ESLint 9). The old .eslintrc format is no longer read, which is
// why `npm run lint` failed outright rather than reporting lint errors.
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Express error handlers are identified by arity, so the unused `next`
      // in a 4-argument handler is load-bearing and must not be flagged.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$' }],
    },
  },
  {
    files: ['__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
];
