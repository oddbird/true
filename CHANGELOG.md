True Changelog
==============

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
