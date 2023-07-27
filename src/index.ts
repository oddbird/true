/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */

import {
  CssAtRuleAST,
  CssCommentAST,
  CssRuleAST,
  CssTypes,
  parse as cssParse,
  stringify as cssStringify,
} from '@adobe/css-tools';
import * as assert from 'assert';
import { diffStringsUnified } from 'jest-diff';
import { find, forEach, last, startsWith } from 'lodash';
import * as path from 'path';
import type { Options, StringOptions } from 'sass';
import { compile, compileString } from 'sass';

import * as constants from './constants';
import {
  cssStringToArrayOfRules,
  isCommentNode,
  removeNewLines,
  splitSelectorAndProperties,
  truthyValues,
} from './utils';

export interface TrueOptions {
  describe: (description: string, fn: () => void) => void;
  it: (description: string, fn: () => void) => void;
  sourceType?: 'path' | 'string';
  contextLines?: number;
}

export interface Assertion {
  description: string;
  assertionType?: string;
  output?: string;
  expected?: string;
  details?: string;
  passed?: boolean;
  [key: string]: boolean | string | undefined;
}

export interface Test {
  test: string;
  assertions: Assertion[];
}

export interface Module {
  module: string;
  tests?: Test[];
  modules?: Module[];
}

export type Context = {
  modules: Module[];
  currentModule?: Module;
  currentTest?: Test;
  currentAssertion?: Assertion;
  currentOutputRules?: Rule[];
  currentExpectedRules?: Rule[];
};

export type Rule = CssCommentAST | CssRuleAST | CssAtRuleAST;

export type Parser = (rule: Rule, ctx: Context) => Parser;

export const runSass = function (
  trueOptions: TrueOptions,
  src: string,
  sassOptions?: Options<'sync'> | StringOptions<'sync'>,
) {
  const trueOpts = Object.assign({}, trueOptions);
  const sassOpts = Object.assign({}, sassOptions);
  const sassPath = path.join(__dirname, '..', 'sass');
  if (sassOpts.loadPaths) {
    sassOpts.loadPaths.push(sassPath);
  } else {
    sassOpts.loadPaths = [sassPath];
  }

  const compiler = trueOpts.sourceType === 'string' ? compileString : compile;
  const parsedCss = compiler(src, sassOpts).css;
  const modules = parse(parsedCss, trueOpts.contextLines);

  forEach(modules, (module) => {
    describeModule(module, trueOpts.describe, trueOpts.it);
  });
};

export const formatFailureMessage = function (assertion: Assertion) {
  let msg = `${assertion.description} `;
  msg = `${msg}[type: ${assertion.assertionType}]`;
  if (assertion.details) {
    msg = `${msg} -- ${assertion.details}`;
  }
  msg = `${msg}\n\n${diffStringsUnified(
    assertion.expected || '',
    assertion.output || '',
  )}\n`;
  return msg;
};

const describeModule = function (
  module: Module,
  describe: TrueOptions['describe'],
  it: TrueOptions['it'],
) {
  describe(module.module, () => {
    forEach(module.modules, (submodule) => {
      describeModule(submodule, describe, it);
    });
    forEach(module.tests, (test) => {
      it(test.test, () => {
        forEach(test.assertions, (assertion) => {
          if (!assertion.passed) {
            assert.fail(formatFailureMessage(assertion));
          }
        });
      });
    });
  });
};

const finishCurrentModule = function (ctx: Context) {
  finishCurrentTest(ctx);
  if (ctx.currentModule) {
    const paths = ctx.currentModule.module.split(
      constants.MODULE_NESTING_TOKEN,
    );
    ctx.currentModule.module = last(paths) || '';
    insertModule(paths, ctx.currentModule, ctx);
    delete ctx.currentModule;
  }
};

const finishCurrentTest = function (ctx: Context) {
  finishCurrentAssertion(ctx);
  if (ctx.currentTest) {
    ctx.currentModule?.tests?.push(ctx.currentTest);
    delete ctx.currentTest;
  }
};

const finishCurrentAssertion = function (ctx: Context) {
  if (ctx.currentAssertion) {
    ctx.currentTest?.assertions.push(ctx.currentAssertion);
    delete ctx.currentAssertion;
  }
};

const insertModule = function (paths: string[], module: Module, ctx: Context) {
  if (!ctx.modules) {
    ctx.modules = [];
  }

  if (paths.length > 1) {
    let newCtx = find(ctx.modules, { module: paths[0] });
    if (!newCtx) {
      newCtx = { module: paths[0] };
      ctx.modules.push(newCtx);
    }
    insertModule(paths.slice(1), module, newCtx as Context);
  } else {
    ctx.modules.push(module);
  }
};

