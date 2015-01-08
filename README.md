True
====

[![Build Status](https://travis-ci.org/ericam/true.png?branch=master)](https://travis-ci.org/ericam/true)

*Verb*

1. To make true; shape, adjust, place, etc., exactly or accurately:
  *True the wheels of a bicycle after striking a pothole.*
2. To make even, symmetrical, level, etc. (often followed by *up*):
  *True up the sides of a door.*
3. To test your Sass code; debug, perfect, etc. (often using *True*):
  *True your sweet plugin before you deploy.*

At this point
True can only test values (e.g. function returns),
not property/value output (e.g. mixin output).


Install
-------

in command line:

```bash
# ruby gem
gem install true

# bower package
bower install true
```


Command Line
------------

_This command-line tool uses Ruby
and the Ruby Sass compiler._

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
  color: true #enables colored output

# require ruby sass extension libraries
require:
  - "compass"
  - "serialy_sassy"
```

default location: `test/true.yml`


Usage
-----

```scss
@import "true";

@include test-module('Utilities') {

  @include test('Map Add [function]') {
    $base: (one: 1, two: 1, three: 1);
    $add: (one: 1, two: 2, three: -1);

    $test: map-add($base, $add);
    $expect: (one: 2, two: 3, three: 0);
    @include assert-equal($test, $expect,
      'Returns the sum of two numeric maps');
  }

  @include test('Is Equal [function]') {
    $test: is-equal(1, 1rem);
    @include assert-equal($test, false,
      'Returns false for equal numbers with different units.');

    $test: is-equal(1, 1);
    @include assert-equal($test, true,
      'Returns true for numbers that are truely equal.');
  }
}

@include report;
```

Settings
--------

There is only one setting:
`$true-terminal-output`
toggles output to the terminal on and off.

- `true` will display a final summary of your test results in the terminal,
  and show detailed information on failing assertions.
  *Required for `true-cli`.*
- `false` to turn off all terminal output.
  *Required for Libsass.*
