var css = require('css');
var find = require('lodash.find');
var forEach = require('lodash.foreach');
var last = require('lodash.last');
var path = require('path');
var sass = require('node-sass');

// Tokens defining the True CSS output language.
var MODULE_TOKEN = '# Module: ';
var MODULE_NESTING_TOKEN = ' :: ';
var SUMMARY_TOKEN = '# SUMMARY ';
var END_SUMMARY_TOKEN = '----------';
var TEST_TOKEN = 'Test: ';
var PASS_TOKEN = '✔ ';
var FAIL_TOKEN = '✖ FAILED: [';
var END_FAIL_TOKEN = ']';
var ASSERT_TOKEN = 'ASSERT: ';
var FAILURE_DETAIL_TOKEN = '- ';
var FAILURE_TYPE_START_TOKEN = '[';
var FAILURE_TYPE_END_TOKEN = ']';
var OUTPUT_TOKEN = 'Output: ';
var EXPECTED_TOKEN = 'Expected: ';
var DETAILS_SEPARATOR_TOKEN = ': ';
var OUTPUT_START_TOKEN = 'OUTPUT';
var OUTPUT_END_TOKEN = 'END_OUTPUT';
var EXPECTED_START_TOKEN = 'EXPECTED';
var EXPECTED_END_TOKEN = 'END_EXPECTED';
var CONTAINED_START_TOKEN = 'CONTAINED';
var CONTAINED_END_TOKEN = 'END_CONTAINED';
var ASSERT_END_TOKEN = 'END_ASSERT';

module.exports.runSass = function (options, describe, it, contextLines) {
  var sassPath = path.join(__dirname, '..', 'sass');
  if (options.includePaths) {
    options.includePaths.push(sassPath);
  } else {
    options.includePaths = [sassPath];
  }
  var css = sass.renderSync(options).css.toString();
  var modules = parse(css, contextLines);

  forEach(modules, function (module) {
    describeModule(module, describe, it);
  });
};

var formatFailureMessage = module.exports.formatFailureMessage = function (assertion) {
  var msg = (
    assertion.description + ' ("' +
      assertion.output + '" ' +
      assertion.assertionType + ' "' +
      assertion.expected +
      '"'
  );
  if (assertion.details) {
    msg += ' -- ' + assertion.details;
  }
  msg += ')';
  return msg;
};

var describeModule = function (module, describe, it) {
  var assert = require('assert');
  describe(module.module, function () {
    forEach(module.modules, function (submodule) {
      describeModule(submodule, describe, it);
    });
    forEach(module.tests, function (test) {
      it(test.test, function () {
        forEach(test.assertions, function (assertion) {
          if (!assertion.passed) {
            assert.fail(
              assertion.output,
              assertion.expected,
              formatFailureMessage(assertion),
              assertion.assertionType
            );
          }
        });
      });
    });
  });
};


