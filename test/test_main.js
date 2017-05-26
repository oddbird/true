var expect = require('chai').expect;
var main = require('../lib/main.js');
var path = require('path');


describe('#fail', function () {
  it('formats failure message', function () {
    var msg = main.formatFailureMessage({
      description: 'It broke.',
      assertionType: 'assert-equal',
      expected: '1',
      output: '2',
      details: 'It really broke.'
    });

    expect(msg).to.equal('It broke. ("2" assert-equal "1" -- It really broke.)');
  });
});


describe('#runSass', function () {
  it('throws AssertionError on failure', function () {
    var sass = [
      '@import "true";',
      '@include test-module("Throw an error") {',
      '  @include test("assertionError") {',
      '    @include assert-true(false, "This test is meant to fail.");',
      '  }',
      '}'
    ].join('\n');
    var mock = function (name, cb) { cb(); };
    var attempt = function () {
      main.runSass({data: sass}, mock, mock);
    };
    expect(attempt).to.throw(
      'This test is meant to fail. ("[bool] false" assert-true "[bool] true")');
  });

  it('can specify includePaths', function () {
    var sass = [
      '@import "include";',
      '@import "true";',
      '@include test-module("Module") {',
      '  @include test("Test") {',
      '    @include assert("Assertion") {',
      '      @include output() {',
      '        @include included-mixin();',
      '      }',
      '      @include expect() {',
      '        -property: value;',
      '      }',
      '    }',
      '  }',
      '}'
    ].join('\n');
    var mock = function (name, cb) { cb(); };
    main.runSass(
      {
        data: sass,
        includePaths: [path.join(__dirname, 'scss/includes')]
      },
      mock,
      mock);
  });
});

