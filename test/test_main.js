var CODE = process.env.COVER ? '../lib-cov/' : '../lib/';

var expect = require('chai').expect;
var main = require(CODE + 'main.js');

describe('#parse', function () {
  it('parses a passing non-output test', function () {
    var css = [
      '[data-module="M"] [data-test="T"] .assert-equal {',
      '  -result: PASS;',
      "  -description: 'Desc';",
      '}'
    ].join('\n');
    var expected = [{
      module: "M",
      tests: [{
        test: "T",
        assertions: [{
          description: "Desc",
          assert: "equal",
          passed: true,
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('parses a failing non-output test', function () {
    var css = [
      '[data-module="M"] [data-test="T"] .assert-equal {',
      '  -result: FAIL;',
      "  -description: 'Desc';",
      '  -expected--string: one;',
      '  -returned--string: two;',
      '}'
    ].join('\n');
    var expected = [{
      module: "M",
      tests: [{
        test: "T",
        assertions: [{
          description: "Desc",
          assert: "equal",
          passed: false,
          expected: ['string', 'one'],
          returned: ['string', 'two'],
        }],
      }],
    }];

    expect(main.parse(css)).to.deep.equal(expected);
  });

  it('throws on more than one selector', function () {
    var attempt = function () { main.parse('.foo, .bar {}'); };

    expect(attempt).to.throw(/too many selectors: .foo, .bar/);
  });
});


describe('#parseSelector', function () {
  it('parses non-output test selector', function () {
    var sel = '[data-module="M"] [data-test="T"] .assert-equal';
    var exp = {
      output: false,
      module: "M",
      test: "T",
      assert: "equal",
    };

    expect(main.parseSelector(sel)).to.deep.equal(exp);
  });

  it('parses output test selector', function () {
    var sel = '[data-module="M"] [data-test="T"] [data-assert="A"] .input';
    var exp = {
      output: true,
      module: "M",
      test: "T",
      assert: "A",
      type: 'input',
    };

    expect(main.parseSelector(sel)).to.deep.equal(exp);
  });

  it('throws an error on badly-quoted attr selector', function () {
    var attempt = function () {
      main.parseSelector('[data-module=A]');
    };

    expect(attempt).to.throw(/badly-quoted attribute selector value: A/);
  });

  it('throws an error on unknown attr selector', function () {
    var attempt = function () {
      main.parseSelector('[data-foo="bar"]');
    };

    expect(attempt).to.throw(/unexpected attribute selector: data-foo/);
  });

  it('throws an error on unknown class selector', function () {
    var attempt = function () {
      main.parseSelector('.foo');
    };

    expect(attempt).to.throw(/unexpected selector component: .foo/);
  });

  it('throws an error on unknown selector type', function () {
    var attempt = function () {
      main.parseSelector('#foo');
    };

    expect(attempt).to.throw(/unexpected selector component: #foo/);
  });
});
