# True

[![Build Status](https://api.travis-ci.org/oddbird/true.svg)](https://travis-ci.org/oddbird/true)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

True is a unit-testing tool
for Sass code –
initially developed for the
[Susy layout toolkit](http://susy.oddbird.net).
All of the test code is written in pure Sass,
and can be compiled by any Sass compiler –
but we also provide integration with
[Mocha JS](https://mochajs.org/),
for extra features and simpler reporting.

**Verb**

1. To make true; shape, adjust, place, etc., exactly or accurately:

  *True the wheels of a bicycle after striking a pothole.*

2. To make even, symmetrical, level, etc. (often followed by *up*):

  *True up the sides of a door.*

3. To test your Sass code; debug, perfect, etc. (often using *True*):

  *True your sweet plugin before you deploy.*



## Install

In command line:

```bash
# ruby gem
gem install true

# bower package
bower install true

# npm module
npm install sass-true
```

Import in your test directory,
like any other Sass file:

```scss
@import "true";
```

Depending on your setup,
you may need to include the full path name:

```scss
// This is only an example
@import "../node_modules/sass-true/sass/true";
```


## Settings

`$true-terminal-output` (boolean),
defaults to `true`

- `true` will show detailed information in the terminal,
  for debugging failed assertions, or reporting final results.
  This is the default, and best for using `true-cli`.
- `false` will turn off all terminal output from Sass,
  though Mocha continues to use the terminal in any case.


## Usage

```scss
// Create modules to organize your tests
@include test-module('Utility Tests') {

  // Test return-values of functions and variables
  @include test('Zips multiple lists into a multi-dimensional list') {
    // Assert the expected results
    @include assert-equal(
      zip(a b c, 1 2 3),
      (a 1, b 2, c 3));
  }

  // Test CSS output from mixins
  @include test('Font Size [mixin]') {
    @include assert('Outputs a font size and line height based on keyword') {
      @include output {
        @include font-size(large);
      }

      @include expect {
        font-size: 2rem;
        line-height: 3rem;
      }
    }
  }
}

// Optionally show a summary report in CSS and/or the command line:
@include report;
```

**Note:**
Sass is able to compare values internally,
but output tests have to be compared after compilation.
You can do that by hand
(`git diff` is helpful for noticing changes),
or you can use out [Mocha JS](https://mochajs.org/) integration.

See the [full documentation online](http://oddbird.net/true)
or in the `.sassdoc` directory,
for more details.


## Using Mocha (or other JS test runners)

1. Install `true` via npm (`npm install sass-true`).

2. Write some Sass tests in `test/test.scss` (see above).

3. Write a shim JS test file in `test/test_sass.js`:

   ```javascript
   var path = require('path');
   var sassTrue = require('sass-true');

   var sassFile = path.join(__dirname, 'test.scss');
   sassTrue.runSass({file: sassFile}, describe, it);
   ```

4. Run Mocha, and see your Sass tests reported in the command line.

You can call `runSass` more than once, if you have multiple Sass test files you
want to run separately.

The first argument to `runSass` accepts the same options that node-sass'
`renderSync` function accepts. The only modification `runSass` makes is to add
True's sass path to the `includePaths` option, so `@import 'true';` works in
your Sass test file.

Any other JS test runner with equivalents to Mocha's `describe` and `it` should
be usable in the same way; just pass your test runner's `describe` and `it`
equivalents into `runSass`.

If True's Mocha plugin can't parse the CSS output from True, it'll give you
some context lines of CSS as part of the error message. This context will
likely be helpful in understanding the parse failure. By default it provides up
to 10 lines of context; if you need more, you can provide a numeric fourth
argument to `runSass`, the maximum number of context lines to provide.


## Using Grunt

Run Mocha using the Grunt task supplied by
[grunt-mocha-cli](https://github.com/Rowno/grunt-mocha-cli)

Install `grunt-mocha-cli`:

```bash
npm install grunt-mocha-cli --save-dev
```

Configure task:

```javascript
grunt.loadNpmTasks('grunt-mocha');

mochacli: {
   all: ['test/test_sass.js']
},
```

Run tests:

```bash
grunt mochacli
```


## Using Ruby Sass, and the Ruby CLI

```bash
true-cli [options] PATH
```

Options:

 * `-s` silent
 * `-c` config file
 * `-d` debug config file settings

Config file (optional):

```yaml
options:
  color: true  # enables colored output

# require ruby sass extension libraries
require:
  - "compass"
  - "serialy/sassy"
```

default location: `test/true.yml`
