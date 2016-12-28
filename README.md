# True

[![Build Status](https://api.travis-ci.org/oddbird/true.svg)](https://travis-ci.org/oddbird/true)

*Verb*

1. To make true; shape, adjust, place, etc., exactly or accurately:
  *True the wheels of a bicycle after striking a pothole.*
2. To make even, symmetrical, level, etc. (often followed by *up*):
  *True up the sides of a door.*
3. To test your Sass code; debug, perfect, etc. (often using *True*):
  *True your sweet plugin before you deploy.*


## Install

in command line:

```bash
# ruby gem
gem install true

# bower package
bower install true

# npm module
npm install sass-true
```


## Usage

### With any Sass compiler

```scss
@import "true";

@include test-module('Utilities') {

  // Testing Functions
  @include test('Map Add [function]') {
    $base: (one: 1, two: 1, three: 1);
    $add: (one: 1, two: 2, three: -1);

    $test: map-add($base, $add);
    $expect: (one: 2, two: 3, three: 0);
    @include assert-equal($test, $expect,
      'Returns the sum of two numeric maps');
  }

  // Testing Mixins
  @include test('Font Size [mixin]') {
    @include assert('Outputs a font size and line height based on keyword.') {
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

// Optionally show summary report in CSS and/or the command line:
// - If you use Mocha, reporting to the command line is automatic.
// - if you use true-cli, report(terminal) is required for output.
@include report;
```

**Note:**
Function unit-tests work across the board,
but testing mixins can be a bit more complex.
At this point,
only Mocha is able to compare/report the results of mixin tests.
Without using Mocha,
you can test any mixin,
but you will have to compare the expected and actual results manually
in the output code.
Version control can make that much easier than it sounds.


### With node-sass and Mocha (or other JS test runners)

1. Install `true` via npm (`npm install sass-true`).

2. Write some Sass tests in `test/test.scss` (see above).

3. Write a shim JS test file in `test/test_sass.js`:

   ```javascript
   var path = require('path');
   var sassTrue = require('sass-true');

   var sassFile = path.join(__dirname, 'test.scss');
   sassTrue.runSass({file: sassFile}, describe, it);
   ```

4. Run Mocha, and see your Sass tests reported as individual test results.

You can call `runSass` more than once, if you have multiple Sass test files you
want to run separately.

The first argument to `runSass` accepts the same options that node-sass'
`renderSync` function accepts. The only modification `runSass` makes is to add
True's sass path to the `includePaths` option, so `@import 'true';` works in
your Sass test file.

Any other JS test runner with equivalents to Mocha's `describe` and `it` should
be usable in the same way; just pass your test runner's `describe` and `it`
equivalents into `runSass`.


#### With Grunt...

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

### With ruby-sass on the command line

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
  - "serialy_sassy"
```

default location: `test/true.yml`


## Settings

There is only one setting:
`$true-terminal-output`
toggles output to the terminal on or off.

- `true` will show detailed information on failing assertions.
  This is the default, and best for using `true-cli`.
- `false` to turn off all terminal output.