const dealWithAnnoyingMediaQueries = function (rawCSS: string) {
  const matchMediaQuery = /(@[a-zA-Z0-9:()\s-]+)/g;
  const matchCSSWithinMediaQueryBlock =
    /@[a-zA-Z0-9:()\s-]+{([a-zA-Z0-9:()\s-;._\\n{}]+)(?!}\\n})/g;

  const mediaqueries = rawCSS.match(matchMediaQuery);
  const rawCSSSansMediaQueries = rawCSS
    .replace(matchMediaQuery, '')
    .replace(matchCSSWithinMediaQueryBlock, '')
    .replace(/^{/, '');
  let matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
  let i = 0;
  let mediaQueryBasedSelectors: string[] = [];
  const mediaqueryRule = (rule: string) => (mediaqueries?.[i] || '') + rule;
  while (matches !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    /* istanbul ignore if */
    if (matches.index === matchCSSWithinMediaQueryBlock.lastIndex) {
      // eslint-disable-next-line no-plusplus
      matchCSSWithinMediaQueryBlock.lastIndex++;
    }

    const cssWithinMediaQuery = removeNewLines(matches[1]);
    const cssRules = cssStringToArrayOfRules(cssWithinMediaQuery);

    mediaQueryBasedSelectors = mediaQueryBasedSelectors.concat(
      cssRules.map(mediaqueryRule),
    );

    // eslint-disable-next-line no-plusplus
    i++;
    matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
  }

  return {
    mediaQueryBasedSelectors,
    rawCSSSansMediaQueries,
  };
};

const createSelectorsRulesPairs = function (cssString: string) {
  const processedMediaQueries = dealWithAnnoyingMediaQueries(cssString);
  const mediaQueries = splitSelectorAndProperties(
    processedMediaQueries.mediaQueryBasedSelectors,
  );
  const nonMediaQueries = processedMediaQueries.rawCSSSansMediaQueries;

  const blocks = cssStringToArrayOfRules(nonMediaQueries);

  const splitBlocks = splitSelectorAndProperties(blocks);

  return splitBlocks.concat(mediaQueries).filter(truthyValues);
};

const contains = function (output: string, expected: string) {
  const outputBlocks = createSelectorsRulesPairs(output);
  const expectedBlocks = createSelectorsRulesPairs(expected);

  const results = expectedBlocks.map((block) => {
    const matchingOutputBlocks = outputBlocks.filter(
      (element) => element.selector === block.selector,
    );
    if (matchingOutputBlocks.length) {
      // Turns a css string into an array of property-value pairs.
      const expectedProperties = block.output
        .split(';')
        .map((propertyValuePair) => propertyValuePair.trim())
        .filter(
          (innerBlock) =>
            innerBlock && innerBlock !== ' {' && innerBlock !== '}',
        );

      // This is the assertion itself!
      return expectedProperties.every((property) =>
        matchingOutputBlocks.some((outputBlock) =>
          outputBlock.output.includes(property),
        ),
      );
    }
    return false;
  });

  return results.every((result) => result === true);
};

