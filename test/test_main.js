var expect = require('chai').expect;
var parse = require('../lib/main.js').parse;

describe('#parse', function () {
  it('parses a non-output test', function () {
    var css = [
      '[data-module="M"] [data-test="T"] .assert-equal {',
      '  -result: PASS;',
      "  -description: 'Desc';",
      '}'
    ].join('\n');
    var expected = [
    ];

    expect(parse(css)).to.deep.equal(expected);
  });
});
