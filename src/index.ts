/* eslint-disable no-plusplus, no-unused-vars, no-var, no-use-before-define */

import * as path from 'path';
import * as assert from 'assert';

import type { Options } from 'sass';
import * as css from 'css';
import { find, forEach, last } from 'lodash';
import { Comment, Node } from 'css';
import * as chalk from 'chalk';

import {
  ASSERT_END_TOKEN,
  ASSERT_TOKEN,
  CONTAINED_END_TOKEN,
  CONTAINED_START_TOKEN,
  DETAILS_SEPARATOR_TOKEN,
  END_FAIL_TOKEN,
  END_SUMMARY_TOKEN,
  EXPECTED_END_TOKEN,
  EXPECTED_START_TOKEN,
  EXPECTED_TOKEN,
  FAIL_TOKEN,
  FAILURE_DETAIL_TOKEN,
  FAILURE_TYPE_END_TOKEN,
  FAILURE_TYPE_START_TOKEN,
  MODULE_NESTING_TOKEN,
  MODULE_TOKEN,
  OUTPUT_END_TOKEN,
  OUTPUT_START_TOKEN,
  OUTPUT_TOKEN,
  PASS_TOKEN,
  SUMMARY_TOKEN,
  TEST_TOKEN,
} from './constants';
import {
  cssStringToArrayOfRules,
  falsyValues,
  isCommentNode,
  removeNewLines,
  splitSelectorAndProperties,
  startsWith,
} from './utils';

export interface TrueOptions {
  sass?: typeof import('sass');
  describe: (description: string, fn: () => void) => void;
  it: (description: string, fn: () => void) => void;
  contextLines?: number;
}

export interface Assertion {
  description: string;
  output?: string;
  assertionType?: string;
  expected?: string;
  details?: string;
  passed?: boolean;
}

export interface Test {
  test: string;
  assertions: Assertion[];
}

export interface Module {
  module: string;
  tests: Test[];
  modules?: Module[];
}

export type Context = {
  modules: Module[];
  currentModule?: Module;
  currentTest?: Test;
  currentAssertion?: Assertion;
  currentOutputRules?: Node[];
  currentExpectedRules?: Node[];
};

export function formatFailureMessage(assertion: Assertion) {
  let msg = assertion.description;
  msg = `${msg} ("${assertion.output}"`;
  msg = `${msg} ${assertion.assertionType} "${assertion.expected}"`;
  if (assertion.details) {
    msg = `${msg} -- ${assertion.details}`;
  }
  msg = `${msg})`;
  msg = `${msg}\n${chalk.green('+ expected ')}${chalk.red('- actual')}`;
  msg = `${msg}\n\n${chalk.red(`-${assertion.output}`)}`;
  msg = `${msg}\n${chalk.green(`+${assertion.expected}\n`)}`;
  return msg;
}

function dealWithAnnoyingMediaQueries(rawCSS: string) {
  const matchMediaQuery = /(@[a-zA-Z0-9:()\s-]+)/g;
  // eslint-disable-next-line max-len
  const matchCSSWithinMediaQueryBlock = /@[a-zA-Z0-9:()\s-]+{([a-zA-Z0-9:()\s-;._\\n{}]+)(?!}\\n})/g;

  const mediaqueries = rawCSS.match(matchMediaQuery);
  const rawCSSSansMediaQueries = rawCSS
    .replace(matchMediaQuery, '')
    .replace(matchCSSWithinMediaQueryBlock, '')
    .replace(/^{/, '');
  let matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
  let i = 0;
  let mediaQueryBasedSelectors = [];
  const mediaqueryRule = /* istanbul ignore next */ (rule) =>
    mediaqueries[i] + rule;
  /* istanbul ignore next */
  while (matches !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === matchCSSWithinMediaQueryBlock.lastIndex) {
      matchCSSWithinMediaQueryBlock.lastIndex++;
    }

    /* istanbul ignore next */
    const cssWithinMediaQuery = removeNewLines(matches[1]);
    const cssRules = cssStringToArrayOfRules(cssWithinMediaQuery);

    mediaQueryBasedSelectors = mediaQueryBasedSelectors.concat(
      cssRules.map(mediaqueryRule),
    );

    i++;
    matches = matchCSSWithinMediaQueryBlock.exec(rawCSS);
  }

  return {
    mediaQueryBasedSelectors,
    rawCSSSansMediaQueries,
  };
}

function createSelectorsRulesPairs(cssString: string) {
  const processedMediaQueries = dealWithAnnoyingMediaQueries(cssString);
  const mediaQueries = splitSelectorAndProperties(
    processedMediaQueries.mediaQueryBasedSelectors,
  );
  const nonMediaQueries = processedMediaQueries.rawCSSSansMediaQueries;

  const blocks = cssStringToArrayOfRules(nonMediaQueries);

  const splitBlocks = splitSelectorAndProperties(blocks);

  return splitBlocks.concat(mediaQueries).filter(falsyValues);
}

