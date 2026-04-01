/* eslint-disable @typescript-eslint/no-require-imports */

const eslint = require('@eslint/js');
const vitest = require('@vitest/eslint-plugin');
const { defineConfig } = require('eslint/config');
const prettier = require('eslint-config-prettier');
const { importX } = require('eslint-plugin-import-x');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = defineConfig(
  {
    ignores: [
      '.git/*',
      '.nyc_output/*',
      '.vscode/*',
      '.yarn/*',
      '.yarnrc.yml',
      'coverage/*',
      'dist/*',
      'docs/*',
      'node_modules/*',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  prettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,cts,mts}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        sourceType: 'script',
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {},
      },
      'import-x/external-module-folders': ['node_modules'],
    },
    rules: {
      'no-console': 1,
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme', '@@@'] }],
      'import-x/first': 'warn',
      'import-x/newline-after-import': 'warn',
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
      'import-x/order': [
        'warn',
        { 'newlines-between': 'always', alphabetize: { order: 'asc' } },
      ],
      'import-x/named': 'warn',
    },
  },
  {
    files: ['src/**/*.{js,mjs,cjs,ts,cts,mts}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'import-x/order': 'off',
    },
  },
  {
    files: ['test/**/*.{js,ts}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...vitest.environments.env.globals,
        ...globals.mocha,
        ...globals.es2022,
      },
      parserOptions: {
        sourceType: 'script',
      },
    },
    plugins: {
      vitest,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },
);
