/* eslint-env mocha, jest */

'use strict';

const path = require('path');

const chalk = require('chalk');
const expect = require('chai').expect;

const main = require('../lib/main.js');

describe('#fail', () => {
  it('formats failure message', () => {
    const msg = main.formatFailureMessage({
      description: 'It broke.',
      assertionType: 'assert-equal',
      expected: '1',
      output: '2',
      details: 'It really broke.',
    });
    const expected = `${'It broke. ("2" assert-equal "1" -- It really broke.)\n     '}${chalk.green(
      '+ expected ',
    )}${chalk.red('- actual')}\n\n     ${chalk.red('-2')}\n     ${chalk.green(
      '+1\n',
    )}`;

    expect(msg).to.equal(expected);
  });
});

describe('#runSass', () => {
  it('throws AssertionError on failure', () => {
    const sass = [
      '@use "true";',
      '@include true.test-module("Throw an error") {',
      '  @include true.test("assertionError") {',
      '    @include true.assert-true(false, "This test is meant to fail.");',
      '  }',
      '}',
    ].join('\n');
    const mock = function (name, cb) {
      cb();
    };
    const attempt = function () {
      main.runSass({ data: sass }, { describe: mock, it: mock });
    };
    expect(attempt).to.throw(
      'This test is meant to fail. ("[bool] false" assert-true "[bool] true")',
    );
  });

  it('can specify includePaths', () => {
    const sass = [
      '@use "true" as *;',
      '@use "include" as *;',
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
      '}',
    ].join('\n');
    const mock = function (name, cb) {
      cb();
    };
    const attempt = function () {
      main.runSass(
        {
          data: sass,
          includePaths: [path.join(__dirname, 'scss/includes')],
        },
        {
          describe: mock,
          it: mock,
        },
      );
    };
    expect(attempt).not.to.throw();
  });

  it('can specify sass engine to use', () => {
    const mock = function (name, cb) {
      cb();
    };
    const attempt = function () {
      main.runSass(
        {
          data: '',
        },
        {
          sass: {
            renderSync() {
              throw new Error('Custom sass implementation called');
            },
          },
          describe: mock,
          it: mock,
        },
      );
    };
    expect(attempt).to.throw('Custom sass implementation called');
  });
});