function contains(output, expected) {
  const outputBlocks = createSelectorsRulesPairs(output);
  const expectedBlocks = createSelectorsRulesPairs(expected);

  const results = expectedBlocks.map((block) => {
    const outputBlock = outputBlocks.find(
      (element) => element.selector === block.selector,
    );
    if (outputBlock) {
      // Turns a css string into an array of property-value pairs.
      const expectedProperties = block.output
        .split(';')
        .map((propertyValuePair) => propertyValuePair.trim())
        .filter((innerBlock) => innerBlock !== ' {' && innerBlock !== '}');

      // This is the assertion itself!
      return expectedProperties.every((property) =>
        outputBlock.output.includes(property),
      );
    }
    return false;
  });

  return results.every((result) => result === true);
}

function finishCurrentAssertion(ctx: Context) {
  if (ctx.currentAssertion) {
    ctx.currentTest.assertions.push(ctx.currentAssertion);
    delete ctx.currentAssertion;
  }
}

function finishCurrentTest(ctx: Context) {
  finishCurrentAssertion(ctx);
  if (ctx.currentTest) {
    ctx.currentModule.tests.push(ctx.currentTest);
    delete ctx.currentTest;
  }
}

function insertModule(paths: string[], module: Module, ctx: Context) {
  if (!ctx.modules) {
    ctx.modules = [];
  }

  if (paths.length > 1) {
    let newCtx = find(ctx.modules, { module: paths[0] });
    if (!newCtx) {
      newCtx = { module: paths[0] };
      ctx.modules.push(newCtx);
    }
    insertModule(paths.slice(1), module, newCtx);
  } else {
    ctx.modules.push(module);
  }
}

function finishCurrentModule(ctx: Context) {
  finishCurrentTest(ctx);
  if (ctx.currentModule) {
    const paths = ctx.currentModule.module.split(MODULE_NESTING_TOKEN);
    ctx.currentModule.module = last(paths);
    insertModule(paths, ctx.currentModule, ctx);
    delete ctx.currentModule;
  }
}

function describeModule(
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
}

export function runSass(sassOptions: Options, trueOptions: TrueOptions): void {
  const sassOpts = Object.assign({}, sassOptions);
  const trueOpts = Object.assign({}, trueOptions);
  const sassPath = path.join(__dirname, '..', 'sass');
  if (sassOpts.includePaths) {
    sassOpts.includePaths.push(sassPath);
  } else {
    sassOpts.includePaths = [sassPath];
  }

  let sass;
  if (trueOpts.sass) {
    sass = trueOpts.sass;
  } else {
    // eslint-disable-next-line global-require
    sass = require('sass');
  }

  // eslint-disable-next-line no-sync
  const parsedCss = sass.renderSync(sassOpts).css.toString();
  const modules = parse(parsedCss, trueOpts.contextLines);

  forEach(modules, (module) => {
    describeModule(module, trueOpts.describe, trueOpts.it);
  });
}

