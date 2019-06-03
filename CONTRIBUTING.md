# Contributing to True

True exists because of your contributions.
Bug reports and feature requests are welcome,
but code is even better!

In all cases,
we ask you to follow the
[Sass community guidelines](http://sass-lang.com/community-guidelines).

## Pull Requests

We use the `master` branch for production-ready code,
and side-branches for everything in-progress
or up-for-debate.

When submitting a patch via pull request:

- Write a clear, descriptive commit message
- Include any appropriate unit tests,
  and make sure all tests are passing (`yarn test`)
- Add your changes to the [changelog](CHANGELOG.md)
- Update or write appropriate [SassDoc](http://sassdoc.com/)
  inline documentation for your changes
- Keep it simple: one bug fix or feature per pull request

## Development

Set up your dev environment
with the appropriate dependencies:

```
yarn
```

## Committing

Linting, testing, and documentation
should be done before every commit:

```
yarn commit
```

They can also be triggered individually:

```
# lint
gulp sasslint

# test with mocha/jest and true
yarn test

# compile docs
yarn sassdoc
```

Once you've fixed any final errors or typos,
commit your changes, and submit a pull request!
