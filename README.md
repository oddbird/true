True
====

*Verb*

1. To make true; shape, adjust, place, etc., exactly or accurately:
  *True the wheels of a bicycle after striking a pothole.*
2. To make even, symmetrical, level, etc. (often followed by *up*):
  *True up the sides of a door.*
3. A testing framework for Sass/Compass libraries:
  *True your Sass before you deploy.*

At this point
True can only test values,
not property/value output.
I'd like that to change in the future,
but it will require ruby code to achieve.
In the meantime,
you use True for logical unit tests,
and use version-control for integration testing
by comparing changes in output files.

Install
-------

in command line:

`gem install true`

in config.rb:

`require 'true'`

Usage
-----

in your scss:

```scss
@import "true";

// Track and report results in a test module
@include test-module('My Tests') {

  // Add tests
  @include test('Feature A does The Things') {
    $test-1: 3*5;
    $test-2: if(something, true, false);

    // Assert something, with a message to post if the assertion fails.
    @include assert-equal($test-1, 15,
      'Simple multiplication of `3*5` should return `15`.');

    // You can assert-equal, assert-unequal, assert-true, or assert-false.
    // A test can include as many assertions as you need.
    @include assert-true($test-2,
      '`something` should return `true` in the `if()` function.');
  }

}
```

**True** will report detailed results in the terminal,
and a summary of results in the output css.