var parse = module.exports.parse = function (rawCss, contextLines) {
  var contextLines = (typeof contextLines === 'undefined') ? 10 : contextLines;
  var lines = rawCss.split(/\r?\n/);

  var parseCss = function () {
    var ast = css.parse(rawCss);
    var ctx = { modules: [] };
    var handler = parseModule;

    forEach(ast.stylesheet.rules, function (rule) {
      handler = handler(rule, ctx);
    });

    finishCurrentModule(ctx);

    return ctx.modules;
  }


  var parseError = function (msg, seeking, pos) {
    return new Error(
      'Line ' + pos.start.line + ', ' +
        'column ' + pos.start.column + ': ' +
        msg + '; ' +
        'looking for ' + seeking + '.\n' +
        '-- Context --\n' +
        lines.slice(
          Math.max(0, pos.start.line - contextLines),
          pos.start.line
        ).join('\n') + '\n' +
        (' '.repeat(pos.start.column - 1)) + '^\n'
    );
  }


  var parseModule = function (rule, ctx) {
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
    // ignore other rule types
    return parseModule;
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
    // ignore other rule types
    return parseModule;
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
    // ignore other rule types
    return parseModule;
  }


  var parseFailureDetail = function (rule, ctx) {
    if (rule.type === 'comment') {
      var text = rule.comment.trim();
      if (startsWith(text, FAILURE_DETAIL_TOKEN)) {
        var detail = text.substring(FAILURE_DETAIL_TOKEN.length);
        var outputOrExpected;
        if (startsWith(detail, OUTPUT_TOKEN)) {
          outputOrExpected = 'output';
        } else if (startsWith(detail, EXPECTED_TOKEN)) {
          outputOrExpected = 'expected';
        }
        if (outputOrExpected) {
          var startType = text.indexOf(FAILURE_TYPE_START_TOKEN);
          var endType = text.indexOf(FAILURE_TYPE_END_TOKEN);
          var type = text.substring(startType, endType + 1);
          var content = text.substring(endType + 2);
          ctx.currentAssertion[outputOrExpected] = type + ' ' + content;
          return parseFailureDetail;
        }
        var splitAt = detail.indexOf(DETAILS_SEPARATOR_TOKEN);
        if (splitAt !== -1) {
          var key = detail.substring(0, splitAt);
          var value = detail.substring(splitAt + DETAILS_SEPARATOR_TOKEN.length);
          ctx.currentAssertion[key.toLowerCase()] = value;
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

      if (text === CONTAINED_START_TOKEN) {
        ctx.currentExpectedRules = [];
        return parseAssertionContained;
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


  var parseAssertionContained = function (rule, ctx) {
    if (rule.type === 'comment') {
      if (rule.comment.trim() === CONTAINED_END_TOKEN) {
        ctx.currentAssertion.expected = css.stringify(
          { stylesheet: { rules: ctx.currentExpectedRules }});
        delete ctx.currentExpectedRules;
        ctx.currentAssertion.passed = contains(ctx.currentAssertion.output, ctx.currentAssertion.expected);
        return parseEndAssertion;
      }
    }
    ctx.currentExpectedRules.push(rule);
    return parseAssertionContained;
  };


  return parseCss();
};

var falsyValues = function (item) {
  return Boolean(item);
}

var contains = function (output, expected) {
  var outputBlocks = createSelectorsRulesPairs(output);
  var expectedBlocks = createSelectorsRulesPairs(expected);

  var results = expectedBlocks.map(function (block) {
    var outputBlock = outputBlocks.find(function (element) {
      return element.selector === block.selector;
    });
    if (outputBlock) {
      // Turns a css string into an array of property-value pairs.
      var expectedProperties = block.output.split(';').map(function(propertyValuePair) {
        return propertyValuePair.trim();
      }).filter(function (block) {
        return block !== ' {' && block !== '}';
      });

      // This is the assertion itself!
      return expectedProperties.every(function (property) {
        return outputBlock.output.includes(property);
      });
    }
  });

  return results.every(function (result) {
    return result === true;
  });
}

var createSelectorsRulesPairs = function (cssString) {
  var processedMediaQueries = dealWithAnnoyingMediaQueries(cssString);
  var mediaQueries = splitSelectorAndProperties(processedMediaQueries.mediaQueryBasedSelectors);
  var nonMediaQueries = processedMediaQueries.rawCSSSansMediaQueries;

  var blocks = cssStringToArrayOfRules(nonMediaQueries);

  var splitBlocks = splitSelectorAndProperties(blocks);

  return splitBlocks.concat(mediaQueries).filter(falsyValues);
}

var splitSelectorAndProperties = function (blocks) {
  return blocks.map(function (block) {
    var temp = block.split('{');
    var selector = temp[0];
    var output = temp[1];
    var splitBlock = { selector:selector , output:output };
    return splitBlock;
  });
}

var removeNewLines = function (cssString) {
  return cssString.replace(/\n/g, '');
}

var cssStringToArrayOfRules = function (cssString) {
  return removeNewLines(cssString).split(/\s*}/g).filter(falsyValues);
}

var dealWithAnnoyingMediaQueries = function (rawCSS) {
  var matchMediaQuery = /(@[a-zA-Z0-9:\(\)\s\-]+)/g;
  var matchCSSWithinMediaQueryBlock = /@[a-zA-Z0-9:()\s-]+{([a-zA-Z0-9:()\s-;\._\\n{}]+)(?!}\\n})/g;

  var mediaqueries = rawCSS.match(matchMediaQuery);
  var rawCSSSansMediaQueries = rawCSS.replace(matchMediaQuery,'').replace(matchCSSWithinMediaQueryBlock,'').replace(/^{/,'');
  var matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
  var i = 0;
  var mediaQueryBasedSelectors = [];
  while (matches !== null) {
    /* istanbul ignore if */
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === matchCSSWithinMediaQueryBlock.lastIndex) {
        matchCSSWithinMediaQueryBlock.lastIndex++;
    }

    var cssWithinMediaQuery = removeNewLines(matches[1]);
    var cssRules = cssStringToArrayOfRules(cssWithinMediaQuery);

    mediaQueryBasedSelectors = mediaQueryBasedSelectors.concat(cssRules.map(function(rule) {
      return mediaqueries[i] + rule;
    }));

    i++;
    matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
  }

  return {
    mediaQueryBasedSelectors: mediaQueryBasedSelectors,
    rawCSSSansMediaQueries: rawCSSSansMediaQueries
  };
}

var finishCurrentModule = function (ctx) {
  finishCurrentTest(ctx);
  if (ctx.currentModule) {
    var path = ctx.currentModule.module.split(MODULE_NESTING_TOKEN);
    ctx.currentModule.module = last(path);
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
    var newCtx = find(ctx.modules, {module: path[0]});
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