describe('#parse', function () {
  it('parses a passing non-output test', function () {
    var css = [
      '/* # Module: Utilities */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ Returns the sum of two numeric maps */'
    ].join('\n');
    var expected = [{
      module: "Utilities",
      tests: [{
        test: "Map Add [function]",
        assertions: [{
          description: "Returns the sum of two numeric maps",
          passed: true,
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('ignores a summary', function () {
    var css = [
      '/* # SUMMARY ---------- */',
      '/* 17 Tests: */',
      '/*  - 14 Passed */',
      '/*  - 0 Failed */',
      '/*  - 3 Output to CSS */',
      '/* -------------------- */',
    ].join('\n');
    var expected = [];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a passing non-output test sans description', function () {
    var css = [
      '/* # Module: Utilities */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ */'
    ].join('\n');
    var expected = [{
      module: "Utilities",
      tests: [{
        test: "Map Add [function]",
        assertions: [{
          description: "<no description>",
          passed: true,
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });


  it('parses a test following a summary', function () {
    var css = [
      '/* # SUMMARY ---------- */',
      '/* 17 Tests: */',
      '/*  - 14 Passed */',
      '/*  - 0 Failed */',
      '/*  - 3 Output to CSS */',
      '/* -------------------- */',
      '/* # Module: Utilities */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ Returns the sum of two numeric maps */'
    ].join('\n');
    var expected = [{
      module: "Utilities",
      tests: [{
        test: "Map Add [function]",
        assertions: [{
          description: "Returns the sum of two numeric maps",
          passed: true,
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });


  it('parses a nested passing non-output test', function () {
    var css = [
      '/* # Module: Utilities :: nested */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ Returns the sum of two numeric maps */'
    ].join('\n');
    var expected = [{
      module: "Utilities",
      modules: [{
        module: "nested",
        tests: [{
          test: "Map Add [function]",
          assertions: [{
            description: "Returns the sum of two numeric maps",
            passed: true,
          }],
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a failing non-output test', function () {
    var css = [
      '/* # Module: Assert */',
      '/* ---------------- */',
      '/* Test: Simple assertions */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '/*     - Output: [bool] false */',
      '/*     - Expected: [bool] true */',
      '/*     - Details: Broken tautology is broken. */'
    ].join('\n');
    var expected = [{
      module: "Assert",
      tests: [{
        test: "Simple assertions",
        assertions: [{
          description: "True should assert true.",
          passed: false,
          assertionType: 'assert-true',
          output: '[bool] false',
          expected: '[bool] true',
          details: 'Broken tautology is broken.'
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a failing non-output test with no failure details', function () {
    var css = [
      '/* # Module: Assert */',
      '/* ---------------- */',
      '/* Test: Simple assertions */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '/*   ✔ False should assert false */'
    ].join('\n');
    var expected = [{
      module: "Assert",
      tests: [{
        test: "Simple assertions",
        assertions: [
          {
            description: "True should assert true.",
            passed: false,
            assertionType: 'assert-true'
          },
          {
            description: "False should assert false",
            passed: true
          }
        ],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a passing output test', function () {
    var css = [
      '/* # Module: Assert */',
      '/* Test: CSS output assertions */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/* */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property: value; }',
      '',
      '/*   END_OUTPUT   */',
      '/* */',
      '/*   EXPECTED   */',
      '.test-output {',
      '  -property: value; }',
      '',
      '/*   END_EXPECTED   */',
      '/* */',
      '/*   END_ASSERT   */'
    ].join('\n');
    var expected = [{
      module: "Assert",
      tests: [{
        test: "CSS output assertions",
        assertions: [{
          description: "Input and output selector patterns match",
          assertionType: 'equal',
          passed: true,
          output: '.test-output {\n  -property: value;\n}',
          expected: '.test-output {\n  -property: value;\n}'
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a passing output test with loud comments', function () {
    var css = [
      '/* Some random loud comment */',
      '/* # Module: Assert */',
      '/* Test: CSS output assertions */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/* */',
      '/*   OUTPUT   */',
      '/* Some loud comment */',
      '.test-output {',
      '  -property: value; }',
      '',
      '/*   END_OUTPUT   */',
      '/* */',
      '/*   EXPECTED   */',
      '/* Some loud comment */',
      '.test-output {',
      '  -property: value; }',
      '',
      '/*   END_EXPECTED   */',
      '/* */',
      '/*   END_ASSERT   */'
    ].join('\n');
    var expected = [{
      module: "Assert",
      tests: [{
        test: "CSS output assertions",
        assertions: [{
          description: "Input and output selector patterns match",
          assertionType: 'equal',
          passed: true,
          output: '/* Some loud comment */\n\n.test-output {\n  -property: value;\n}',
          expected: '/* Some loud comment */\n\n.test-output {\n  -property: value;\n}'
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a failing output test', function () {
    var css = [
      '/* # Module: Assert */',
      '/* Test: CSS output assertions */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property: value1; }',
      '',
      '/*   END_OUTPUT   */',
      '/*   EXPECTED   */',
      '.test-output {',
      '  -property: value2; }',
      '',
      '/*   END_EXPECTED   */',
      '/*   END_ASSERT   */'
    ].join('\n');
    var expected = [{
      module: "Assert",
      tests: [{
        test: "CSS output assertions",
        assertions: [{
          description: "Input and output selector patterns match",
          assertionType: 'equal',
          passed: false,
          expected: '.test-output {\n  -property: value2;\n}',
          output: '.test-output {\n  -property: value1;\n}'
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('respects declaration order in output tests', function () {
    var css = [
      '/* # Module: Assert */',
      '/* Test: CSS output assertions */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property2: value2; ',
      '  -property1: value1; ',
      '}',
      '',
      '/*   END_OUTPUT   */',
      '/*   EXPECTED   */',
      '.test-output {',
      '  -property1: value1; ',
      '  -property2: value2; ',
      '}',
      '/*   END_EXPECTED   */',
      '/*   END_ASSERT   */'
    ].join('\n');
    var expected = [{
      module: "Assert",
      tests: [{
        test: "CSS output assertions",
        assertions: [{
          description: "Input and output selector patterns match",
          assertionType: 'equal',
          passed: false,
          expected: '.test-output {\n  -property1: value1;\n  -property2: value2;\n}',
          output: '.test-output {\n  -property2: value2;\n  -property1: value1;\n}',
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses tests of comment output', function () {
    var css = [
      '/* # Module: True Message */',
      '/* ---------------------- */',
      '/* Test: Simple messages */',
      '/*   ASSERT: Render as CSS comments   */',
      '/*   OUTPUT   */',
      '/* This is a simple message */',
      '/*   END_OUTPUT   */',
      '/*   EXPECTED   */',
      '/* This is a simple message */',
      '/*   END_EXPECTED   */',
      '/*   END_ASSERT   */',
      '/*  */',
    ].join('\n');
    var expected = [{
      module: "True Message",
      tests: [{
        test: "Simple messages",
        assertions: [{
          description: "Render as CSS comments",
          assertionType: 'equal',
          passed: true,
          expected: '/* This is a simple message */',
          output: '/* This is a simple message */',
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('ignores unexpected rule types', function () {
    var css = '.foo { -prop: value; }';

    expect(main.parse(css)).to.deep.equal([]);
  });

  it('throws error on unexpected rule type instead of end summary', function () {
    var css = [
      '/* # SUMMARY ---------- */',
      '.foo { -prop: value; }',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw([
      'Line 2, column 1: Unexpected rule type "rule"; looking for end summary.',
      '-- Context --',
      '/* # SUMMARY ---------- */',
      '.foo { -prop: value; }',
      '^'
    ].join('\n'));
  });

  it('accepts a number of context lines to display on error', function () {
    var css = [
      '/* # SUMMARY ---------- */',
      '.foo { -prop: value; }',
    ].join('\n');
    var attempt = function () { main.parse(css, 1); };

    expect(attempt).to.throw([
      'Line 2, column 1: Unexpected rule type "rule"; looking for end summary.',
      '-- Context --',
      '.foo { -prop: value; }',
      '^'
    ].join('\n'));
  });

  it('handles a blank comment before module header', function () {
    var css = [
      '/*  */',
      '/* # Module: M */'
    ].join('\n');

    expect(main.parse(css)).to.deep.equal([{
      module: "M",
      tests: []
    }]);
  });

  it('ignores unexpected rule type instead of test', function () {
    var css = [
      '/* # Module: M */',
      '.foo { -prop: value; }',
    ].join('\n');

    expect(main.parse(css)).to.deep.equal([{
      module: "M",
      tests: []
    }]);
  });

  it('handles a blank comment before test header', function () {
    var css = [
      '/* # Module: M */',
      '/*  */',
      '/* Test: T */',
    ].join('\n');

    expect(main.parse(css)).to.deep.equal([{
      module: "M",
      tests: [{
        test: "T",
        assertions: []
      }]
    }]);
  });

  it('ignores unexpected rule type instead of assertion', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '.foo { -prop: value; }',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(main.parse(css)).to.deep.equal([{
      module: "M",
      tests: [{
        test: "T",
        assertions: []
      }]
    }]);
  });

  it('handles a blank comment before assertion', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*  */',
      '/*   ✔ Does the thing right */'
    ].join('\n');

    expect(main.parse(css)).to.deep.equal([{
      module: "M",
      tests: [{
        test: "T",
        assertions: [{
          description: "Does the thing right",
          passed: true
        }]
      }]
    }]);
  });

  it('allows unexpected comment before next module header', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '/*     - foobar */',
      '/* # Module: M2 */',
    ].join('\n');
    expect(main.parse(css)).to.deep.equal([
      {
        module: "M",
        tests: [{
          test: "T",
          assertions: [{
            assertionType: "assert-true",
            description: "True should assert true.",
            passed: false,
          }]
        }],
      },
      {
        module: "M2",
        tests: [],
      }
    ]);
  });

  it('throws error on unexpected rule type instead of failure detail', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '.foo { -prop: val; }',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw(
      'Line 4, column 1: Unexpected rule type "rule"; looking for output/expected');
  });

  it('throws error on unexpected rule type instead of OUTPUT', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '.foo { -prop: val; }',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw(
      'Line 4, column 1: Unexpected rule type "rule"; looking for OUTPUT');
  });

  it('throws error on unexpected comment instead of OUTPUT', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/* foo */',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw(
      'Line 4, column 1: Unexpected comment "foo"; looking for OUTPUT');
  });

  it('throws error on unexpected rule type instead of EXPECTED', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property: value1; }',
      '',
      '/*   END_OUTPUT   */',
      '.foo { -prop: val; }',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw(
      'Line 9, column 1: Unexpected rule type "rule"; looking for EXPECTED');
  });

  it('throws error on unexpected comment instead of EXPECTED', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property: value1; }',
      '',
      '/*   END_OUTPUT   */',
      '/* foo */',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw(
      'Line 9, column 1: Unexpected comment "foo"; looking for EXPECTED');
  });

  it('throws error on unexpected rule type instead of END_ASSERT', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property: value1; }',
      '',
      '/*   END_OUTPUT   */',
      '/*   EXPECTED   */',
      '.test-output {',
      '  -property: value; }',
      '',
      '/*   END_EXPECTED   */',
      '.foo { -prop: val; }',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw(
      'Line 14, column 1: Unexpected rule type "rule"; looking for END_ASSERT');
  });

  it('throws error on unexpected comment instead of END_ASSERT', function () {
    var css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property: value1; }',
      '',
      '/*   END_OUTPUT   */',
      '/*   EXPECTED   */',
      '.test-output {',
      '  -property: value; }',
      '',
      '/*   END_EXPECTED   */',
      '/* foo */',
    ].join('\n');
    var attempt = function () { main.parse(css); };

    expect(attempt).to.throw(
      'Line 14, column 1: Unexpected comment "foo"; looking for END_ASSERT');
  });
});