export const parse = function (
  rawCss: Readonly<string>,
  ctxLines?: Readonly<number>,
): Module[] {
  const contextLines = typeof ctxLines === 'undefined' ? 10 : ctxLines;
  const lines = rawCss.split(/\r?\n/);

  const parseCss = function () {
    const ast = cssParse(rawCss);
    const ctx: Context = { modules: [] };
    let handler = parseModule;

    forEach(ast.stylesheet?.rules || [], (rule) => {
      handler = handler(rule, ctx);
    });

    finishCurrentModule(ctx);

    return ctx.modules;
  };

  const parseError = function (
    msg: string,
    seeking: string,
    pos: Rule['position'],
  ) {
    const unknown = '<unknown>';
    let errorMsg =
      `Line ${pos?.start?.line ?? unknown}, ` +
      `column ${pos?.start?.column ?? unknown}: ${msg}; ` +
      `looking for ${seeking || unknown}.`;
    /* istanbul ignore else */
    if (pos?.start?.line && pos?.start?.column) {
      errorMsg =
        `${errorMsg}\n` +
        `-- Context --\n${lines
          .slice(Math.max(0, pos.start.line - contextLines), pos.start.line)
          .join('\n')}\n${' '.repeat(pos.start.column - 1)}^\n`;
    }
    return new Error(errorMsg);
  };

  const parseModule: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trim();
      if (!text) {
        return parseModule;
      }
      if (startsWith(text, constants.MODULE_TOKEN)) {
        finishCurrentModule(ctx);
        ctx.currentModule = {
          module: text.substring(constants.MODULE_TOKEN.length),
          tests: [],
        };
        return parseTest;
      }
      if (startsWith(text, constants.SUMMARY_TOKEN)) {
        return ignoreUntilEndSummary;
      }
      // ignore un-recognized comments, keep looking for module header.
      return parseModule;
    }
    // ignore other rule types
    return parseModule;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ignoreUntilEndSummary: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trim() || '';
      if (startsWith(text, constants.END_SUMMARY_TOKEN)) {
        return parseModule;
      }
      return ignoreUntilEndSummary;
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'end summary',
      rule.position,
    );
  };

  const parseTest: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trim();
      if (!text) {
        return parseTest;
      }
      if (text.match(/^-+$/)) {
        return parseTest;
      }
      if (startsWith(text, constants.TEST_TOKEN)) {
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

  const parseAssertion: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trimStart();
      if (!text) {
        return parseAssertion;
      }
      if (startsWith(text, constants.PASS_TOKEN)) {
        finishCurrentAssertion(ctx);
        ctx.currentAssertion = {
          description:
            text.substring(constants.PASS_TOKEN.length).trim() ||
            '<no description>',
          passed: true,
        };
        return parseAssertion;
      } else if (startsWith(text, constants.FAIL_TOKEN)) {
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
      } else if (startsWith(text, constants.ASSERT_TOKEN)) {
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

  const parseFailureDetail: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trim() || '';
      if (startsWith(text, constants.FAILURE_DETAIL_TOKEN)) {
        const detail = text.substring(constants.FAILURE_DETAIL_TOKEN.length);
        const isOutput = startsWith(detail, constants.OUTPUT_TOKEN);
        const isExpected = startsWith(detail, constants.EXPECTED_TOKEN);
        let outputOrExpected: 'output' | 'expected' | undefined;
        if (isOutput) {
          outputOrExpected = 'output';
        } else if (isExpected) {
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
            ctx.currentAssertion[key.toLowerCase()] = detail.substring(
              splitAt + constants.DETAILS_SEPARATOR_TOKEN.length,
            );
          }
          return parseFailureDetail;
        }
      }
      return parseAssertion(rule, ctx);
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'output/expected',
      rule.position,
    );
  };

  const parseAssertionOutputStart: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trim();
      if (!text) {
        return parseAssertionOutputStart;
      }
      if (text === constants.OUTPUT_START_TOKEN) {
        ctx.currentOutputRules = [];
        return parseAssertionOutput;
      }
      throw parseError(`Unexpected comment "${text}"`, 'OUTPUT', rule.position);
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'OUTPUT',
      rule.position,
    );
  };

  const parseAssertionOutput: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      if (rule.comment?.trim() === constants.OUTPUT_END_TOKEN) {
        /* istanbul ignore else */
        if (ctx.currentAssertion) {
          ctx.currentAssertion.output = cssStringify({
            type: CssTypes.stylesheet,
            stylesheet: { rules: ctx.currentOutputRules || [] },
          });
        }
        delete ctx.currentOutputRules;
        return parseAssertionExpectedStart;
      }
    }
    ctx.currentOutputRules?.push(rule);
    return parseAssertionOutput;
  };

  const parseAssertionExpectedStart: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trim();
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
      throw parseError(
        `Unexpected comment "${text}"`,
        'EXPECTED',
        rule.position,
      );
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'EXPECTED',
      rule.position,
    );
  };

  const parseAssertionExpected: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      if (rule.comment?.trim() === constants.EXPECTED_END_TOKEN) {
        /* istanbul ignore else */
        if (ctx.currentAssertion) {
          ctx.currentAssertion.expected = cssStringify({
            type: CssTypes.stylesheet,
            stylesheet: { rules: ctx.currentExpectedRules || [] },
          });
          ctx.currentAssertion.passed =
            ctx.currentAssertion.output === ctx.currentAssertion.expected;
        }
        delete ctx.currentExpectedRules;
        return parseEndAssertion;
      }
    }
    ctx.currentExpectedRules?.push(rule);
    return parseAssertionExpected;
  };

  const parseEndAssertion: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.comment?.trim();
      if (!text) {
        return parseEndAssertion;
      }
      if (text === constants.ASSERT_END_TOKEN) {
        finishCurrentAssertion(ctx);
        return parseAssertion;
      }
      throw parseError(
        `Unexpected comment "${text}"`,
        'END_ASSERT',
        rule.position,
      );
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'END_ASSERT',
      rule.position,
    );
  };

  const parseAssertionContained: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      if (rule.comment?.trim() === constants.CONTAINED_END_TOKEN) {
        /* istanbul ignore else */
        if (ctx.currentAssertion) {
          ctx.currentAssertion.expected = cssStringify({
            type: CssTypes.stylesheet,
            stylesheet: { rules: ctx.currentExpectedRules || [] },
          });
          ctx.currentAssertion.passed = contains(
            ctx.currentAssertion.output || '',
            ctx.currentAssertion.expected,
          );
          ctx.currentAssertion.assertionType = 'contains';
        }
        delete ctx.currentExpectedRules;
        return parseEndAssertion;
      }
    }
    ctx.currentExpectedRules?.push(rule);
    return parseAssertionContained;
  };

  return parseCss();
};
