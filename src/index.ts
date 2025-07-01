import assert from 'node:assert';
import path from 'node:path';

import { diffStringsUnified } from 'jest-diff';
import {
  type AtRule as CssAtRule,
  type Comment as CssComment,
  parse as cssParse,
  type Position as NodePosition,
  type Rule as CssRule,
} from 'postcss';

import * as constants from './constants';
import {
  cssStringToArrayOfRules,
  generateCss,
  isCommentNode,
  removeNewLines,
  splitSelectorAndProperties,
  truthyValues,
} from './utils';

export interface TrueOptions {
  describe: (description: string, fn: () => void) => void;
  it: (description: string, fn: () => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sass?: any;
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

export type Rule = CssComment | CssRule | CssAtRule;

export type Parser = (rule: Rule, ctx: Context) => Parser;

const loadSass = function (sassPkg: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(sassPkg);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    throw new Error(`Cannot find Dart Sass (\`${sassPkg}\`) dependency.`);
  }
};

export const runSass = function (
  trueOptions: TrueOptions,
  src: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sassOptions?: any,
) {
  const trueOpts = Object.assign({}, trueOptions);
  const sassOpts = Object.assign({}, sassOptions);

  // Add True's sass to `loadPaths`
  const sassPath = path.join(__dirname, '..', 'sass');
  if (sassOpts.loadPaths) {
    sassOpts.loadPaths.push(sassPath);
  } else {
    sassOpts.loadPaths = [sassPath];
  }

  // Error if arguments match v6 API
  if (typeof src !== 'string' || !trueOptions.describe || !trueOptions.it) {
    throw new Error(
      'The arguments provided to `runSass` do not match the new API ' +
        'introduced in True v7. Refer to the v7 release notes ' +
        'for migration documentation: ' +
        'https://github.com/oddbird/true/releases/tag/v7.0.0',
    );
  }

  // Error if `style: "compressed"` is used
  if (sassOpts.style === 'compressed') {
    throw new Error(
      'True requires the default Sass `expanded` output style, ' +
        'but `style: "compressed"` was used.',
    );
  }

  let compiler;
  if (trueOpts.sass && typeof trueOpts.sass !== 'string') {
    compiler = trueOpts.sass;
  } else if (typeof trueOpts.sass === 'string') {
    compiler = loadSass(trueOpts.sass);
  } else {
    try {
      // try sass-embedded before sass
      compiler = loadSass('sass-embedded');
      /* c8 ignore next 11 */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e1) {
      try {
        compiler = loadSass('sass');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e2) {
        throw new Error(
          'Cannot find Dart Sass (`sass-embedded` or `sass`) dependency.',
        );
      }
    }
  }

  // Add the Sass Node.js package importer, if available
  if (!sassOpts.importers && compiler.NodePackageImporter) {
    sassOpts.importers = [new compiler.NodePackageImporter()];
  }

  const compilerFn =
    trueOpts.sourceType === 'string' ? 'compileString' : 'compile';
  const parsedCss = compiler[compilerFn](src, sassOpts).css;
  const modules = parse(parsedCss, trueOpts.contextLines);

  modules.forEach((module) => {
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
    module.modules?.forEach((submodule) => {
      describeModule(submodule, describe, it);
    });
    module.tests?.forEach((test) => {
      it(test.test, () => {
        test.assertions?.forEach((assertion) => {
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
    ctx.currentModule.module = paths[paths.length - 1] || '';
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
    let newCtx = ctx.modules.find((submod) => submod.module === paths[0]);
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
    /* c8 ignore next 3 */
    if (matches.index === matchCSSWithinMediaQueryBlock.lastIndex) {
      matchCSSWithinMediaQueryBlock.lastIndex++;
    }

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
    const ctx: Context = { modules: [] };
    let handler = parseModule;
    cssParse(rawCss).each((node) => {
      if (['comment', 'rule', 'atrule'].includes(node.type)) {
        handler = handler(node as Rule, ctx);
      }
    });

    finishCurrentModule(ctx);

    return ctx.modules;
  };

  const parseError = function (
    msg: string,
    seeking: string,
    start?: NodePosition | undefined,
  ) {
    const unknown = '<unknown>';
    let errorMsg =
      `Line ${start?.line ?? unknown}, ` +
      `column ${start?.column ?? unknown}: ${msg}; ` +
      `looking for ${seeking || unknown}.`;
    if (start?.line && start?.column) {
      errorMsg =
        `${errorMsg}\n` +
        `-- Context --\n${lines
          .slice(Math.max(0, start.line - contextLines), start.line)
          .join('\n')}\n${' '.repeat(start.column - 1)}^\n`;
    }
    return new Error(errorMsg);
  };

  const parseModule: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.text.trim();
      if (!text) {
        return parseModule;
      }
      if (text.startsWith(constants.MODULE_TOKEN)) {
        finishCurrentModule(ctx);
        ctx.currentModule = {
          module: text.substring(constants.MODULE_TOKEN.length),
          tests: [],
        };
        return parseTest;
      }
      if (text.startsWith(constants.SUMMARY_TOKEN)) {
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
      const text = rule.text.trim();
      if (text.startsWith(constants.END_SUMMARY_TOKEN)) {
        return parseModule;
      }
      return ignoreUntilEndSummary;
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'end summary',
      rule.source?.start,
    );
  };

  const parseTest: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.text.trim();
      if (!text) {
        return parseTest;
      }
      if (text.match(/^-+$/)) {
        return parseTest;
      }
      if (text.startsWith(constants.TEST_TOKEN)) {
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
      const text = rule.text.trim();
      if (!text) {
        return parseAssertion;
      }
      if (text.startsWith(constants.PASS_TOKEN)) {
        finishCurrentAssertion(ctx);
        ctx.currentAssertion = {
          description:
            text.substring(constants.PASS_TOKEN.length).trim() ||
            '<no description>',
          passed: true,
        };
        return parseAssertion;
      } else if (text.startsWith(constants.FAIL_TOKEN)) {
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
      } else if (text.startsWith(constants.ASSERT_TOKEN)) {
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
      const text = rule.text.trim();
      if (text.startsWith(constants.FAILURE_DETAIL_TOKEN)) {
        const detail = text.substring(constants.FAILURE_DETAIL_TOKEN.length);
        const isOutput = detail.startsWith(constants.OUTPUT_TOKEN);
        const isExpected = detail.startsWith(constants.EXPECTED_TOKEN);
        let outputOrExpected: 'output' | 'expected' | undefined;
        if (isOutput) {
          outputOrExpected = 'output';
        } else if (isExpected) {
          outputOrExpected = 'expected';
        }
        if (outputOrExpected) {
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
      rule.source?.start,
    );
  };

  const parseAssertionOutputStart: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      const text = rule.text.trim();
      if (!text) {
        return parseAssertionOutputStart;
      }
      if (text === constants.OUTPUT_START_TOKEN) {
        ctx.currentOutputRules = [];
        return parseAssertionOutput;
      }
      throw parseError(
        `Unexpected comment "${text}"`,
        'OUTPUT',
        rule.source?.start,
      );
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'OUTPUT',
      rule.source?.start,
    );
  };

  const parseAssertionOutput: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      if (rule.text.trim() === constants.OUTPUT_END_TOKEN) {
        if (ctx.currentAssertion) {
          ctx.currentAssertion.output = generateCss(
            ctx.currentOutputRules || [],
          );
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
      const text = rule.text.trim();
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
      if (text === constants.CONTAINS_STRING_START_TOKEN) {
        ctx.currentExpectedRules = [];
        return parseAssertionContainsString;
      }
      throw parseError(
        `Unexpected comment "${text}"`,
        'EXPECTED',
        rule.source?.start,
      );
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'EXPECTED',
      rule.source?.start,
    );
  };

  const parseAssertionExpected: Parser = function (rule, ctx) {
    if (isCommentNode(rule)) {
      if (rule.text.trim() === constants.EXPECTED_END_TOKEN) {
        if (ctx.currentAssertion) {
          ctx.currentAssertion.expected = generateCss(
            ctx.currentExpectedRules || [],
          );
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
      const text = rule.text.trim();
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
        rule.source?.start,
      );
    }
    throw parseError(
      `Unexpected rule type "${rule.type}"`,
      'END_ASSERT',
      rule.source?.start,
    );
  };

  const parseAssertionContained: Parser = function (rule, ctx) {
    if (
      isCommentNode(rule) &&
      rule.text.trim() === constants.CONTAINED_END_TOKEN
    ) {
      if (ctx.currentAssertion) {
        ctx.currentAssertion.expected = generateCss(
          ctx.currentExpectedRules || [],
        );
        ctx.currentAssertion.passed = contains(
          ctx.currentAssertion.output || '',
          ctx.currentAssertion.expected,
        );
        ctx.currentAssertion.assertionType = 'contains';
      }
      delete ctx.currentExpectedRules;
      return parseEndAssertion;
    }
    ctx.currentExpectedRules?.push(rule);
    return parseAssertionContained;
  };

  const parseAssertionContainsString: Parser = function (rule, ctx) {
    if (
      isCommentNode(rule) &&
      rule.text.trim() === constants.CONTAINS_STRING_END_TOKEN
    ) {
      if (ctx.currentAssertion) {
        // The string to find is wrapped in a Sass comment because it might not
        // always be a complete, valid CSS block on its own. These replace calls
        // are necessary to strip the leading `/*` and trailing `*/` characters
        // that enclose the string, so we're left with just the raw string to
        // find for accurate comparison.
        ctx.currentAssertion.expected = generateCss(
          ctx.currentExpectedRules || [],
        )
          .replace(new RegExp('^/\\*'), '')
          .replace(new RegExp('\\*/$'), '')
          .trim();
        ctx.currentAssertion.passed = ctx.currentAssertion.output?.includes(
          ctx.currentAssertion.expected,
        );
        ctx.currentAssertion.assertionType = 'contains-string';
      }
      delete ctx.currentExpectedRules;
      return parseEndAssertion;
    }
    ctx.currentExpectedRules?.push(rule);
    return parseAssertionContainsString;
  };

  return parseCss();
};
