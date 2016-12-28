var _ = require('underscore');
var css = require('css');
var path = require('path');
var sass = require('node-sass');

// Tokens defining the True CSS output language.
var MODULE_TOKEN = '# Module: ';
var MODULE_NESTING_TOKEN = ' :: ';
var SUMMARY_TOKEN = '# SUMMARY ';
var END_SUMMARY_TOKEN = '----------';
var TEST_TOKEN = 'Test: ';
var PASS_TOKEN = '✔ ';
var FAIL_TOKEN = '✖ FAILED [';
var END_FAIL_TOKEN = ']';
var ASSERT_TOKEN = 'ASSERT: ';
var FAILURE_DETAIL_TOKEN = '- ';
var FAILURE_TYPE_START_TOKEN = '[';
var FAILURE_TYPE_END_TOKEN = ']';
var OUTPUT_TOKEN = 'Output ';
var EXPECTED_TOKEN = 'Expected ';
var OUTPUT_START_TOKEN = 'OUTPUT';
var OUTPUT_END_TOKEN = 'END_OUTPUT';
var EXPECTED_START_TOKEN = 'EXPECTED';
var EXPECTED_END_TOKEN = 'END_EXPECTED';
var ASSERT_END_TOKEN = 'END_ASSERT';

module.exports.runSass = function (options, describe, it) {
  var sassPath = path.join(__dirname, '..', 'sass');
  if (options.includePaths) {
    options.includePaths.push(sassPath);
  } else {
    options.includePaths = [sassPath];
  }
  var css = sass.renderSync(options).css.toString();
  var modules = parse(css);

  _.each(modules, function (module) {
    describeModule(module, describe, it);
  });
};

var describeModule = function (module, describe, it) {
  var assert = require('assert');
  describe(module.module, function () {
    _.each(module.modules, function (submodule) {
      describeModule(submodule, describe, it);
    });
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
  return new Error(
    'Line ' + pos.start.line + ', ' +
    'column ' + pos.start.column + ': ' +
    msg + '; ' +
    'looking for ' + seeking
  );
}


var parseModule = function (rule, ctx) {
  if (rule.type === 'charset') { return parseModule; }
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseModule; }
    if (startsWith(text, MODULE_TOKEN)) {
      finishCurrentModule(ctx);
      ctx.currentModule = { module: text.substring(MODULE_TOKEN.length), tests: [] };
      return parseTest;
    }
    if (startsWith(text, SUMMARY_TOKEN)) {
      return ignoreUntilEndSummary;
    }
    // ignore un-recognized comments, keep looking for module header.
    return parseModule;
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'module header', rule.position);
};


var ignoreUntilEndSummary = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (startsWith(text, END_SUMMARY_TOKEN)) {
      return parseModule;
    }
    return ignoreUntilEndSummary;
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'end summary', rule.position);
};


var parseTest = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseTest; }
    if (text.match(/^-+$/)) {
      return parseTest;
    }
    if (startsWith(text, TEST_TOKEN)) {
      finishCurrentTest(ctx);
      ctx.currentTest = { test: text.substring(TEST_TOKEN.length), assertions: [] };
      return parseAssertion;
    }
    return parseModule(rule, ctx);
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'test', rule.position);
};


var parseAssertion = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trimLeft();
    if (!text) { return parseAssertion; }
    if (startsWith(text, PASS_TOKEN)) {
      finishCurrentAssertion(ctx);
      ctx.currentAssertion = {
        description: text.substring(PASS_TOKEN.length).trim() || '<no description>',
        passed: true
      };
      return parseAssertion;
    } else if (startsWith(text, FAIL_TOKEN)) {
      finishCurrentAssertion(ctx);
      var endAssertionType = text.indexOf(END_FAIL_TOKEN);
      ctx.currentAssertion = {
        description: text.substring(endAssertionType + 2).trim(),
        passed: false,
        assertionType: text.substring(FAIL_TOKEN.length, endAssertionType).trim(),
      };
      return parseFailureDetail;
    } else if (startsWith(text, ASSERT_TOKEN)) {
      finishCurrentAssertion(ctx);
      ctx.currentAssertion = {
        description: text.substring(ASSERT_TOKEN.length).trim(),
        assertionType: 'equal'
      };
      return parseAssertionOutputStart;
    }
    return parseTest(rule, ctx);
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'assertion', rule.position);
}


var parseFailureDetail = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (startsWith(text, FAILURE_DETAIL_TOKEN)) {
      var startType = text.indexOf(FAILURE_TYPE_START_TOKEN);
      var endType = text.indexOf(FAILURE_TYPE_END_TOKEN);
      var type = text.substring(startType, endType + 1);
      var content = text.substring(endType + 3);
      var outputOrExpected;
      if (text.substring(FAILURE_DETAIL_TOKEN.length, startType) === OUTPUT_TOKEN) {
        outputOrExpected = 'output';
      } else if (text.substring(FAILURE_DETAIL_TOKEN.length, startType) === EXPECTED_TOKEN) {
        outputOrExpected = 'expected';
      }
      if (outputOrExpected) {
        ctx.currentAssertion[outputOrExpected] = type + ' ' + content;
        return parseFailureDetail;
      }
    }
    return parseAssertion(rule, ctx);
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'output/expected', rule.position);
};


var parseAssertionOutputStart = function (rule, ctx) {
  if (rule.type === 'comment') {
    var text = rule.comment.trim();
    if (!text) { return parseAssertionOutputStart; }
    if (text === OUTPUT_START_TOKEN) {
      ctx.currentOutputRules = [];
      return parseAssertionOutput;
    }
    throw parseError('Unexpected comment "' + text + '"', 'OUTPUT', rule.position);
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'OUTPUT', rule.position);
};


var parseAssertionOutput = function (rule, ctx) {
  if (rule.type === 'comment') {
    if (rule.comment.trim() === OUTPUT_END_TOKEN) {
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
    if (!text) { return parseAssertionExpectedStart; }
    if (text === EXPECTED_START_TOKEN) {
      ctx.currentExpectedRules = [];
      return parseAssertionExpected;
    }
    throw parseError('Unexpected comment "' + text + '"', 'EXPECTED', rule.position);
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'EXPECTED', rule.position);
};


var parseAssertionExpected = function (rule, ctx) {
  if (rule.type === 'comment') {
    if (rule.comment.trim() === EXPECTED_END_TOKEN) {
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
    if (text === ASSERT_END_TOKEN) {
      finishCurrentAssertion(ctx);
      return parseAssertion;
    }
    throw parseError('Unexpected comment "' + text + '"', 'END_ASSERT', rule.position);
  }
  throw parseError('Unexpected rule type "' + rule.type + '"', 'END_ASSERT', rule.position);
};


var finishCurrentModule = function (ctx) {
  finishCurrentTest(ctx);
  if (ctx.currentModule) {
    var path = ctx.currentModule.module.split(MODULE_NESTING_TOKEN);
    ctx.currentModule.module = _.last(path);
    insertModule(path, ctx.currentModule, ctx);
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


var insertModule = function (path, module, ctx) {
  if (!ctx.modules) { ctx.modules = [] };

  if (path.length > 1) {
    var newCtx = _.findWhere(ctx.modules, {module: path[0]});
    if (!newCtx) {
      newCtx = {module: path[0]};
      ctx.modules.push(newCtx);
    }
    insertModule(path.slice(1), module, newCtx);
  } else {
    ctx.modules.push(module);
  }
}


var startsWith = function (text, token) {
  return text.substring(0, token.length) === token;
}
