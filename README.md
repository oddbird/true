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

`true-cli [options] PATH`

Options:
* `-s` slient
* `-c` config file
* `-d` debug config file settings

Config file (optional):

``` yaml
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

  @include test('Strict Equal [function]') {
    $test: is-equal(1, 1rem);
    @include assert-equal($test, false,
      'Returns false for equal numbers with different units.');

    $test: is-equal(1, 1);
    @include assert-equal($test, true,
      'Returns true for numbers that are truely equal.');
  }
}
```

**True** will report to both the terminal
and an output css file by default.

Here's a sample of the CSS output:

```css
/* ### Utilities ---------- */
/* - Map Add [function] (1 Assertions, 1 Passed, 0 Failed) */
/* - Strict Equal [function] (2 Assertions, 2 Passed, 0 Failed) */
/*
*/
/* 2 Tests: */
/*  - 2 Passed */
/*  - 0 Failed */
```
