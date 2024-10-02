# True Changelog

## 8.1.0 (10/02/24)

- FEATURE: If True `sass` option is not specified, True will automatically
  attempt to use `embedded-sass`, then `sass`.
  [#290](https://github.com/oddbird/true/issues/290)
- INTERNAL: Add `sass` and `sass-embedded` as optional peer-dependencies.
- INTERNAL: Update dependencies

## 8.0.0 (02/23/24)

- FEATURE: Add True `sass` option (`string` or Sass implementation instance,
  defaults to `'sass'`) to allow using either `sass` or `embedded-sass`.
- FEATURE: Add the
  [Node.js package importer](https://sass-lang.com/documentation/js-api/classes/nodepackageimporter/)
  to the Sass `importers` option by default, if Dart Sass v1.71 or later is
  available. Users can opt out by providing their own `importers` option, e.g.
  `{ importers: [] }`.
- BREAKING: Drop support for node < 18
- INTERNAL: Remove `sass` as a peer-dependency.
- INTERNAL: Update dependencies

## 7.0.1 (01/04/24)

- FEATURE: Validate `runSass` arguments and warn if using v6 API.
- DOCUMENTATION: Add note that `{ style: 'compressed' }` is not supported.
- DOCUMENTATION: Add note about possible Jest error and workaround.
- INTERNAL: Update dependencies

## 7.0.0 (12/14/22)

- FEATURE: `contains()` checks multiple block with matching selectors.
  [#243](https://github.com/oddbird/true/pull/243)
- BREAKING: Upgrade to newer [Sass API](https://sass-lang.com/documentation/js-api)
  - Add True `sourceType` option (`path` [default] or `string`)
  - Reverse order of expected arguments to `runSass`: 1) True options, 2) source
    path (or string), 3) optional Sass options
  - **Note that some of the Sass options have changed.** For example,
    `includePaths` is now `loadPaths`, `outputStyle` is now `style`, `importer`
    is now `importers`, etc. See the [Dart Sass
    documentation](https://sass-lang.com/documentation/js-api/interfaces/Options)
    for more details.
- BREAKING: Require `sass` (`>=1.45.0`) as a peer-dependency, removing True
  `sass` option
- BREAKING: Drop support for node < 14.15.0
- INTERNAL: Use both Jest and Mocha for internal testing
- INTERNAL: Remove documentation from npm package
- INTERNAL: Update dependencies

### Migrating from v6

- `runSass` arguments have changed:

v6:

```js
const path = require('path');
const sass = require('node-sass');
const sassTrue = require('sass-true');

const sassFile = path.join(__dirname, 'test.scss');
sassTrue.runSass(
  // Sass options [required]
  { file: sassFile, includePaths: ['node_modules'] },
  // True options [required]
  { describe, it, sass },
);

const sassString = `
h1 {
  font-size: 40px;
}`;
sassTrue.runSass(
  // Sass options [required]
  {
    data: sassString,
    includePaths: ['node_modules'],
  },
  // True options [required]
  { describe, it, sass },
);
```

v7:

```js
const path = require('path');
const sassTrue = require('sass-true');

const sassFile = path.join(__dirname, 'test.scss');
sassTrue.runSass(
  // True options [required]
  { describe, it },
  // Sass source (path) [required]
  sassFile,
  // Sass options [optional]
  { loadPaths: ['node_modules'] },
);

const sassString = `
h1 {
  font-size: 40px;
}`;
sassTrue.runSass(
  // True options [required]
  { describe, it, sourceType: 'string' },
  // Sass source (string) [required]
  sassString,
  // Sass options [optional]
  { loadPaths: ['node_modules'] },
);
```

## 7.0.0-beta.0 (09/16/22)

- BREAKING: Upgrade to newer [Sass API](https://sass-lang.com/documentation/js-api)
  - Add True `sourceType` option (`path` [default] or `string`)
  - Reverse order of expected arguments to `runSass`: 1) True options, 2) source
    path (or string), 3) optional Sass options
- BREAKING: Require `sass` as a peer-dependency, removing True `sass` option
- BREAKING: Drop support for node < 14.15.0
- INTERNAL: Use both Jest and Mocha for internal testing
- INTERNAL: Update dependencies

## 6.1.0 (03/02/22)

- No changes since v6.1.0-beta.1

## 6.1.0-beta.1 (02/24/22)

