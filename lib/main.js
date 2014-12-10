var _ = require('underscore');
var parseCss = require('css').parse;


// @@@ maybe catch errors and display as warnings instead?


// parse True output CSS and return an array of test modules.
module.exports.parse = function (css) {
  var modules = [];
  var curModule, curTest, curAssertion, declInfo;
  var ast = parseCss(css);

  _.each(ast.stylesheet.rules, function (rule) {
    if (rule.selectors.length > 1) {
      throw new Error('too many selectors: ' + rule.selectors.join(', '));
    }
    var selInfo = parseSelector(rule.selectors[0]);
    curModule = _.findWhere(modules, {module: selInfo.module});
    if (!curModule) {
      curModule = {module: selInfo.module, tests: []};
      modules.push(curModule);
    }
    curTest = _.findWhere(curModule.tests, {test: selInfo.test});
    if (!curTest) {
      curTest = {test: selInfo.test, assertions: []};
      curModule.tests.push(curTest);
    }
    declInfo = _.object(
      _.pluck(rule.declarations, 'property'),
      _.pluck(rule.declarations, 'value')
    );
    if (selInfo.output) {
      throw new Error('no support for output selectors yet');
    } else {
      curTest.assertions.push({
        assert: selInfo.assert,
        description: declInfo['-description'].slice(1, -1),
        passed: declInfo['-result'] === 'PASS',
      });
    }
  });

  return modules;
};


// parse
var parseSelector = module.exports.parseSelector = function (sel) {
  var ret = {output: false};
  _.each(sel.split(' '), function (item) {
    if (_.first(item) === '[' && _.last(item) === ']') {
      var parts = item.slice(1, -1).split('=');
      if (parts[0] === 'data-module' ||
          parts[0] === 'data-test' ||
          parts[0] === 'data-assert') {
        var attr = parts[0].slice(5);
        if (_.first(parts[1]) === _.last(parts[1]) &&
            _.contains(["'", '"'], _.first(parts[1]))) {
          ret[attr] = parts[1].slice(1, -1);
        } else {
          throw new Error("badly-quoted attribute selector value: " + parts[1]);
        }
      } else {
        throw new Error("unexpected attribute selector: " + parts[0]);
      }
    } else if (item[0] == '.') {
      if (item.slice(0, 8) === '.assert-') {
        ret.assert = item.slice(8);
      } else if (item === '.input' || item === '.expect') {
        ret.type = item.slice(1);
        ret.output = true;
      } else {
        throw new Error("unexpected selector component: " + item);
      }
    } else {
      throw new Error("unexpected selector component: " + item);
    }
  });
  return ret;
};
