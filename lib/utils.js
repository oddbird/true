"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssStringToArrayOfRules = exports.splitSelectorAndProperties = exports.removeNewLines = exports.isCommentNode = exports.truthyValues = void 0;
const truthyValues = (item) => Boolean(item);
exports.truthyValues = truthyValues;
const isCommentNode = (node) => node.type === 'comment';
exports.isCommentNode = isCommentNode;
const removeNewLines = (cssString) => cssString.replace(/\n/g, '');
exports.removeNewLines = removeNewLines;
const splitSelectorAndProperties = (blocks) => blocks.map((block) => {
    const temp = block.split('{');
    const selector = temp[0];
    const output = temp[1];
    const splitBlock = { selector, output };
    return splitBlock;
});
exports.splitSelectorAndProperties = splitSelectorAndProperties;
const cssStringToArrayOfRules = (cssString) => (0, exports.removeNewLines)(cssString)
    .split(/\s*}(?![\s]*["',}])/g)
    .filter(exports.truthyValues);
exports.cssStringToArrayOfRules = cssStringToArrayOfRules;
//# sourceMappingURL=utils.js.map