# True

[![Build Status](https://travis-ci.org/oddbird/true.svg?branch=master)](https://travis-ci.org/oddbird/true)
[![Coverage Status](https://coveralls.io/repos/github/oddbird/true/badge.svg?branch=master)](https://coveralls.io/github/oddbird/true?branch=master)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

True is a unit-testing tool
for [Sass](http://sass-lang.com) code –
initially developed for the
[Susy layout toolkit](http://susy.oddbird.net).
All of the test code is written in pure Sass,
and can be compiled by the Dart Sass compiler –
but we also provide integration with
JavaScript test runners
(e.g. [Mocha](https://mochajs.org/) or [Jest](https://jestjs.io/)),
for extra features and improved reporting.

**Verb**

1. To make true; shape, adjust, place, etc., exactly or accurately:

   _True the wheels of a bicycle after striking a pothole._

2. To make even, symmetrical, level, etc. (often followed by _up_):

   _True up the sides of a door._

3. To test your Sass code; debug, perfect, etc. (often using _True_):

   _True your sweet plugin before you deploy._

## Install

In command line:

```bash
npm install sass-true
```

Import in your test directory,
like any other Sass file:

```scss
@import 'true';
```

Depending on your setup,
you may need to include the full path name:

```scss
// This is only an example
@use '../node_modules/sass-true/sass/true' as *;
```

## One Setting

`$terminal-output` (boolean),
defaults to `true`

- `true` will show detailed information in the terminal
  for debugging failed assertions or reporting final results.
  This is the default, and best for compiling without a JavaScript test runner.
- `false` will turn off all terminal output from Sass,
  though Mocha/Jest will continue to use the terminal for reporting.

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
or you can use
our [Mocha](https://mochajs.org/) or [Jest](https://jestjs.io/) integration.

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

See the [full documentation online](http://oddbird.net/true)
or in the `.sassdoc` directory,
for more details.
See [CHANGELOG.md](https://github.com/oddbird/true/blob/master/CHANGELOG.md)
when upgrading from an older version of True.

## Using Mocha, Jest, or other JS test runners

1. Install `true` via npm:

   ```bash
   npm install --save-dev sass-true
   ```

2. [Optional] Install `sass` (Dart Sass), if not already installed.

   ```bash
   npm install --save-dev sass
   ```

3. Write some Sass tests in `test/test.scss` (see above).

4. Write a shim JS test file in `test/test_sass.js`:

   ```js
   var path = require('path');
   var sassTrue = require('sass-true');

   var sassFile = path.join(__dirname, 'test.scss');
   sassTrue.runSass({ file: sassFile }, { describe, it });
   ```

5. Run Mocha/Jest, and see your Sass tests reported in the command line.

You can call `runSass` more than once, if you have multiple Sass test files you
want to run separately.

The first argument to `runSass` accepts the
[same options](https://sass-lang.com/documentation/js-api#options) that sass'
`renderSync` function accepts. The only modification `runSass` makes is to add
True's sass path to the `includePaths` option, so `@import 'true';` works in
your Sass test file.

The second argument is an object with required `describe` and `it` options, and
an optional `contextLines` option.

Any JS test runner with equivalents to Mocha's or Jest's `describe` and `it`
should be usable in the same way: just pass your test runner's `describe` and
`it` equivalents in the second argument to `runSass`.

If True can't parse the CSS output, it'll give you some context lines of CSS as
part of the error message. This context will likely be helpful in understanding
the parse failure. By default it provides up to 10 lines of context; if you need
more, you can provide a numeric `contextLines` option: the maximum number of
context lines to provide.

### Imports without Webpack

If you use Webpack's tilde notation, like `@import 'accoutrement/sass/tools'`,
you'll need to tell `runSass` how to handle that. That will require writing a
custom importer and passing it into the configuration for `runSass`. Something
like:

```js
function importer(url, prev, done) {
  if (url[0] === '~') {
    url = path.resolve('node_modules', url.substr(1));
  }

  return { file: url };
}

sassTrue.runSass({ importer, file: sassFile }, { describe, it });
```
