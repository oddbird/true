True
====

A testing framework for compass/sass libraries.

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

// initiate a test module
@include start-test-module('My Tests');

// silent classes can help you organize tests and scope variables.
// You can name them however you want.
%test__feature-1 {
  $test-1: 3 * 5;
  $expexted-1: 15;

  $test-2: if(something, true, false);

  @include assert-equal($test-1, $expected-1);
  @include assert-true($test-2);
}

// report the results of this module
@include report-test-results;
```

**true** will report test results
both in the command line
and in the output css file.
