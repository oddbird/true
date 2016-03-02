var _ = require('underscore');
var css = require('css');
var path = require('path');
var sass = require('node-sass');


module.exports.runSass = function (options, describe, it) {
  var assert = require('assert');
  var sassPath = path.join(__dirname, '..', 'sass');
  if (options.includePaths) {
    options.includePaths.push(sassPath);
  } else {
    options.includePaths = [sassPath];
  }
  var css = sass.renderSync(options).css.toString();
  var modules = parse(css);

  _.each(modules, function (module) {
    describe(module.module, function () {
      _.each(module.tests, function (test) {
        it(test.test, function () {
          _.each(test.assertions, function (assertion) {
            if (!assertion.passed) {
              var msg = (
                assertion.description + ' ("' +
                  assertion.output + '" ' +
                  assertion.assertionType + ' "' +
                  assertion.expected +
                  '")'
              );
              assert.fail(
                assertion.output,
                assertion.expected,
                msg,
                assertion.assertionType
              );
            }
          });
        });
      });
    });
  });
};


var parse = module.exports.parse = function (rawCss) {
  var ast = css.parse(rawCss);
  var ctx = { modules: [] };
  var handler = parseModule;

  _.each(ast.stylesheet.rules, function (rule) {
    handler = handler(rule, ctx);
  });

  finishCurrentModule(ctx);

  return ctx.modules;
};


var parseError = function (msg, seeking, pos) {
  throw new Error(
    'Line ' + pos.start.line + ', column ' + pos.start.column + ': ' +
      msg + '; looking for ' + seeking);
}


var parseModule = function (rule, ctx) {
  if (rule.type === 'charset') { return parseModule; }
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseModule; }
    if (text.substring(0, 10) === '# Module: ') {
      finishCurrentModule(ctx);
      ctx.currentModule = { module: text.substring(10), tests: [] };
      return parseTest;
    }
    parseError('Unexpected comment "' + text + '"', 'module header', rule.position);
  }
  parseError('Unexpected rule type "' + rule.type + '"', 'module header', rule.position);
};


var parseTest = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseTest; }
    if (text.match(/^-+$/)) {
      return parseTest;
    }
    if (text.substring(0, 6) === 'Test: ') {
      finishCurrentTest(ctx);
      ctx.currentTest = { test: text.substring(6), assertions: [] };
      return parseAssertion;
    }
    return parseModule(rule, ctx);
  }
  parseError('Unexpected rule type "' + rule.type + '"', 'test', rule.position);
};


var parseAssertion = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseAssertion; }
    if (text.substring(0, 2) === '✔ ') {
      finishCurrentAssertion(ctx);
      ctx.currentAssertion = {
        description: text.substring(2),
        passed: true
      };
      return parseAssertion;
    } else if (text.substring(0, 10) === '✖ FAILED [') {
      finishCurrentAssertion(ctx);
      var endAssertionType = text.indexOf(']');
      ctx.currentAssertion = {
        description: text.substring(endAssertionType + 2).trim(),
        passed: false,
        assertionType: text.substring(10, endAssertionType),
      };
      return parseFailureDetail;
    } else if (text.substring(0, 8) === 'ASSERT: ') {
      finishCurrentAssertion(ctx);
      ctx.currentAssertion = {
        description: text.substring(8),
        assertionType: 'equal'
      };
      return parseAssertionOutputStart;
    }
    return parseTest(rule, ctx);
  }
  parseError('Unexpected rule type "' + rule.type + '"', 'assertion', rule.position);
}


var parseFailureDetail = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (text.substring(0, 2) === '- ') {
      var startType = text.indexOf('[');
      var endType = text.indexOf(']');
      var type = text.substring(startType, endType + 1);
      var content = text.substring(endType + 3);
      var outputOrExpected;
      if (text.substring(2, startType) === 'Output ') {
        outputOrExpected = 'output';
      } else if (text.substring(2, startType) === 'Expected ') {
        outputOrExpected = 'expected';
      }
      if (outputOrExpected) {
        ctx.currentAssertion[outputOrExpected] = type + ' ' + content;
        return parseFailureDetail;
      }
    }
    return parseAssertion(rule, ctx);
  }
  parseError('Unexpected rule type "' + rule.type + '"', 'output/expected', rule.position);
};


var parseAssertionOutputStart = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseAssertionOutputStart; }
    if (text === 'OUTPUT') {
      ctx.currentOutputRules = [];
      return parseAssertionOutput;
    }
    parseError('Unexpected comment "' + text + '"', 'OUTPUT', rule.position);
  }
  parseError('Unexpected rule type "' + rule.type + '"', 'OUTPUT', rule.position);
};


var parseAssertionOutput = function (rule, ctx) {
  if (rule.type === 'comment') {
    if (rule.comment.trim() === 'END_OUTPUT') {
      ctx.currentAssertion.output = css.stringify(
        { stylesheet: { rules: ctx.currentOutputRules }});
      delete ctx.currentOutputRules;
      return parseAssertionExpectedStart;
    }
  }
  ctx.currentOutputRules.push(rule);
  return parseAssertionOutput;
};


var parseAssertionExpectedStart = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseAssertionOutputStart; }
    if (text === 'EXPECTED') {
      ctx.currentExpectedRules = [];
      return parseAssertionExpected;
    }
    parseError('Unexpected comment "' + text + '"', 'EXPECTED', rule.position);
  }
  parseError('Unexpected rule type "' + rule.type + '"', 'EXPECTED', rule.position);
};


var parseAssertionExpected = function (rule, ctx) {
  if (rule.type === 'comment') {
    if (rule.comment.trim() === 'END_EXPECTED') {
      ctx.currentAssertion.expected = css.stringify(
        { stylesheet: { rules: ctx.currentExpectedRules }});
      delete ctx.currentExpectedRules;
      ctx.currentAssertion.passed = (
        ctx.currentAssertion.output === ctx.currentAssertion.expected);
      return parseEndAssertion;
    }
  }
  ctx.currentExpectedRules.push(rule);
  return parseAssertionExpected;
};


var parseEndAssertion = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseEndAssertion; }
    if (text === 'END_ASSERT') {
      finishCurrentAssertion(ctx);
      return parseAssertion;
    }
    parseError('Unexpected comment "' + text + '"', 'END_ASSERT', rule.position);
  }
  parseError('Unexpected rule type "' + rule.type + '"', 'END_ASSERT', rule.position);
};


var finishCurrentModule = function (ctx) {
  finishCurrentTest(ctx);
  if (ctx.currentModule) {
    ctx.modules.push(ctx.currentModule);
    delete ctx.currentModule;
  }
}


var finishCurrentTest = function (ctx) {
  finishCurrentAssertion(ctx);
  if (ctx.currentTest) {
    ctx.currentModule.tests.push(ctx.currentTest);
    delete ctx.currentTest;
  }
}


var finishCurrentAssertion = function (ctx) {
  if (ctx.currentAssertion) {
    ctx.currentTest.assertions.push(ctx.currentAssertion);
    delete ctx.currentAssertion;
  }
}
