"use strict";
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.formatFailureMessage = exports.runSass = void 0;
const assert = __importStar(require("assert"));
const css = __importStar(require("css"));
const jest_diff_1 = require("jest-diff");
const lodash_1 = require("lodash");
const path = __importStar(require("path"));
const constants = __importStar(require("./constants"));
const utils_1 = require("./utils");
const runSass = function (sassOptions, trueOptions) {
    const sassOpts = Object.assign({}, sassOptions);
    const trueOpts = Object.assign({}, trueOptions);
    const sassPath = path.join(__dirname, '..', 'sass');
    if (sassOpts.includePaths) {
        sassOpts.includePaths.push(sassPath);
    }
    else {
        sassOpts.includePaths = [sassPath];
    }
    let sass;
    if (trueOpts.sass) {
        sass = trueOpts.sass;
    }
    else {
        // eslint-disable-next-line global-require
        sass = require('sass');
    }
    /* istanbul ignore if */
    if (!sass) {
        throw new Error('No Sass implementation found.');
    }
    // eslint-disable-next-line no-sync
    const parsedCss = sass.renderSync(sassOpts).css.toString();
    const modules = (0, exports.parse)(parsedCss, trueOpts.contextLines);
    (0, lodash_1.forEach)(modules, (module) => {
        describeModule(module, trueOpts.describe, trueOpts.it);
    });
};
exports.runSass = runSass;
const formatFailureMessage = function (assertion) {
    let msg = `${assertion.description} `;
    msg = `${msg}[type: ${assertion.assertionType}]`;
    if (assertion.details) {
        msg = `${msg} -- ${assertion.details}`;
    }
    msg = `${msg}\n\n${(0, jest_diff_1.diffStringsUnified)(assertion.expected || '', assertion.output || '')}\n`;
    return msg;
};
exports.formatFailureMessage = formatFailureMessage;
const describeModule = function (module, describe, it) {
    describe(module.module, () => {
        (0, lodash_1.forEach)(module.modules, (submodule) => {
            describeModule(submodule, describe, it);
        });
        (0, lodash_1.forEach)(module.tests, (test) => {
            it(test.test, () => {
                (0, lodash_1.forEach)(test.assertions, (assertion) => {
                    if (!assertion.passed) {
                        assert.fail((0, exports.formatFailureMessage)(assertion));
                    }
                });
            });
        });
    });
};
const finishCurrentModule = function (ctx) {
    finishCurrentTest(ctx);
    if (ctx.currentModule) {
        const paths = ctx.currentModule.module.split(constants.MODULE_NESTING_TOKEN);
        ctx.currentModule.module = (0, lodash_1.last)(paths) || '';
        insertModule(paths, ctx.currentModule, ctx);
        delete ctx.currentModule;
    }
};
const finishCurrentTest = function (ctx) {
    var _a, _b;
    finishCurrentAssertion(ctx);
    if (ctx.currentTest) {
        (_b = (_a = ctx.currentModule) === null || _a === void 0 ? void 0 : _a.tests) === null || _b === void 0 ? void 0 : _b.push(ctx.currentTest);
        delete ctx.currentTest;
    }
};
const finishCurrentAssertion = function (ctx) {
    var _a;
    if (ctx.currentAssertion) {
        (_a = ctx.currentTest) === null || _a === void 0 ? void 0 : _a.assertions.push(ctx.currentAssertion);
        delete ctx.currentAssertion;
    }
};
const insertModule = function (paths, module, ctx) {
    if (!ctx.modules) {
        ctx.modules = [];
    }
    if (paths.length > 1) {
        let newCtx = (0, lodash_1.find)(ctx.modules, { module: paths[0] });
        if (!newCtx) {
            newCtx = { module: paths[0] };
            ctx.modules.push(newCtx);
        }
        insertModule(paths.slice(1), module, newCtx);
    }
    else {
        ctx.modules.push(module);
    }
};
const dealWithAnnoyingMediaQueries = function (rawCSS) {
    const matchMediaQuery = /(@[a-zA-Z0-9:()\s-]+)/g;
    const matchCSSWithinMediaQueryBlock = /@[a-zA-Z0-9:()\s-]+{([a-zA-Z0-9:()\s-;._\\n{}]+)(?!}\\n})/g;
    const mediaqueries = rawCSS.match(matchMediaQuery);
    const rawCSSSansMediaQueries = rawCSS
        .replace(matchMediaQuery, '')
        .replace(matchCSSWithinMediaQueryBlock, '')
        .replace(/^{/, '');
    let matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
    let i = 0;
    let mediaQueryBasedSelectors = [];
    const mediaqueryRule = (rule) => ((mediaqueries === null || mediaqueries === void 0 ? void 0 : mediaqueries[i]) || '') + rule;
    while (matches !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        /* istanbul ignore if */
        if (matches.index === matchCSSWithinMediaQueryBlock.lastIndex) {
            // eslint-disable-next-line no-plusplus
            matchCSSWithinMediaQueryBlock.lastIndex++;
        }
        const cssWithinMediaQuery = (0, utils_1.removeNewLines)(matches[1]);
        const cssRules = (0, utils_1.cssStringToArrayOfRules)(cssWithinMediaQuery);
        mediaQueryBasedSelectors = mediaQueryBasedSelectors.concat(cssRules.map(mediaqueryRule));
        // eslint-disable-next-line no-plusplus
        i++;
        matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
    }
    return {
        mediaQueryBasedSelectors,
        rawCSSSansMediaQueries,
    };
};
const createSelectorsRulesPairs = function (cssString) {
    const processedMediaQueries = dealWithAnnoyingMediaQueries(cssString);
    const mediaQueries = (0, utils_1.splitSelectorAndProperties)(processedMediaQueries.mediaQueryBasedSelectors);
    const nonMediaQueries = processedMediaQueries.rawCSSSansMediaQueries;
    const blocks = (0, utils_1.cssStringToArrayOfRules)(nonMediaQueries);
    const splitBlocks = (0, utils_1.splitSelectorAndProperties)(blocks);
    return splitBlocks.concat(mediaQueries).filter(utils_1.truthyValues);
};
const contains = function (output, expected) {
    const outputBlocks = createSelectorsRulesPairs(output);
    const expectedBlocks = createSelectorsRulesPairs(expected);
    const results = expectedBlocks.map((block) => {
        const outputBlock = outputBlocks.find((element) => element.selector === block.selector);
        if (outputBlock) {
            // Turns a css string into an array of property-value pairs.
            const expectedProperties = block.output
                .split(';')
                .map((propertyValuePair) => propertyValuePair.trim())
                .filter((innerBlock) => innerBlock !== ' {' && innerBlock !== '}');
            // This is the assertion itself!
            return expectedProperties.every((property) => outputBlock.output.includes(property));
        }
        return false;
    });
    return results.every((result) => result === true);
};
const parse = function (rawCss, ctxLines) {
    const contextLines = typeof ctxLines === 'undefined' ? 10 : ctxLines;
    const lines = rawCss.split(/\r?\n/);
    const parseCss = function () {
        var _a;
        const ast = css.parse(rawCss);
        const ctx = { modules: [] };
        let handler = parseModule;
        (0, lodash_1.forEach)(((_a = ast.stylesheet) === null || _a === void 0 ? void 0 : _a.rules) || [], (rule) => {
            handler = handler(rule, ctx);
        });
        finishCurrentModule(ctx);
        return ctx.modules;
    };
    const parseError = function (msg, seeking, pos) {
        var _a, _b, _c, _d, _e, _f;
        const unknown = '<unknown>';
        let errorMsg = `Line ${(_b = (_a = pos === null || pos === void 0 ? void 0 : pos.start) === null || _a === void 0 ? void 0 : _a.line) !== null && _b !== void 0 ? _b : unknown}, ` +
            `column ${(_d = (_c = pos === null || pos === void 0 ? void 0 : pos.start) === null || _c === void 0 ? void 0 : _c.column) !== null && _d !== void 0 ? _d : unknown}: ${msg}; ` +
            `looking for ${seeking || unknown}.`;
        /* istanbul ignore else */
        if (((_e = pos === null || pos === void 0 ? void 0 : pos.start) === null || _e === void 0 ? void 0 : _e.line) && ((_f = pos === null || pos === void 0 ? void 0 : pos.start) === null || _f === void 0 ? void 0 : _f.column)) {
            errorMsg =
                `${errorMsg}\n` +
                    `-- Context --\n${lines
                        .slice(Math.max(0, pos.start.line - contextLines), pos.start.line)
                        .join('\n')}\n${' '.repeat(pos.start.column - 1)}^\n`;
        }
        return new Error(errorMsg);
    };
    const parseModule = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = (_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim();
            if (!text) {
                return parseModule;
            }
            if ((0, lodash_1.startsWith)(text, constants.MODULE_TOKEN)) {
                finishCurrentModule(ctx);
                ctx.currentModule = {
                    module: text.substring(constants.MODULE_TOKEN.length),
                    tests: [],
                };
                return parseTest;
            }
            if ((0, lodash_1.startsWith)(text, constants.SUMMARY_TOKEN)) {
                return ignoreUntilEndSummary;
            }
            // ignore un-recognized comments, keep looking for module header.
            return parseModule;
        }
        // ignore other rule types
        return parseModule;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ignoreUntilEndSummary = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = ((_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if ((0, lodash_1.startsWith)(text, constants.END_SUMMARY_TOKEN)) {
                return parseModule;
            }
            return ignoreUntilEndSummary;
        }
        throw parseError(`Unexpected rule type "${rule.type}"`, 'end summary', rule.position);
    };
    const parseTest = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = (_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim();
            if (!text) {
                return parseTest;
            }
            if (text.match(/^-+$/)) {
                return parseTest;
            }
            if ((0, lodash_1.startsWith)(text, constants.TEST_TOKEN)) {
                finishCurrentTest(ctx);
                ctx.currentTest = {
                    test: text.substring(constants.TEST_TOKEN.length),
                    assertions: [],
                };
                return parseAssertion;
            }
            return parseModule(rule, ctx);
        }
        // ignore other rule types
        return parseModule;
    };
    const parseAssertion = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = (_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trimStart();
            if (!text) {
                return parseAssertion;
            }
            if ((0, lodash_1.startsWith)(text, constants.PASS_TOKEN)) {
                finishCurrentAssertion(ctx);
                ctx.currentAssertion = {
                    description: text.substring(constants.PASS_TOKEN.length).trim() ||
                        '<no description>',
                    passed: true,
                };
                return parseAssertion;
            }
            else if ((0, lodash_1.startsWith)(text, constants.FAIL_TOKEN)) {
                finishCurrentAssertion(ctx);
                const endAssertionType = text.indexOf(constants.END_FAIL_TOKEN);
                ctx.currentAssertion = {
                    description: text.substring(endAssertionType + 2).trim(),
                    passed: false,
                    assertionType: text
                        .substring(constants.FAIL_TOKEN.length, endAssertionType)
                        .trim(),
                };
                return parseFailureDetail;
            }
            else if ((0, lodash_1.startsWith)(text, constants.ASSERT_TOKEN)) {
                finishCurrentAssertion(ctx);
                ctx.currentAssertion = {
                    description: text.substring(constants.ASSERT_TOKEN.length).trim(),
                    assertionType: 'equal',
                };
                return parseAssertionOutputStart;
            }
            return parseTest(rule, ctx);
        }
        // ignore other rule types
        return parseModule;
    };
    const parseFailureDetail = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = ((_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if ((0, lodash_1.startsWith)(text, constants.FAILURE_DETAIL_TOKEN)) {
                const detail = text.substring(constants.FAILURE_DETAIL_TOKEN.length);
                const isOutput = (0, lodash_1.startsWith)(detail, constants.OUTPUT_TOKEN);
                const isExpected = (0, lodash_1.startsWith)(detail, constants.EXPECTED_TOKEN);
                let outputOrExpected;
                if (isOutput) {
                    outputOrExpected = 'output';
                }
                else if (isExpected) {
                    outputOrExpected = 'expected';
                }
                if (outputOrExpected) {
                    /* istanbul ignore else */
                    if (ctx.currentAssertion) {
                        const startType = text.indexOf(constants.FAILURE_TYPE_START_TOKEN);
                        const endType = text.indexOf(constants.FAILURE_TYPE_END_TOKEN);
                        const type = text.substring(startType, endType + 1);
                        const content = text.substring(endType + 2);
                        ctx.currentAssertion[outputOrExpected] = `${type} ${content}`;
                    }
                    return parseFailureDetail;
                }
                const splitAt = detail.indexOf(constants.DETAILS_SEPARATOR_TOKEN);
                if (splitAt !== -1) {
                    /* istanbul ignore else */
                    if (ctx.currentAssertion) {
                        const key = detail.substring(0, splitAt);
                        ctx.currentAssertion[key.toLowerCase()] = detail.substring(splitAt + constants.DETAILS_SEPARATOR_TOKEN.length);
                    }
                    return parseFailureDetail;
                }
            }
            return parseAssertion(rule, ctx);
        }
        throw parseError(`Unexpected rule type "${rule.type}"`, 'output/expected', rule.position);
    };
    const parseAssertionOutputStart = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = (_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim();
            if (!text) {
                return parseAssertionOutputStart;
            }
            if (text === constants.OUTPUT_START_TOKEN) {
                ctx.currentOutputRules = [];
                return parseAssertionOutput;
            }
            throw parseError(`Unexpected comment "${text}"`, 'OUTPUT', rule.position);
        }
        throw parseError(`Unexpected rule type "${rule.type}"`, 'OUTPUT', rule.position);
    };
    const parseAssertionOutput = function (rule, ctx) {
        var _a, _b;
        if ((0, utils_1.isCommentNode)(rule)) {
            if (((_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim()) === constants.OUTPUT_END_TOKEN) {
                /* istanbul ignore else */
                if (ctx.currentAssertion) {
                    ctx.currentAssertion.output = css.stringify({
                        stylesheet: { rules: ctx.currentOutputRules || [] },
                    });
                }
                delete ctx.currentOutputRules;
                return parseAssertionExpectedStart;
            }
        }
        (_b = ctx.currentOutputRules) === null || _b === void 0 ? void 0 : _b.push(rule);
        return parseAssertionOutput;
    };
    const parseAssertionExpectedStart = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = (_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim();
            if (!text) {
                return parseAssertionExpectedStart;
            }
            if (text === constants.EXPECTED_START_TOKEN) {
                ctx.currentExpectedRules = [];
                return parseAssertionExpected;
            }
            if (text === constants.CONTAINED_START_TOKEN) {
                ctx.currentExpectedRules = [];
                return parseAssertionContained;
            }
            throw parseError(`Unexpected comment "${text}"`, 'EXPECTED', rule.position);
        }
        throw parseError(`Unexpected rule type "${rule.type}"`, 'EXPECTED', rule.position);
    };
    const parseAssertionExpected = function (rule, ctx) {
        var _a, _b;
        if ((0, utils_1.isCommentNode)(rule)) {
            if (((_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim()) === constants.EXPECTED_END_TOKEN) {
                /* istanbul ignore else */
                if (ctx.currentAssertion) {
                    ctx.currentAssertion.expected = css.stringify({
                        stylesheet: { rules: ctx.currentExpectedRules || [] },
                    });
                    ctx.currentAssertion.passed =
                        ctx.currentAssertion.output === ctx.currentAssertion.expected;
                }
                delete ctx.currentExpectedRules;
                return parseEndAssertion;
            }
        }
        (_b = ctx.currentExpectedRules) === null || _b === void 0 ? void 0 : _b.push(rule);
        return parseAssertionExpected;
    };
    const parseEndAssertion = function (rule, ctx) {
        var _a;
        if ((0, utils_1.isCommentNode)(rule)) {
            const text = (_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim();
            if (!text) {
                return parseEndAssertion;
            }
            if (text === constants.ASSERT_END_TOKEN) {
                finishCurrentAssertion(ctx);
                return parseAssertion;
            }
            throw parseError(`Unexpected comment "${text}"`, 'END_ASSERT', rule.position);
        }
        throw parseError(`Unexpected rule type "${rule.type}"`, 'END_ASSERT', rule.position);
    };
    const parseAssertionContained = function (rule, ctx) {
        var _a, _b;
        if ((0, utils_1.isCommentNode)(rule)) {
            if (((_a = rule.comment) === null || _a === void 0 ? void 0 : _a.trim()) === constants.CONTAINED_END_TOKEN) {
                /* istanbul ignore else */
                if (ctx.currentAssertion) {
                    ctx.currentAssertion.expected = css.stringify({
                        stylesheet: { rules: ctx.currentExpectedRules || [] },
                    });
                    ctx.currentAssertion.passed = contains(ctx.currentAssertion.output || '', ctx.currentAssertion.expected);
                    ctx.currentAssertion.assertionType = 'contains';
                }
                delete ctx.currentExpectedRules;
                return parseEndAssertion;
            }
        }
        (_b = ctx.currentExpectedRules) === null || _b === void 0 ? void 0 : _b.push(rule);
        return parseAssertionContained;
    };
    return parseCss();
};
exports.parse = parse;
//# sourceMappingURL=index.js.map