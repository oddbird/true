import { Comment, Node } from 'css';

export function falsyValues(item?: any) {
  return Boolean(item);
}

export function isCommentNode(node: Node): node is Comment {
  return node.type === 'comment';
}

export function startsWith(text: string, token: string) {
  return text.indexOf(token) === 0;
}

export function removeNewLines(cssString: string) {
  return cssString.replace(/\n/g, '');
}

export function cssStringToArrayOfRules(cssString: string) {
  return removeNewLines(cssString)
    .split(/\s*}(?![\s]*["',}])/g)
    .filter(falsyValues);
}

export function splitSelectorAndProperties(blocks: string[]) {
  return blocks.map((block) => {
    const temp = block.split('{');
    const selector = temp[0];
    const output = temp[1];
    return { selector, output };
  });
}