- FEATURE: Clearer formatting of failing test diffs
  [#210](https://github.com/oddbird/true/issues/210)
- INTERNAL: Limit files included in npm package
  [#189](https://github.com/oddbird/true/issues/189)
- INTERNAL: Convert JS to TypeScript and bundle type definitions
  [#212](https://github.com/oddbird/true/issues/212) --
  thanks to [@robertmaier](https://github.com/robertmaier) for the initial PR
  [#206](https://github.com/oddbird/true/pull/206)
- INTERNAL: Remove documentation static-site from True repository
- INTERNAL: Use Jest for internal testing (replaces Mocha)
- INTERNAL: Switch from Travis CI to GitHub Actions for CI
- INTERNAL: Update dependencies

## 6.0.1 (10/16/20)

- Remove eyeglass specific-version requirement.
- Update documentation

## 6.0.0 (07/22/20)

- BREAKING: Switch to [Dart Sass](https://sass-lang.com/dart-sass) with [Sass
  module system](https://sass-lang.com/blog/the-module-system-is-launched),
  dropping support for [Node Sass](https://github.com/sass/node-sass).
- BREAKING: Drop support for node < 10
- BREAKING: Rename `$true-terminal-output` setting to `$terminal-output`
  when importing as a module (with `@use`).
  Projects not using Sass modules can still
  `@import '<path>/sass-true/sass/true'`
  and access the setting as `$true-terminal-output`
- FEATURE: Added `_index.scss` at the project root,
  for simpler import path: `@use '<path>/sass-true'`
- FEATURE: New `sass/_throw.scss` module provides:
  - `error()` function & mixin for establishing "catchable" errors
  - global `$catch-errors` toggles how `error()` output is handled
- FEATURE: Support testing `content` properties which include a curly brace.
- Update dependencies

## 5.0.0 (06/03/19)

- BREAKING: Update API for `runSass`, which now accepts two arguments: a
  `sassOptions` object and a `trueOptions` object.
- BREAKING: Drop support for node < 8
- Add docs and testing for usage with Jest
  [#135](https://github.com/oddbird/true/issues/135)
- Add `sass` option to `runSass` for passing a different Sass implementation
  than `node-sass` [#137](https://github.com/oddbird/true/issues/137)
- Remove `node-sass` from `peerDependencies`
- Fix deprecated use of `assert.fail`
  [#138](https://github.com/oddbird/true/issues/138)
- Update dev dependencies

## 4.0.0 (04/09/18)

- BREAKING: Move `node-sass` to `peerDependencies`
- Update dependencies
- Add JS coverage reporting

## 3.1.0 (03/06/18)

- NEW: Add `contains()` mixin for more minute output comparisons.
  Works the same as `expect()`, but doesn't require a complete match.
- Update docs

## 3.0.2 (10/6/17)

- Dependency updates

## 3.0.1 (9/13/17)

- Update docs

## 3.0.0 (8/26/17)

- Update dependencies & release

## 3.0.0-beta.1 (6/1/17)

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

## 2.2.2 (4/11/17)

- `assert-true` returns false on empty strings and lists
- `assert-false` returns true on empty strings and lists
- Module/Test/Assertion stats are included in reports

## 2.2.1 (2/7/17)

- Output CSS context around Mocha parsing errors.
- Added `$fail-on-error` argument to `report()` mixin.
  Set to `true` if you need the Sass compiler to fail
  on broken tests.
- Fix bug with `assert-false` causing it to fail on `null` values.
- Allow unquoted descriptions and test/module names.
- Fix bug throwing off test-count and reporting.

## 2.1.4 (12/22/16)

- Fix default assertion messages
- Upgrade dependencies

## 2.0.2 (5/13/15)

- Fixes debug inspector.

## 2.0.1 (5/9/15)

- Improve internal logic, and namespace private functions behind `_true-*`.
- Add `assert()`, `input`, and `expect` mixins for testing CSS output.
- Support for LibSass.
- Add Mocha JS integration.
  — Create NPM package.
- Simplify output options down to single `$true-terminal-output` setting.
- Add eyeglass support.

## 1.0.1 (10/18/14)

- LibSass 3.0 compatability.

## 1.0.0 (10/3/14)

- Add command-line interface: `true-cli <path-to-file>`
- Use `-s` flag for silent output
- Check for unit differences between numbers.
- Add assertion-failure details to css output.

## 0.2.0 (7/15/14)

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

## 0.1.5 (6/10/13)

- Append actual results to custom failure messages.

## 0.1.4 (6/9/13)

- Null result is considered a failure.
- Allow output to be turned off for certain modules/tests/assertions.

## 0.1.3 (6/7/13)

- Nest assertions within `test() {}` named tests.
- Cleaner css output.

## 0.1.2 (6/7/13)

- Use nesting for modules with `test-module() {}`
- Added failure message argument to all assertions.

## 0.1.1 (6/6/13)

- Fix bug in `lib/true.rb` compass plugin registration.

## 0.1.0 (6/6/13)

- `assert-true()`, `assert-false()`, `assert-equal()`, and `assert-unequal()`.
- `pass()` and `fail()` for tracking and reporting individual results.
- `start-test-module()` and `report-test-result()` for module results.
- Includes tests of the testing tools!
