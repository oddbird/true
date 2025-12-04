# True

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

> **true** (_verb_): To make even, accurate, or precise.
> _"True the wheels of a bicycle. True up the sides of a door. True your Sass
> code before you deploy."_

**True is a unit-testing tool for [Sass](https://sass-lang.com/) code.**

- Write tests in plain Sass
- Compile with Dart Sass
- Optional [JavaScript test runner integration][js-runner] (e.g.
  [Mocha](https://mochajs.org/), [Jest](https://jestjs.io/), or
  [Vitest](https://vitest.dev/))

## Installation

### 1. Install via npm

```bash
npm install --save-dev sass-true
```

### 2. Install Dart Sass (if needed)

True requires **Dart Sass v1.45.0 or higher**:

```bash
npm install --save-dev sass-embedded # or `sass`
```

### 3. Import in your Sass tests

**With [Node.js package importer][pkg-importer]**:

```scss
@use 'pkg:sass-true' as *;
```

**With [JavaScript test runner][js-runner]:**

```scss
@use 'true' as *;
```

**Without package importer:**

```scss
// Path may vary based on your project structure
@use '../node_modules/sass-true' as *;
```

[pkg-importer]: https://sass-lang.com/documentation/js-api/classes/nodepackageimporter/
[js-runner]: #javascript-test-runner-integration

## Configuration

True has one configuration variable: **`$terminal-output`** (boolean, defaults
to `true`)

| Value            | Behavior                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `true` (default) | Shows detailed terminal output for debugging and results. Best for standalone Sass compilation.                 |
| `false`          | Disables Sass terminal output. Use with [JavaScript test runners][js-runner] (they handle their own reporting). |

### Legacy `@import` Support

If you're still using `@import` instead of `@use`, use the legacy import path
with the prefixed variable name:

```scss
// Path may vary
@import '../node_modules/sass-true/sass/true';
// Variable is named $true-terminal-output
```

## Usage

True uses familiar testing syntax inspired by JavaScript test frameworks:

### Testing Values (Functions & Variables)

True can compare Sass values during compilation:

```scss
@include describe('Zip [function]') {
  @include it('Zips multiple lists into a single multi-dimensional list') {
    // Assert the expected results
    @include assert-equal(zip(a b c, 1 2 3), (a 1, b 2, c 3));
  }
}
```

**Alternative syntax** using `test-module` and `test`:

```scss
@include test-module('Zip [function]') {
  @include test('Zips multiple lists into a single multi-dimensional list') {
    // Assert the expected results
    @include assert-equal(zip(a b c, 1 2 3), (a 1, b 2, c 3));
  }
}
```

### Testing CSS Output (Mixins)

CSS output tests require a different assertion structure, with an outer `assert`
mixin, and a matching pair of `output` and `expect` to contain the
output-values:

```scss
// Test CSS output from mixins
@include it('Outputs a font size and line height based on keyword') {
  @include assert {
    @include output {
      @include font-size('large');
    }

    @include expect {
      font-size: 2rem;
      line-height: 3rem;
    }
  }
}
```

> **Note:** CSS output is compared after compilation. You can review changes
> manually with `git diff` or use a [JavaScript test runner][js-runner] for
> automated comparison.

### Optional Summary Report

Display a test summary in CSS output and/or terminal:

```scss
@include report;
```

### Documentation & Changelog

- **[Full Documentation](https://www.oddbird.net/true/docs/)** – Complete API
  reference and guides
- **[CHANGELOG.md](https://github.com/oddbird/true/blob/main/CHANGELOG.md)** –
  Migration notes for upgrading

## JavaScript Test Runner Integration

Integrate True with your existing JS test runner for enhanced reporting and
automated CSS output comparison.

### Quick Start

#### 1. Install dependencies

```bash
npm install --save-dev sass-true
npm install --save-dev sass-embedded # or `sass` (if not already installed)
```

#### 2. Write Sass tests

Create your Sass test file (e.g., `test/test.scss`) using True's syntax (see
[Usage](#usage)).

#### 3. Create JS test file

Create a JavaScript shim to run your Sass tests (e.g., `test/sass.test.js`):

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sassTrue from 'sass-true';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sassFile = path.join(__dirname, 'test.scss');
sassTrue.runSass({ describe, it }, sassFile);
```

#### 4. Run your tests

Run Mocha, Jest, Vitest, or your test runner. Sass tests will appear in the
terminal output.

### Enable Watch Mode for Sass Files

By default, `vitest --watch` and `jest --watch` don't detect Sass file changes.

**Vitest solution:** Add Sass files to `forceRerunTriggers`:

```js
// vitest.config.js
module.exports = defineConfig({
  test: {
    forceRerunTriggers: ['**/*.scss'],
  },
});
```

See [Vitest documentation](https://vitest.dev/config/forcereruntriggers.html#forcereruntriggers) for details.

**Jest solution:** Add `"scss"` to `moduleFileExtensions`:

```js
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'scss'],
};
```

See [Jest documentation](https://jestjs.io/docs/configuration#modulefileextensions-arraystring) for details.

### Advanced Configuration

#### `runSass()` API

```js
sassTrue.runSass(testRunnerConfig, sassPathOrSource, sassOptions);
```

**Arguments:**

1. **`testRunnerConfig`** (object, required)

   | Option         | Type                   | Required | Description                                                                                          |
   | -------------- | ---------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
   | `describe`     | function               | Yes      | Your test runner's `describe` function                                                               |
   | `it`           | function               | Yes      | Your test runner's `it` function                                                                     |
   | `sass`         | string or object       | No       | Sass implementation name (`'sass'` or `'sass-embedded'`) or instance. Auto-detected if not provided. |
   | `sourceType`   | `'string'` or `'path'` | No       | Set to `'string'` to compile inline Sass source instead of file path (default: `'path'`)             |
   | `contextLines` | number                 | No       | Number of CSS context lines to show in parse errors (default: `10`)                                  |

2. **`sassPathOrSource`** (`'string'` or `'path'`, required)
   - File path to Sass test file, or
   - Inline Sass source code (if `sourceType: 'string'`)

3. **`sassOptions`** (object, optional)
   - Standard [Sass compile options](https://sass-lang.com/documentation/js-api/interfaces/Options)
     (`importers`, `loadPaths`, `style`, etc.)
   - **Default modifications by True:**
     - `loadPaths`: True's sass directory is automatically added (allowing `@use 'true';`)
     - `importers`: [Node.js package importer][pkg-importer] added if
       `importers` is not defined and Dart Sass ≥ v1.71 (allowing `@use 'pkg:sass-true' as *;`)
   - ⚠️ **Warning:** Must use `style: 'expanded'` (default).
     `style: 'compressed'` is not supported.

#### Multiple Test Files

Call `runSass()` multiple times to run separate test files:

```js
sassTrue.runSass({ describe, it }, path.join(__dirname, 'functions.test.scss'));
sassTrue.runSass({ describe, it }, path.join(__dirname, 'mixins.test.scss'));
```

#### Other Test Runners

Any test runner with `describe`/`it` functions (or equivalents) works with True:

```js
// Example with custom test runner
import { suite, test } from 'my-test-runner';

sassTrue.runSass(
  { describe: suite, it: test },
  path.join(__dirname, 'test.scss'),
);
```

#### Custom Importers

If you use custom import syntax (e.g., tilde notation
`@use '~accoutrement/sass/tools'`), you'll need to provide a
[custom importer](https://sass-lang.com/documentation/js-api/interfaces/FileImporter):

```js
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sassTrue from 'sass-true';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const importers = [
  {
    findFileUrl(url) {
      if (!url.startsWith('~')) {
        return null;
      }
      return new URL(
        pathToFileURL(path.resolve('node_modules', url.substring(1))),
      );
    },
  },
];

const sassFile = path.join(__dirname, 'test.scss');
sassTrue.runSass({ describe, it }, sassFile, { importers });
```

---

## Sponsor OddBird's Open Source Work

At OddBird, we love contributing to the languages and tools developers rely on.
We're currently working on:

- Polyfills for new Popover & Anchor Positioning functionality
- CSS specifications for functions, mixins, and responsive typography
- Sass testing tools like True

**Help us keep this work sustainable!** Sponsor logos and avatars are featured
on our [website](https://www.oddbird.net/true/#open-source-sponsors).

**[→ Sponsor OddBird on Open Collective](https://opencollective.com/oddbird-open-source)**
