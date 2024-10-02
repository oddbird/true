# True

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

1. To make true; shape, adjust, place, etc., exactly or accurately:

   _True the wheels of a bicycle after striking a pothole._

2. To make even, symmetrical, level, etc. (often followed by _up_):

   _True up the sides of a door._

3. To test your Sass code; debug, perfect, etc. (often using _True_):

   _True your sweet plugin before you deploy._

True is a unit-testing tool
for [Sass](https://sass-lang.com/) code.
All of the tests are written in plain Sass,
and can be compiled using Dart Sass –
but we also provide integration with
JavaScript test runners
(e.g. [Mocha](https://mochajs.org/) or [Jest](https://jestjs.io/)),
for extra features and improved reporting.

## Install

In command line:

```bash
npm install --save-dev sass-true
```

True requires Dart Sass v1.45.0 or higher, so install it if you haven't already:

```bash
npm install --save-dev sass-embedded # or `sass`
```

Import in your test directory,
like any other Sass file:

```scss
@use 'pkg:sass-true' as *;
```

If you are not using the Sass [Node.js package importer][pkg-importer], you may
need to include the full path name:

```scss
// This is only an example, your path may be different
@use '../node_modules/sass-true' as *;
```

Or if you are using the [JavaScript test runner integration][js-runner]:

```scss
@use 'true' as *;
```

[pkg-importer]: https://sass-lang.com/documentation/js-api/classes/nodepackageimporter/
[js-runner]: #using-mocha-jest-or-other-js-test-runners

## One Setting

`$terminal-output` (boolean),
defaults to `true`

- `true` will show detailed information in the terminal
  for debugging failed assertions or reporting final results.
  This is the default, and best for compiling without a JavaScript test runner.
- `false` will turn off all terminal output from Sass,
  though Mocha/Jest will continue to use the terminal for reporting.

If you are still using `@import` rather than `@use`,
there is an import path available -
which retains the legacy prefixed `$true-terminal-output` variable name:

```scss
// Your path may be different
@import '../node_modules/sass-true/sass/true';
```

## Usage

True is based on common JS-testing patterns,
allowing both a `test-module`/`test` syntax,
and the newer `describe`/`it` for defining the structure:

```scss
@include test-module('Zip [function]') {
  @include test('Zips multiple lists into a single multi-dimensional list') {
    // Assert the expected results
    @include assert-equal(zip(a b c, 1 2 3), (a 1, b 2, c 3));
  }
}
```

This is the same as…

```scss
@include describe('Zip [function]') {
  @include it('Zips multiple lists into a single multi-dimensional list') {
    // Assert the expected results
    @include assert-equal(zip(a b c, 1 2 3), (a 1, b 2, c 3));
  }
}
```

Sass is able to compare values internally,
meaning function-output and variable values
can easily be compared and reported during Sass compilation.

CSS output tests, on the other hand,
have to be compared after compilation is complete.
You can do that by hand if you want
(`git diff` is helpful for noticing changes),
or you can use a test runner
such as [Mocha](https://mochajs.org/) or [Jest](https://jestjs.io/).

Output tests fit the same structure,
but assertions take a slightly different form,
with an outer `assert` mixin,
and a matching pair of `output` and `expect`
to contain the output-values.

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

You can optionally show a summary report
in CSS and/or the command line,
after the tests have completed:

```scss
@include report;
```

See the [full documentation online](https://www.oddbird.net/true/docs/)
for more details.
See [CHANGELOG.md](https://github.com/oddbird/true/blob/main/CHANGELOG.md)
when upgrading from an older version of True.

## Using Mocha, Jest, or other JS test runners

1. Install `true` via npm:

   ```bash
   npm install --save-dev sass-true
   ```

2. [Optional] Install Dart Sass (`sass-embedded` or `sass`), if not already
   installed.

   ```bash
   npm install --save-dev sass-embedded # or `sass`
   ```

3. Write some Sass tests in `test/test.scss` (see above).

4. Write a shim JS test file in `test/sass.test.js`:

   ```js
   const path = require('node:path');
   const sassTrue = require('sass-true');

   const sassFile = path.join(__dirname, 'test.scss');
   sassTrue.runSass({ describe, it }, sassFile);
   ```

5. Run Mocha/Jest, and see your Sass tests reported in the command line.

**Note:** Because of differences between Jest globals and Node globals, Dart
Sass often errors when trying to compile in a Jest environment (e.g.
`J.getInterceptor$ax(...).map$1$1 is not a function`). This can usually be fixed
by installing
[jest-environment-node-single-context](https://github.com/kayahr/jest-environment-node-single-context)
and setting `testEnvironment: 'jest-environment-node-single-context'` in
`jest.config.js`. See [possible](https://github.com/sass/dart-sass/issues/1692)
[related](https://github.com/dart-lang/sdk/issues/47670)
[issues](https://github.com/facebook/jest/issues/2549).

**Note:** Jest does not watch for changes in Sass files by default. To use
`jest --watch` with True, add "scss" to your
[moduleFileExtensions](https://jestjs.io/docs/configuration#modulefileextensions-arraystring)
setting.

You can call `runSass` more than once, if you have multiple Sass test files you
want to run separately.

The first argument is an object with required `describe` and `it` options, and
optional `sass`, `contextLines` and `sourceType` options.

Any JS test runner with equivalents to Mocha's or Jest's `describe` and `it`
should be usable in the same way: just pass your test runner's `describe` and
`it` equivalents in the first argument to `runSass`.

The `sass` option is an optional string name of a Dart Sass implementation
installed in the current environment (e.g. `'embedded-sass'` or `'sass'`), or a
Dart Sass implementation instance itself. If none is provided, True will attempt
to detect which implementation is available, starting with `sass-embedded`.

If True can't parse the CSS output, it'll give you some context lines of CSS as
part of the error message. This context will likely be helpful in understanding
the parse failure. By default it provides up to 10 lines of context; if you need
more, you can provide a numeric `contextLines` option: the maximum number of
context lines to provide.

The second argument is a string representing either the path to a source Sass
file (passed through to Sass'
[`compile`](https://sass-lang.com/documentation/js-api/modules#compile)
function), or a string of source Sass (passed through to Sass'
[`compileString`](https://sass-lang.com/documentation/js-api/modules#compileString)
function). By default it is expected to be a path, and `sass.compile` is used.
To pass in a source string (and use `sass.compileString`), add `sourceType:
'string'` to your options passed in as the first argument to `runSass`.

The third (optional) argument to `runSass` accepts the [same
options](https://sass-lang.com/documentation/js-api/interfaces/Options) that
Sass' `compile` or `compileString` expect (e.g. `importers`, `loadPaths`, or
`style`), and these are passed directly through to Sass.

By default, True makes two modifications to these options. First, True's sass
path is added to the `loadPaths` option, so `@use 'true';` works in your Sass
test file. Second, if Dart Sass v1.71 or greater is installed, `importers` is
set to an array containing the [Node.js package importer][pkg-importer], which
supports `pkg:` imports to resolve `@use` and `@import` for external modules
installed via npm or Yarn. If `importers` is set (even as an empty array
`importers: []`), it will override this default importer.

**Note:** True requires the
[default Sass `'expanded'` output style](https://sass-lang.com/documentation/js-api/modules#OutputStyle),
and will not work if `{ style: 'compressed' }` is used in the third argument to
`runSass`.

### Custom Importers

If you use tilde notation (e.g. `@use '~accoutrement/sass/tools'`) or another
method for importing Sass files from `node_modules`, you'll need to tell
`runSass` how to handle that. That will require writing a [custom
importer](https://sass-lang.com/documentation/js-api/interfaces/FileImporter)
and passing it into the configuration for `runSass`:

```js
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const sassTrue = require('sass-true');

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

### Sponsor OddBird's OSS Work

At OddBird, we love contributing to the languages & tools developers rely on.
We're currently working on polyfills for new Popover & Anchor Positioning
functionality, as well as CSS specifications for functions, mixins, and
responsive typography. Help us keep this work sustainable and centered on your
needs as a developer! We display sponsor logos and avatars on our
[website](https://www.oddbird.net/true/#open-source-sponsors).

[Sponsor OddBird's OSS Work](https://opencollective.com/oddbird-open-source)
