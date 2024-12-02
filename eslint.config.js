/* eslint-disable @typescript-eslint/no-require-imports */

const babelParser = require('@babel/eslint-parser');
const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');
const jest = require('eslint-plugin-jest');
const jestDOM = require('eslint-plugin-jest-dom');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
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
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  prettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,cts,mts}'],
    languageOptions: {
      parser: babelParser,
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        sourceType: 'script',
      },
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
      'import/external-module-folders': ['node_modules'],
    },
    rules: {
      'no-console': 1,
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme', '@@@'] }],
      'import/first': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/order': [
        'warn',
        { 'newlines-between': 'always', alphabetize: { order: 'asc' } },
      ],
      'import/named': 'warn',
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
      'import/order': 'off',
    },
  },
  {
    files: ['test/**/*.{js,ts}'],
    languageOptions: {
      parser: babelParser,
      globals: {
        ...jest.environments.globals.globals,
        ...globals.mocha,
        ...globals.es2022,
      },
      parserOptions: {
        sourceType: 'script',
      },
    },
    plugins: {
      jest,
      'jest-dom': jestDOM,
      'simple-import-sort': simpleImportSort,
    },
  },
);
