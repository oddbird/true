var _ = require('underscore');
var parseCss = require('css').parse;
var sass = require('node-sass');
var CssSelectorParser = require('css-selector-parser').CssSelectorParser;
var selectorParser = new CssSelectorParser();


// @@@ maybe catch errors and display as warnings instead?


module.exports.runSass = function (options, describe, it) {
  var assert = require('assert');
  var css = sass.renderSync(options);
  var modules = parse(css);

  _.each(modules, function (module) {
    describe(module.module, function () {
      _.each(module.tests, function (test) {
        it(test.test, function () {
          _.each(test.assertions, function (assertion) {
            if (!assertion.passed) {
              var msg = (
                assertion.description + ' ("' +
                  assertion.returned + '" ' +
                  assertion.assert + ' "' +
                  assertion.expected +
                  '")'
              );
              assert.fail(
                assertion.returned,
                assertion.expected,
                msg,
                assertion.assert
              );
            }
          });
        });
      });
    });
  });
};

// parse True output CSS and return an array of test modules.
var parse = module.exports.parse = function (css) {
  var modules = [];
  var ast = parseCss(css);

  _.each(_.where(ast.stylesheet.rules, {type: 'rule'}), function (rule) {
    var decls = _.where(rule.declarations, {type: 'declaration'});
    var declPairs = _.zip(
      _.pluck(decls, 'property'),
      _.pluck(decls, 'value')
    );
    var declInfo = _.object(declPairs);
    var curAssertion, declString;
    _.each(rule.selectors, function (sel) {
      var selInfo = parseSelector(sel);
      if (!selInfo) {
        throw new Error("Can't understand selector: " + sel);
      }
      var curModule = _.findWhere(modules, {module: selInfo.module});
      if (!curModule) {
        curModule = {module: selInfo.module, tests: []};
        modules.push(curModule);
      }
      var curTest = _.findWhere(curModule.tests, {test: selInfo.test});
      if (!curTest) {
        curTest = {test: selInfo.test, assertions: []};
        curModule.tests.push(curTest);
      }
      if (selInfo.output) {
        curAssertion = _.findWhere(
          curTest.assertions, {description: selInfo.assert});
        if (!curAssertion) {
          curAssertion = {
            description: selInfo.assert,
            assert: 'equal',
          };
          curTest.assertions.push(curAssertion);
        }
        declString = _.map(declPairs, function (pair) {
          return pair[0] + ': ' + pair[1] + ';';
        }).join(' ');
        if (selInfo.type === 'input') {
          curAssertion.returned = declString;
        } else { // if (selInfo.type == 'expect') {
          curAssertion.expected = declString;
        }
        if (curAssertion.returned && curAssertion.expected) {
          curAssertion.passed = curAssertion.returned === curAssertion.expected;
        }
      } else {
        curAssertion = {
          assert: selInfo.assert,
          description: (declInfo['-description'] || '""').slice(1, -1),
          passed: declInfo['-result'] === 'PASS',
        };
        _.each(_.pairs(declInfo), function (pair) {
          if (_.contains(['-expected--', '-returned--'], pair[0].slice(0, 11))) {
            var attr = pair[0].slice(1, 9);
            var type = pair[0].slice(11);
            var val = pair[1];
            curAssertion[attr] = type + ': ' + val;
          }
        });
        curTest.assertions.push(curAssertion);
      }
    });
  });

  return modules;
};


var parseSelector = module.exports.parseSelector = function (sel) {
  var rule = selectorParser.parse(sel).rule;
  var ret = {output: false};
  var attrName = function (rule, name) {
    return (rule &&
            rule.attrs &&
            rule.attrs.length == 1 &&
            rule.attrs[0].name === name
           );
  };
  if (attrName(rule, 'data-module')) {
    ret.module = rule.attrs[0].value;
    rule = rule.rule;
    if (attrName(rule, 'data-test')) {
      ret.test = rule.attrs[0].value;
      rule = rule.rule;
      if (attrName(rule, 'data-assert')) {
        ret.output = true;
        ret.assert = rule.attrs[0].value;
        rule = rule.rule;
        if (rule.classNames.length === 1 &&
            _.contains(['input', 'expect'], rule.classNames[0])) {
          ret.type = rule.classNames[0];
          return ret;
        }
      } else if (rule.classNames.length === 1 &&
                 rule.classNames[0].slice(0, 7) === 'assert-') {
        ret.assert = rule.classNames[0].slice(7);
        return ret;
      }
    }
  }
};
