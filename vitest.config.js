/* eslint-disable @typescript-eslint/no-require-imports */

const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    // Make describe, it, expect, etc. available globally (like Jest)
    globals: true,

    forceRerunTriggers: ['**/*.scss'],

    // Automatically clear mock calls, instances and results before every test
    clearMocks: true,

    // Coverage configuration
    coverage: {
      enabled: true,
      reportOnFailure: true,

      // An array of glob patterns indicating a set of files for which coverage information should be collected
      // include: ['src/**/*.{js,ts}'],

      // A list of reporter names that Vitest uses when writing coverage reports
      reporter: ['text-summary', 'html'],

      // An object that configures minimum threshold enforcement for coverage results
      thresholds: {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