export function parse(
  rawCss: Readonly<string>,
  ctxLines?: Readonly<number>,
): Module[] {
  const contextLines = typeof ctxLines === 'undefined' ? 10 : ctxLines;
  const lines = rawCss.split(/\r?\n/);

  function parseModule(rule: Comment, ctx: Context) {
    if (rule.type === 'comment') {
      const text = rule.comment.trim();
      if (!text) {
        return parseModule;
      }
      if (startsWith(text, MODULE_TOKEN)) {
        finishCurrentModule(ctx);
        ctx.currentModule = {
          module: text.substring(MODULE_TOKEN.length),
          tests: [],
        };
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
  }

  function parseCss() {
    const ast = css.parse(rawCss);
    const ctx: Context = { modules: [] };
    let handler = parseModule;

    forEach(ast.stylesheet.rules, (rule) => {
      handler = handler(rule, ctx);
    });

    finishCurrentModule(ctx);

    return ctx.modules;
  }

  function parseError(msg: string, seeking: string, pos: Node['position']) {
    const errorMsg =
      `Line ${pos.start.line}, ` +
      `column ${pos.start.column}: ${msg}; ` +
      `looking for ${seeking}.\n` +
      `-- Context --\n${lines
        .slice(Math.max(0, pos.start.line - contextLines), pos.start.line)
        .join('\n')}\n${' '.repeat(pos.start.column - 1)}^\n`;
    return new Error(errorMsg);
  }

  const ignoreUntilEndSummary = (rule: Node) => {
    if (isCommentNode(rule)) {
      const text = rule.comment.trim();
      if (startsWith(text, END_SUMMARY_TOKEN)) {
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

  const parseTest = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      const text = rule.comment.trim();
      if (!text) {
        return parseTest;
      }
      if (text.match(/^-+$/)) {
        return parseTest;
      }
      if (startsWith(text, TEST_TOKEN)) {
        finishCurrentTest(ctx);
        ctx.currentTest = {
          test: text.substring(TEST_TOKEN.length),
          assertions: [],
        };
        return parseAssertion;
      }
      return parseModule(rule, ctx);
    }
    // ignore other rule types
    return parseModule;
  };

  const parseAssertion = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      const text = rule.comment.trimStart();
      if (!text) {
        return parseAssertion;
      }
      if (startsWith(text, PASS_TOKEN)) {
        finishCurrentAssertion(ctx);
        ctx.currentAssertion = {
          description:
            text.substring(PASS_TOKEN.length).trim() || '<no description>',
          passed: true,
        };
        return parseAssertion;
      } else if (startsWith(text, FAIL_TOKEN)) {
        finishCurrentAssertion(ctx);
        const endAssertionType = text.indexOf(END_FAIL_TOKEN);
        ctx.currentAssertion = {
          description: text.substring(endAssertionType + 2).trim(),
          passed: false,
          assertionType: text
            .substring(FAIL_TOKEN.length, endAssertionType)
            .trim(),
        };
        return parseFailureDetail;
      } else if (startsWith(text, ASSERT_TOKEN)) {
        finishCurrentAssertion(ctx);
        ctx.currentAssertion = {
          description: text.substring(ASSERT_TOKEN.length).trim(),
          assertionType: 'equal',
        };
        return parseAssertionOutputStart;
      }
      return parseTest(rule, ctx);
    }
    // ignore other rule types
    return parseModule;
  };

  const parseFailureDetail = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      const text = rule.comment.trim();
      if (startsWith(text, FAILURE_DETAIL_TOKEN)) {
        const detail = text.substring(FAILURE_DETAIL_TOKEN.length);
        let outputOrExpected;
        if (startsWith(detail, OUTPUT_TOKEN)) {
          outputOrExpected = 'output';
        } else if (startsWith(detail, EXPECTED_TOKEN)) {
          outputOrExpected = 'expected';
        }
        if (outputOrExpected) {
          const startType = text.indexOf(FAILURE_TYPE_START_TOKEN);
          const endType = text.indexOf(FAILURE_TYPE_END_TOKEN);
          const type = text.substring(startType, endType + 1);
          const content = text.substring(endType + 2);
          ctx.currentAssertion[outputOrExpected] = `${type} ${content}`;
          return parseFailureDetail;
        }
        const splitAt = detail.indexOf(DETAILS_SEPARATOR_TOKEN);
        if (splitAt !== -1) {
          const key = detail.substring(0, splitAt);
          ctx.currentAssertion[key.toLowerCase()] = detail.substring(
            splitAt + DETAILS_SEPARATOR_TOKEN.length,
          );
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

  const parseAssertionOutputStart = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      const text = rule.comment.trim();
      if (!text) {
        return parseAssertionOutputStart;
      }
      if (text === OUTPUT_START_TOKEN) {
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

  const parseAssertionOutput = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      if (rule.comment.trim() === OUTPUT_END_TOKEN) {
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

  const parseAssertionExpectedStart = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      const text = rule.comment.trim();
      if (!text) {
        return parseAssertionExpectedStart;
      }
      if (text === EXPECTED_START_TOKEN) {
        ctx.currentExpectedRules = [];
        return parseAssertionExpected;
      }

      if (text === CONTAINED_START_TOKEN) {
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

  const parseAssertionExpected = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      if (rule.comment.trim() === EXPECTED_END_TOKEN) {
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

  const parseEndAssertion = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      const text = rule.comment.trim();
      if (!text) {
        return parseEndAssertion;
      }
      if (text === ASSERT_END_TOKEN) {
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

  const parseAssertionContained = (rule: Node, ctx: Context) => {
    if (isCommentNode(rule)) {
      if (rule.comment.trim() === CONTAINED_END_TOKEN) {
        ctx.currentAssertion.expected = css.stringify({
          stylesheet: { rules: ctx.currentExpectedRules },
        });
        delete ctx.currentExpectedRules;
        ctx.currentAssertion.passed = contains(
          ctx.currentAssertion.output,
          ctx.currentAssertion.expected,
        );
        return parseEndAssertion;
      }
    }
    ctx.currentExpectedRules.push(rule);
    return parseAssertionContained;
  };

  return parseCss();
}
