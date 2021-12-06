"use strict";
/* eslint-disable no-plusplus, no-unused-vars, no-var, no-use-before-define */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.runSass = exports.formatFailureMessage = void 0;
var path = require("path");
var assert = require("assert");
var css = require("css");
var lodash_1 = require("lodash");
var chalk = require("chalk");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function formatFailureMessage(assertion) {
    var msg = assertion.description;
    msg = "".concat(msg, " (\"").concat(assertion.output, "\"");
    msg = "".concat(msg, " ").concat(assertion.assertionType, " \"").concat(assertion.expected, "\"");
    if (assertion.details) {
        msg = "".concat(msg, " -- ").concat(assertion.details);
    }
    msg = "".concat(msg, ")");
    msg = "".concat(msg, "\n").concat(chalk.green('+ expected ')).concat(chalk.red('- actual'));
    msg = "".concat(msg, "\n\n").concat(chalk.red("-".concat(assertion.output)));
    msg = "".concat(msg, "\n").concat(chalk.green("+".concat(assertion.expected, "\n")));
    return msg;
}
exports.formatFailureMessage = formatFailureMessage;
function dealWithAnnoyingMediaQueries(rawCSS) {
    var matchMediaQuery = /(@[a-zA-Z0-9:()\s-]+)/g;
    // eslint-disable-next-line max-len
    var matchCSSWithinMediaQueryBlock = /@[a-zA-Z0-9:()\s-]+{([a-zA-Z0-9:()\s-;._\\n{}]+)(?!}\\n})/g;
    var mediaqueries = rawCSS.match(matchMediaQuery);
    var rawCSSSansMediaQueries = rawCSS
        .replace(matchMediaQuery, '')
        .replace(matchCSSWithinMediaQueryBlock, '')
        .replace(/^{/, '');
    var matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
    var i = 0;
    var mediaQueryBasedSelectors = [];
    var mediaqueryRule = /* istanbul ignore next */ function (rule) {
        return mediaqueries[i] + rule;
    };
    /* istanbul ignore next */
    while (matches !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (matches.index === matchCSSWithinMediaQueryBlock.lastIndex) {
            matchCSSWithinMediaQueryBlock.lastIndex++;
        }
        /* istanbul ignore next */
        var cssWithinMediaQuery = (0, utils_1.removeNewLines)(matches[1]);
        var cssRules = (0, utils_1.cssStringToArrayOfRules)(cssWithinMediaQuery);
        mediaQueryBasedSelectors = mediaQueryBasedSelectors.concat(cssRules.map(mediaqueryRule));
        i++;
        matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
    }
    return {
        mediaQueryBasedSelectors: mediaQueryBasedSelectors,
        rawCSSSansMediaQueries: rawCSSSansMediaQueries,
    };
}
function createSelectorsRulesPairs(cssString) {
    var processedMediaQueries = dealWithAnnoyingMediaQueries(cssString);
    var mediaQueries = (0, utils_1.splitSelectorAndProperties)(processedMediaQueries.mediaQueryBasedSelectors);
    var nonMediaQueries = processedMediaQueries.rawCSSSansMediaQueries;
    var blocks = (0, utils_1.cssStringToArrayOfRules)(nonMediaQueries);
    var splitBlocks = (0, utils_1.splitSelectorAndProperties)(blocks);
    return splitBlocks.concat(mediaQueries).filter(utils_1.falsyValues);
}
function contains(output, expected) {
    var outputBlocks = createSelectorsRulesPairs(output);
    var expectedBlocks = createSelectorsRulesPairs(expected);
    var results = expectedBlocks.map(function (block) {
        var outputBlock = outputBlocks.find(function (element) { return element.selector === block.selector; });
        if (outputBlock) {
            // Turns a css string into an array of property-value pairs.
            var expectedProperties = block.output
                .split(';')
                .map(function (propertyValuePair) { return propertyValuePair.trim(); })
                .filter(function (innerBlock) { return innerBlock !== ' {' && innerBlock !== '}'; });
            // This is the assertion itself!
            return expectedProperties.every(function (property) {
                return outputBlock.output.includes(property);
            });
        }
        return false;
    });
    return results.every(function (result) { return result === true; });
}
function finishCurrentAssertion(ctx) {
    if (ctx.currentAssertion) {
        ctx.currentTest.assertions.push(ctx.currentAssertion);
        delete ctx.currentAssertion;
    }
}
function finishCurrentTest(ctx) {
    finishCurrentAssertion(ctx);
    if (ctx.currentTest) {
        ctx.currentModule.tests.push(ctx.currentTest);
        delete ctx.currentTest;
    }
}
function insertModule(paths, module, ctx) {
    if (!ctx.modules) {
        ctx.modules = [];
    }
    if (paths.length > 1) {
        var newCtx = (0, lodash_1.find)(ctx.modules, { module: paths[0] });
        if (!newCtx) {
            newCtx = { module: paths[0] };
            ctx.modules.push(newCtx);
        }
        insertModule(paths.slice(1), module, newCtx);
    }
    else {
        ctx.modules.push(module);
    }
}
function finishCurrentModule(ctx) {
    finishCurrentTest(ctx);
    if (ctx.currentModule) {
        var paths = ctx.currentModule.module.split(constants_1.MODULE_NESTING_TOKEN);
        ctx.currentModule.module = (0, lodash_1.last)(paths);
        insertModule(paths, ctx.currentModule, ctx);
        delete ctx.currentModule;
    }
}
function describeModule(module, describe, it) {
    describe(module.module, function () {
        (0, lodash_1.forEach)(module.modules, function (submodule) {
            describeModule(submodule, describe, it);
        });
        (0, lodash_1.forEach)(module.tests, function (test) {
            it(test.test, function () {
                (0, lodash_1.forEach)(test.assertions, function (assertion) {
                    if (!assertion.passed) {
                        assert.fail(formatFailureMessage(assertion));
                    }
                });
            });
        });
    });
}
function runSass(sassOptions, trueOptions) {
    var sassOpts = Object.assign({}, sassOptions);
    var trueOpts = Object.assign({}, trueOptions);
    var sassPath = path.join(__dirname, '..', 'sass');
    if (sassOpts.includePaths) {
        sassOpts.includePaths.push(sassPath);
    }
    else {
        sassOpts.includePaths = [sassPath];
    }
    var sass;
    if (trueOpts.sass) {
        sass = trueOpts.sass;
    }
    else {
        // eslint-disable-next-line global-require
        sass = require('sass');
    }
    // eslint-disable-next-line no-sync
    var parsedCss = sass.renderSync(sassOpts).css.toString();
    var modules = parse(parsedCss, trueOpts.contextLines);
    (0, lodash_1.forEach)(modules, function (module) {
        describeModule(module, trueOpts.describe, trueOpts.it);
    });
}
exports.runSass = runSass;
function parse(rawCss, ctxLines) {
    var contextLines = typeof ctxLines === 'undefined' ? 10 : ctxLines;
    var lines = rawCss.split(/\r?\n/);
    function parseModule(rule, ctx) {
        if (rule.type === 'comment') {
            var text = rule.comment.trim();
            if (!text) {
                return parseModule;
            }
            if ((0, utils_1.startsWith)(text, constants_1.MODULE_TOKEN)) {
                finishCurrentModule(ctx);
                ctx.currentModule = {
                    module: text.substring(constants_1.MODULE_TOKEN.length),
                    tests: [],
                };
                return parseTest;
            }
            if ((0, utils_1.startsWith)(text, constants_1.SUMMARY_TOKEN)) {
                return ignoreUntilEndSummary;
            }
            // ignore un-recognized comments, keep looking for module header.
            return parseModule;
        }
        // ignore other rule types
        return parseModule;
    }
    function parseCss() {
        var ast = css.parse(rawCss);
        var ctx = { modules: [] };
        var handler = parseModule;
        (0, lodash_1.forEach)(ast.stylesheet.rules, function (rule) {
            handler = handler(rule, ctx);
        });
        finishCurrentModule(ctx);
        return ctx.modules;
    }
    function parseError(msg, seeking, pos) {
        var errorMsg = "Line ".concat(pos.start.line, ", ") +
            "column ".concat(pos.start.column, ": ").concat(msg, "; ") +
            "looking for ".concat(seeking, ".\n") +
            "-- Context --\n".concat(lines
                .slice(Math.max(0, pos.start.line - contextLines), pos.start.line)
                .join('\n'), "\n").concat(' '.repeat(pos.start.column - 1), "^\n");
        return new Error(errorMsg);
    }
    var ignoreUntilEndSummary = function (rule) {
        if ((0, utils_1.isCommentNode)(rule)) {
            var text = rule.comment.trim();
            if ((0, utils_1.startsWith)(text, constants_1.END_SUMMARY_TOKEN)) {
                return parseModule;
            }
            return ignoreUntilEndSummary;
        }
        throw parseError("Unexpected rule type \"".concat(rule.type, "\""), 'end summary', rule.position);
    };
    var parseTest = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            var text = rule.comment.trim();
            if (!text) {
                return parseTest;
            }
            if (text.match(/^-+$/)) {
                return parseTest;
            }
            if ((0, utils_1.startsWith)(text, constants_1.TEST_TOKEN)) {
                finishCurrentTest(ctx);
                ctx.currentTest = {
                    test: text.substring(constants_1.TEST_TOKEN.length),
                    assertions: [],
                };
                return parseAssertion;
            }
            return parseModule(rule, ctx);
        }
        // ignore other rule types
        return parseModule;
    };
    var parseAssertion = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            var text = rule.comment.trimStart();
            if (!text) {
                return parseAssertion;
            }
            if ((0, utils_1.startsWith)(text, constants_1.PASS_TOKEN)) {
                finishCurrentAssertion(ctx);
                ctx.currentAssertion = {
                    description: text.substring(constants_1.PASS_TOKEN.length).trim() || '<no description>',
                    passed: true,
                };
                return parseAssertion;
            }
            else if ((0, utils_1.startsWith)(text, constants_1.FAIL_TOKEN)) {
                finishCurrentAssertion(ctx);
                var endAssertionType = text.indexOf(constants_1.END_FAIL_TOKEN);
                ctx.currentAssertion = {
                    description: text.substring(endAssertionType + 2).trim(),
                    passed: false,
                    assertionType: text
                        .substring(constants_1.FAIL_TOKEN.length, endAssertionType)
                        .trim(),
                };
                return parseFailureDetail;
            }
            else if ((0, utils_1.startsWith)(text, constants_1.ASSERT_TOKEN)) {
                finishCurrentAssertion(ctx);
                ctx.currentAssertion = {
                    description: text.substring(constants_1.ASSERT_TOKEN.length).trim(),
                    assertionType: 'equal',
                };
                return parseAssertionOutputStart;
            }
            return parseTest(rule, ctx);
        }
        // ignore other rule types
        return parseModule;
    };
    var parseFailureDetail = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            var text = rule.comment.trim();
            if ((0, utils_1.startsWith)(text, constants_1.FAILURE_DETAIL_TOKEN)) {
                var detail = text.substring(constants_1.FAILURE_DETAIL_TOKEN.length);
                var outputOrExpected = void 0;
                if ((0, utils_1.startsWith)(detail, constants_1.OUTPUT_TOKEN)) {
                    outputOrExpected = 'output';
                }
                else if ((0, utils_1.startsWith)(detail, constants_1.EXPECTED_TOKEN)) {
                    outputOrExpected = 'expected';
                }
                if (outputOrExpected) {
                    var startType = text.indexOf(constants_1.FAILURE_TYPE_START_TOKEN);
                    var endType = text.indexOf(constants_1.FAILURE_TYPE_END_TOKEN);
                    var type = text.substring(startType, endType + 1);
                    var content = text.substring(endType + 2);
                    ctx.currentAssertion[outputOrExpected] = "".concat(type, " ").concat(content);
                    return parseFailureDetail;
                }
                var splitAt = detail.indexOf(constants_1.DETAILS_SEPARATOR_TOKEN);
                if (splitAt !== -1) {
                    var key = detail.substring(0, splitAt);
                    ctx.currentAssertion[key.toLowerCase()] = detail.substring(splitAt + constants_1.DETAILS_SEPARATOR_TOKEN.length);
                    return parseFailureDetail;
                }
            }
            return parseAssertion(rule, ctx);
        }
        throw parseError("Unexpected rule type \"".concat(rule.type, "\""), 'output/expected', rule.position);
    };
    var parseAssertionOutputStart = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            var text = rule.comment.trim();
            if (!text) {
                return parseAssertionOutputStart;
            }
            if (text === constants_1.OUTPUT_START_TOKEN) {
                ctx.currentOutputRules = [];
                return parseAssertionOutput;
            }
            throw parseError("Unexpected comment \"".concat(text, "\""), 'OUTPUT', rule.position);
        }
        throw parseError("Unexpected rule type \"".concat(rule.type, "\""), 'OUTPUT', rule.position);
    };
    var parseAssertionOutput = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            if (rule.comment.trim() === constants_1.OUTPUT_END_TOKEN) {
                ctx.currentAssertion.output = css.stringify({
                    stylesheet: { rules: ctx.currentOutputRules },
                });
                delete ctx.currentOutputRules;
                return parseAssertionExpectedStart;
            }
        }
        ctx.currentOutputRules.push(rule);
        return parseAssertionOutput;
    };
    var parseAssertionExpectedStart = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            var text = rule.comment.trim();
            if (!text) {
                return parseAssertionExpectedStart;
            }
            if (text === constants_1.EXPECTED_START_TOKEN) {
                ctx.currentExpectedRules = [];
                return parseAssertionExpected;
            }
            if (text === constants_1.CONTAINED_START_TOKEN) {
                ctx.currentExpectedRules = [];
                return parseAssertionContained;
            }
            throw parseError("Unexpected comment \"".concat(text, "\""), 'EXPECTED', rule.position);
        }
        throw parseError("Unexpected rule type \"".concat(rule.type, "\""), 'EXPECTED', rule.position);
    };
    var parseAssertionExpected = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            if (rule.comment.trim() === constants_1.EXPECTED_END_TOKEN) {
                ctx.currentAssertion.expected = css.stringify({
                    stylesheet: { rules: ctx.currentExpectedRules },
                });
                delete ctx.currentExpectedRules;
                ctx.currentAssertion.passed =
                    ctx.currentAssertion.output === ctx.currentAssertion.expected;
                return parseEndAssertion;
            }
        }
        ctx.currentExpectedRules.push(rule);
        return parseAssertionExpected;
    };
    var parseEndAssertion = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            var text = rule.comment.trim();
            if (!text) {
                return parseEndAssertion;
            }
            if (text === constants_1.ASSERT_END_TOKEN) {
                finishCurrentAssertion(ctx);
                return parseAssertion;
            }
            throw parseError("Unexpected comment \"".concat(text, "\""), 'END_ASSERT', rule.position);
        }
        throw parseError("Unexpected rule type \"".concat(rule.type, "\""), 'END_ASSERT', rule.position);
    };
    var parseAssertionContained = function (rule, ctx) {
        if ((0, utils_1.isCommentNode)(rule)) {
            if (rule.comment.trim() === constants_1.CONTAINED_END_TOKEN) {
                ctx.currentAssertion.expected = css.stringify({
                    stylesheet: { rules: ctx.currentExpectedRules },
                });
                delete ctx.currentExpectedRules;
                ctx.currentAssertion.passed = contains(ctx.currentAssertion.output, ctx.currentAssertion.expected);
                return parseEndAssertion;
            }
        }
        ctx.currentExpectedRules.push(rule);
        return parseAssertionContained;
    };
    return parseCss();
}
exports.parse = parse;
//# sourceMappingURL=index.js.map