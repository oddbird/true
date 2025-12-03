/* eslint-disable @typescript-eslint/no-require-imports */

const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    // Make describe, it, expect, etc. available globally
    globals: true,

    forceRerunTriggers: ['**/*.scss'],

    // Automatically clear mock calls, instances and results before every test
    clearMocks: true,

    // Coverage configuration
    coverage: {
      enabled: true,
      reportOnFailure: true,
      reporter: ['text-summary', 'html'],
      thresholds: {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