describe('#parse', () => {
  it('parses a passing non-output test', () => {
    const css = [
      '/* # Module: Utilities */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ Returns the sum of two numeric maps */',
    ].join('\n');
    const expected = [
      {
        module: 'Utilities',
        tests: [
          {
            test: 'Map Add [function]',
            assertions: [
              {
                description: 'Returns the sum of two numeric maps',
                passed: true,
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('ignores a summary', () => {
    const css = [
      '/* # SUMMARY ---------- */',
      '/* 17 Tests: */',
      '/*  - 14 Passed */',
      '/*  - 0 Failed */',
      '/*  - 3 Output to CSS */',
      '/* -------------------- */',
    ].join('\n');
    const expected = [];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a passing non-output test sans description', () => {
    const css = [
      '/* # Module: Utilities */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ */',
    ].join('\n');
    const expected = [
      {
        module: 'Utilities',
        tests: [
          {
            test: 'Map Add [function]',
            assertions: [
              {
                description: '<no description>',
                passed: true,
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a test following a summary', () => {
    const css = [
      '/* # SUMMARY ---------- */',
      '/* 17 Tests: */',
      '/*  - 14 Passed */',
      '/*  - 0 Failed */',
      '/*  - 3 Output to CSS */',
      '/* -------------------- */',
      '/* # Module: Utilities */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ Returns the sum of two numeric maps */',
    ].join('\n');
    const expected = [
      {
        module: 'Utilities',
        tests: [
          {
            test: 'Map Add [function]',
            assertions: [
              {
                description: 'Returns the sum of two numeric maps',
                passed: true,
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a nested passing non-output test', () => {
    const css = [
      '/* # Module: Utilities :: nested */',
      '/* ------------------- */',
      '/* Test: Map Add [function] */',
      '/*   ✔ Returns the sum of two numeric maps */',
    ].join('\n');
    const expected = [
      {
        module: 'Utilities',
        modules: [
          {
            module: 'nested',
            tests: [
              {
                test: 'Map Add [function]',
                assertions: [
                  {
                    description: 'Returns the sum of two numeric maps',
                    passed: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a failing non-output test', () => {
    const css = [
      '/* # Module: Assert */',
      '/* ---------------- */',
      '/* Test: Simple assertions */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '/*     - Output: [bool] false */',
      '/*     - Expected: [bool] true */',
      '/*     - Details: Broken tautology is broken. */',
    ].join('\n');
    const expected = [
      {
        module: 'Assert',
        tests: [
          {
            test: 'Simple assertions',
            assertions: [
              {
                description: 'True should assert true.',
                passed: false,
                assertionType: 'assert-true',
                output: '[bool] false',
                expected: '[bool] true',
                details: 'Broken tautology is broken.',
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a failing non-output test with no failure details', () => {
    const css = [
      '/* # Module: Assert */',
      '/* ---------------- */',
      '/* Test: Simple assertions */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '/*   ✔ False should assert false */',
    ].join('\n');
    const expected = [
      {
        module: 'Assert',
        tests: [
          {
            test: 'Simple assertions',
            assertions: [
              {
                description: 'True should assert true.',
                passed: false,
                assertionType: 'assert-true',
              },
              {
                description: 'False should assert false',
                passed: true,
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a passing output test', () => {
    const css = [
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
      '/*   END_ASSERT   */',
    ].join('\n');
    const expected = [
      {
        module: 'Assert',
        tests: [
          {
            test: 'CSS output assertions',
            assertions: [
              {
                description: 'Input and output selector patterns match',
                assertionType: 'equal',
                passed: true,
                output: '.test-output {\n  -property: value;\n}',
                expected: '.test-output {\n  -property: value;\n}',
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a passing output test with loud comments', () => {
    const css = [
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
      '/*   END_ASSERT   */',
    ].join('\n');
    const expected = [
      {
        module: 'Assert',
        tests: [
          {
            test: 'CSS output assertions',
            assertions: [
              {
                description: 'Input and output selector patterns match',
                assertionType: 'equal',
                passed: true,
                output:
                  '/* Some loud comment */\n\n.test-output {\n  -property: value;\n}',
                expected:
                  '/* Some loud comment */\n\n.test-output {\n  -property: value;\n}',
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a failing output test', () => {
    const css = [
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
      '/*   END_ASSERT   */',
    ].join('\n');
    const expected = [
      {
        module: 'Assert',
        tests: [
          {
            test: 'CSS output assertions',
            assertions: [
              {
                description: 'Input and output selector patterns match',
                assertionType: 'equal',
                passed: false,
                expected: '.test-output {\n  -property: value2;\n}',
                output: '.test-output {\n  -property: value1;\n}',
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('respects declaration order in output tests', () => {
    const css = [
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
      '/*   END_ASSERT   */',
    ].join('\n');
    const expected = [
      {
        module: 'Assert',
        tests: [
          {
            test: 'CSS output assertions',
            assertions: [
              {
                description: 'Input and output selector patterns match',
                assertionType: 'equal',
                passed: false,
                expected:
                  '.test-output {\n  -property1: value1;\n  -property2: value2;\n}',
                output:
                  '.test-output {\n  -property2: value2;\n  -property1: value1;\n}',
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses tests of comment output', () => {
    const css = [
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
    const expected = [
      {
        module: 'True Message',
        tests: [
          {
            test: 'Simple messages',
            assertions: [
              {
                description: 'Render as CSS comments',
                assertionType: 'equal',
                passed: true,
                expected: '/* This is a simple message */',
                output: '/* This is a simple message */',
              },
            ],
          },
        ],
      },
    ];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('ignores unexpected rule types', () => {
    const css = '.foo { -prop: value; }';

    expect(main.parse(css)).to.deep.equal([]);
  });

  it('throws error on unexpected rule type instead of end summary', () => {
    const css = ['/* # SUMMARY ---------- */', '.foo { -prop: value; }'].join(
      '\n',
    );
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      [
        'Line 2, column 1: Unexpected rule type "rule"; looking for end summary.',
        '-- Context --',
        '/* # SUMMARY ---------- */',
        '.foo { -prop: value; }',
        '^',
      ].join('\n'),
    );
  });

  it('accepts a number of context lines to display on error', () => {
    const css = ['/* # SUMMARY ---------- */', '.foo { -prop: value; }'].join(
      '\n',
    );
    const attempt = function () {
      main.parse(css, 1);
    };

    expect(attempt).to.throw(
      [
        'Line 2, column 1: Unexpected rule type "rule"; looking for end summary.',
        '-- Context --',
        '.foo { -prop: value; }',
        '^',
      ].join('\n'),
    );
  });

  it('handles a blank comment before module header', () => {
    const css = ['/*  */', '/* # Module: M */'].join('\n');

    expect(main.parse(css)).to.deep.equal([
      {
        module: 'M',
        tests: [],
      },
    ]);
  });

  it('ignores unexpected rule type instead of test', () => {
    const css = ['/* # Module: M */', '.foo { -prop: value; }'].join('\n');

    expect(main.parse(css)).to.deep.equal([
      {
        module: 'M',
        tests: [],
      },
    ]);
  });

  it('handles a blank comment before test header', () => {
    const css = ['/* # Module: M */', '/*  */', '/* Test: T */'].join('\n');

    expect(main.parse(css)).to.deep.equal([
      {
        module: 'M',
        tests: [
          {
            test: 'T',
            assertions: [],
          },
        ],
      },
    ]);
  });

  it('ignores unexpected rule type instead of assertion', () => {
    const css = [
      '/* # Module: M */',
      '/* Test: T */',
      '.foo { -prop: value; }',
    ].join('\n');

    expect(main.parse(css)).to.deep.equal([
      {
        module: 'M',
        tests: [
          {
            test: 'T',
            assertions: [],
          },
        ],
      },
    ]);
  });

  it('handles a blank comment before assertion', () => {
    const css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*  */',
      '/*   ✔ Does the thing right */',
    ].join('\n');

    expect(main.parse(css)).to.deep.equal([
      {
        module: 'M',
        tests: [
          {
            test: 'T',
            assertions: [
              {
                description: 'Does the thing right',
                passed: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('allows unexpected comment before next module header', () => {
    const css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '/*     - foobar */',
      '/* # Module: M2 */',
    ].join('\n');
    expect(main.parse(css)).to.deep.equal([
      {
        module: 'M',
        tests: [
          {
            test: 'T',
            assertions: [
              {
                assertionType: 'assert-true',
                description: 'True should assert true.',
                passed: false,
              },
            ],
          },
        ],
      },
      {
        module: 'M2',
        tests: [],
      },
    ]);
  });

  it('throws error on unexpected rule type instead of failure detail', () => {
    const css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ✖ FAILED: [assert-true] True should assert true. */',
      '.foo { -prop: val; }',
    ].join('\n');
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      'Line 4, column 1: Unexpected rule type "rule"; looking for output/expected',
    );
  });

  it('throws error on unexpected rule type instead of OUTPUT', () => {
    const css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '.foo { -prop: val; }',
    ].join('\n');
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      'Line 4, column 1: Unexpected rule type "rule"; looking for OUTPUT',
    );
  });

  it('throws error on unexpected comment instead of OUTPUT', () => {
    const css = [
      '/* # Module: M */',
      '/* Test: T */',
      '/*   ASSERT: Input and output selector patterns match   */',
      '/* foo */',
    ].join('\n');
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      'Line 4, column 1: Unexpected comment "foo"; looking for OUTPUT',
    );
  });

  it('throws error on unexpected rule type instead of EXPECTED', () => {
    const css = [
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
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      'Line 9, column 1: Unexpected rule type "rule"; looking for EXPECTED',
    );
  });

  it('throws error on unexpected comment instead of EXPECTED', () => {
    const css = [
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
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      'Line 9, column 1: Unexpected comment "foo"; looking for EXPECTED',
    );
  });

  it('throws error on unexpected rule type instead of END_ASSERT', () => {
    const css = [
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
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      'Line 14, column 1: Unexpected rule type "rule"; looking for END_ASSERT',
    );
  });

  it('throws error on unexpected comment instead of END_ASSERT', () => {
    const css = [
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
    const attempt = function () {
      main.parse(css);
    };

    expect(attempt).to.throw(
      'Line 14, column 1: Unexpected comment "foo"; looking for END_ASSERT',
    );
  });

  describe('#contains', () => {
    it('parses a passing output test', () => {
      const css = [
        '/* # Module: Contains */',
        '/* Test: CSS output contains */',
        '/*   ASSERT: Output selector pattern contains input pattern   */',
        '/* */',
        '/*   OUTPUT   */',
        '.test-output {',
        '  height: 10px;',
        '  width: 20px; }',
        '/*   END_OUTPUT   */',
        '/* */',
        '/*   CONTAINED   */',
        '.test-output {',
        '  height: 10px; }',
        '',
        '/*   END_CONTAINED   */',
        '/* */',
        '/*   END_ASSERT   */',
      ].join('\n');
      const expected = [
        {
          module: 'Contains',
          tests: [
            {
              test: 'CSS output contains',
              assertions: [
                {
                  description: 'Output selector pattern contains input pattern',
                  assertionType: 'equal',
                  passed: true,
                  output: '.test-output {\n  height: 10px;\n  width: 20px;\n}',
                  expected: '.test-output {\n  height: 10px;\n}',
                },
              ],
            },
          ],
        },
      ];

      expect(main.parse(css)).to.deep.equal(expected);
    });

    it('parses a passing output test with loud comments', () => {
      const css = [
        '/* Some random loud comment */',
        '/* # Module: Contains */',
        '/* Test: CSS output contains */',
        '/*   ASSERT: Output selector pattern contains input pattern   */',
        '/* */',
        '/*   OUTPUT   */',
        '/* Some loud comment */',
        '.test-output {',
        '  height: 10px;',
        '  width: 20px; }',
        '',
        '/*   END_OUTPUT   */',
        '/* */',
        '/*   CONTAINED   */',
        '/* Some loud comment */',
        '.test-output {',
        '  height: 10px; }',
        '',
        '/*   END_CONTAINED   */',
        '/* */',
        '/*   END_ASSERT   */',
      ].join('\n');
      const expected = [
        {
          module: 'Contains',
          tests: [
            {
              test: 'CSS output contains',
              assertions: [
                {
                  description: 'Output selector pattern contains input pattern',
                  assertionType: 'equal',
                  passed: true,
                  output:
                    '/* Some loud comment */\n\n.test-output {\n  height: 10px;\n  width: 20px;\n}',
                  expected:
                    '/* Some loud comment */\n\n.test-output {\n  height: 10px;\n}',
                },
              ],
            },
          ],
        },
      ];

      expect(main.parse(css)).to.deep.equal(expected);
    });

    it('parses a passing output test with curly braces within a content property', () => {
      const css = [
        '/* # Module: Contains */',
        '/* Test: CSS output contains */',
        '/*   ASSERT: Output selector pattern contains input pattern   */',
        '/* */',
        '/*   OUTPUT   */',
        '.test-output {',
        '  content: \'{ "a": 1, "b": 2 }\';',
        '  height: 10px;',
        '  width: 20px; }',
        '/*   END_OUTPUT   */',
        '/* */',
        '/*   CONTAINED   */',
        '.test-output {',
        '  content: \'{ "a": 1, "b": 2 }\'; }',
        '',
        '/*   END_CONTAINED   */',
        '/* */',
        '/*   END_ASSERT   */',
      ].join('\n');
      const expected = [
        {
          module: 'Contains',
          tests: [
            {
              test: 'CSS output contains',
              assertions: [
                {
                  description: 'Output selector pattern contains input pattern',
                  assertionType: 'equal',
                  passed: true,
                  output:
                    '.test-output {\n  content: \'{ "a": 1, "b": 2 }\';\n  height: 10px;\n  width: 20px;\n}',
                  expected:
                    '.test-output {\n  content: \'{ "a": 1, "b": 2 }\';\n}',
                },
              ],
            },
          ],
        },
      ];

      expect(main.parse(css)).to.deep.equal(expected);
    });

    it('parses a failing output test', () => {
      const css = [
        '/* # Module: Contains */',
        '/* Test: CSS output contains */',
        '/*   ASSERT: Output selector pattern contains input pattern   */',
        '/* */',
        '/*   OUTPUT   */',
        '.test-output {',
        '  height: 10px;',
        '  width: 20px; }',
        '',
        '/*   END_OUTPUT   */',
        '/* */',
        '/*   CONTAINED   */',
        '.test-output {',
        '  height: 20px; }',
        '',
        '/*   END_CONTAINED   */',
        '/* */',
        '/*   END_ASSERT   */',
      ].join('\n');
      const expected = [
        {
          module: 'Contains',
          tests: [
            {
              test: 'CSS output contains',
              assertions: [
                {
                  description: 'Output selector pattern contains input pattern',
                  assertionType: 'equal',
                  passed: false,
                  output: '.test-output {\n  height: 10px;\n  width: 20px;\n}',
                  expected: '.test-output {\n  height: 20px;\n}',
                },
              ],
            },
          ],
        },
      ];

      expect(main.parse(css)).to.deep.equal(expected);
    });

    it('parses a failing output test (wrong selector)', () => {
      const css = [
        '/* # Module: Contains */',
        '/* Test: CSS output contains */',
        '/*   ASSERT: Output selector pattern contains input pattern   */',
        '/* */',
        '/*   OUTPUT   */',
        '.test-output {',
        '  height: 10px;',
        '  width: 20px; }',
        '',
        '/*   END_OUTPUT   */',
        '/* */',
        '/*   CONTAINED   */',
        '.other-class {',
        '  height: 20px; }',
        '',
        '/*   END_CONTAINED   */',
        '/* */',
        '/*   END_ASSERT   */',
      ].join('\n');
      const expected = [
        {
          module: 'Contains',
          tests: [
            {
              test: 'CSS output contains',
              assertions: [
                {
                  description: 'Output selector pattern contains input pattern',
                  assertionType: 'equal',
                  passed: false,
                  output: '.test-output {\n  height: 10px;\n  width: 20px;\n}',
                  expected: '.other-class {\n  height: 20px;\n}',
                },
              ],
            },
          ],
        },
      ];

      expect(main.parse(css)).to.deep.equal(expected);
    });
  });
});
