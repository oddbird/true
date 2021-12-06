"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitSelectorAndProperties = exports.cssStringToArrayOfRules = exports.removeNewLines = exports.startsWith = exports.isCommentNode = exports.falsyValues = void 0;
function falsyValues(item) {
    return Boolean(item);
}
exports.falsyValues = falsyValues;
function isCommentNode(node) {
    return node.type === 'comment';
}
exports.isCommentNode = isCommentNode;
function startsWith(text, token) {
    return text.indexOf(token) === 0;
}
exports.startsWith = startsWith;
function removeNewLines(cssString) {
    return cssString.replace(/\n/g, '');
}
exports.removeNewLines = removeNewLines;
function cssStringToArrayOfRules(cssString) {
    return removeNewLines(cssString)
        .split(/\s*}(?![\s]*["',}])/g)
        .filter(falsyValues);
}
exports.cssStringToArrayOfRules = cssStringToArrayOfRules;
function splitSelectorAndProperties(blocks) {
    return blocks.map(function (block) {
        var temp = block.split('{');
        var selector = temp[0];
        var output = temp[1];
        return { selector: selector, output: output };
    });
}
exports.splitSelectorAndProperties = splitSelectorAndProperties;
//# sourceMappingURL=utils.js.map