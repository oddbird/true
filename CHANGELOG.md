True Changelog
==============


4.0.0 (04/09/18)
----------------
- BREAKING: Move `node-sass` to `peerDependencies`
- Update dependencies
- Add JS coverage reporting


3.1.0 (03/06/18)
----------------
- NEW: Add `contains()` mixin for more minute output comparisons.
  Works the same as `expect()`, but doesn't require a complete match.
- Update docs


3.0.2 (10/6/17)
---------------
- Dependency updates


3.0.1 (9/13/17)
---------------
- Update docs


3.0.0 (8/26/17)
---------------
- Update dependencies & release


3.0.0-beta.1 (6/1/17)
---------------------
- Added `describe` and `it` mixins,
  as alias for `test-module` and `test` respectively.
- Added `$inspect` argument to `assert-equal` and `assert-unequal` mixins,
  for comparing `inspect($assert) == inspect($expected)`
  instead of `$assert == $expected`.
  This helps with several of the equality edge-cases listed below
  (rounding and units).
- BREAKING: No more Ruby gem or Ruby CLI
- BREAKING: No more bower package
- BREAKING: Removes special-handling of equality,
  in favor of allowing Sass to determine the best comparisons.
  There are a few edge-cases to be aware of:
  - In some versions of Sass,
    manipulated numbers and colors are compared without rounding,
    so `1/3 != 0.333333` and `lighten(#246, 15%) != #356a9f`.
    Use the `$inspect` argument to compare rounded output values.
  - In all versions of Sass,
    unitless numbers are considered comparable to all units,
    so `1 == 1x` where `x` represents any unit.
    Use the `$inspect` argument to compare output values with units.
  - Lists compare both values and delimiter,
    so `(one two three) != (one, two, three)`.
    This can be particularly confusing for single-item lists,
    which still have a delimiter assigned,
    even though it is not used.


2.2.2 (4/11/17)
---------------
- `assert-true` returns false on empty strings and lists
- `assert-false` returns true on empty strings and lists
- Module/Test/Assertion stats are included in reports


2.2.1 (2/7/17)
--------------
- Output CSS context around Mocha parsing errors.
- Added `$fail-on-error` argument to `report()` mixin.
  Set to `true` if you need the Sass compiler to fail
  on broken tests.
- Fix bug with `assert-false` causing it to fail on `null` values.
- Allow unquoted descriptions and test/module names.
- Fix bug throwing off test-count and reporting.


2.1.4 (12/22/16)
----------------
- Fix default assertion messages
- Upgrade dependencies


2.0.2 (5/13/15)
---------------
- Fixes debug inspector.


2.0.1 (5/9/15)
--------------
- Improve internal logic, and namespace private functions behind `_true-*`.
- Add `assert()`, `input`, and `expect` mixins for testing CSS output.
- Support for LibSass.
- Add Mocha JS integration.
— Create NPM package.
- Simplify output options down to single `$true-terminal-output` setting.
- Add eyeglass support.


1.0.1 (10/18/14)
----------------
- LibSass 3.0 compatability.


1.0.0 (10/3/14)
---------------
- Add command-line interface: `true-cli <path-to-file>`
- Use `-s` flag for silent output
- Check for unit differences between numbers.
- Add assertion-failure details to css output.


0.2.0 (7/15/14)
---------------
- Simplified reporting in both terminal and CSS.
- Remove `default-module-output`, `$default-test-output` and `$default-final-output`.
  Replace them with `$true` settings map: `(output: css, summary: terminal css)`.
  `output` handles test/module output, `summary` handles final output.
  Assertions are always output to the terminal if they fail.
- Update to use Sass map variables.
- Add `report` function and `report` mixin, for reporting final results.
- Only register as a compass extension if compass is present.
  Compass is no longer an explicit dependency.
- Adjust the output styles to work with Sass 3.4
  and have more visual consistency.


0.1.5 (6/10/13)
---------------
- Append actual results to custom failure messages.


0.1.4 (6/9/13)
--------------
- Null result is considered a failure.
- Allow output to be turned off for certain modules/tests/assertions.


0.1.3 (6/7/13)
--------------
- Nest assertions within `test() {}` named tests.
- Cleaner css output.


0.1.2 (6/7/13)
--------------
- Use nesting for modules with `test-module() {}`
- Added failure message argument to all assertions.


0.1.1 (6/6/13)
--------------
- Fix bug in `lib/true.rb` compass plugin registration.


0.1.0 (6/6/13)
--------------
- `assert-true()`, `assert-false()`, `assert-equal()`, and `assert-unequal()`.
- `pass()` and `fail()` for tracking and reporting individual results.
- `start-test-module()` and `report-test-results()` for module results.
- Includes tests of the testing tools!
