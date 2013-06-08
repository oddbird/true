True
====

A testing framework for compass/sass libraries.

At this point,
True is better at testing functions than mixins -
because it is easier to test a value
than the actual property-value css output.

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
      'Simple multiplication failed.');

    // You can assert-equal, assert-unequal, assert-true, or assert-false.
    // A test can include as many assertions as you need.
    @include assert-true($test-2,
      'Something returned false.');
  }

}
```

**True** will report detailed results in the terminal,
and a summary of results in the output css.