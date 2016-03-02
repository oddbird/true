var expect = require('chai').expect;
var main = require('../lib/main.js');


describe('#runSass', function () {
  it('throws AssertionError on failure', function () {
    var sass = [
      '/* # Module: Assert */',
      '/* ---------------- */',
      '/* Test: Simple assertions */',
      '/*   ✖ FAILED [assert-true]: True should assert true. */',
      '/*     - Output [bool]: false */',
      '/*     - Expected [bool]: true */',
      '/*   ✔ False should assert false. */',
    ].join('\n');
    var mock = function (name, cb) { cb(); };
    var attempt = function () {
      main.runSass({data: sass}, mock, mock);
    };
    expect(attempt).to.throw(/True should assert true. \(\"\[bool\] false\" assert-true \"\[bool\] true\"\)/);
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

  it('parses a failing non-output test', function () {
    var css = [
      '/* # Module: Assert */',
      '/* ---------------- */',
      '/* Test: Simple assertions */',
      '/*   ✖ FAILED [assert-true]: True should assert true. */',
      '/*     - Output [bool]: false */',
      '/*     - Expected [bool]: true */'
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
          expected: '[bool] true'
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a passing output test', function () {
    var css = [
      '/* # Module: Assert */',
      '/* Test: CSS output assertions */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/*   OUTPUT   */',
      '.test-output {',
      '  -property: value; }',
      '',
      '/*   END_OUTPUT   */',
      '/*   EXPECTED   */',
      '.test-output {',
      '  -property: value; }',
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
          passed: true,
          output: '.test-output {\n  -property: value;\n}',
          expected: '.test-output {\n  -property: value;\n}'
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
});
