True Changelog
==============

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
