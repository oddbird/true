import { Comment, Node } from 'css';

export const truthyValues = (item?: any) => Boolean(item);

export const isCommentNode = (node: Node): node is Comment =>
  node.type === 'comment';

export const removeNewLines = (cssString: string) =>
  cssString.replace(/\n/g, '');

export const splitSelectorAndProperties = (blocks: string[]) =>
  blocks.map((block) => {
    const temp = block.split('{');
    const selector = temp[0];
    const output = temp[1];
    const splitBlock = { selector, output };
    return splitBlock;
  });

export const cssStringToArrayOfRules = (cssString: string) =>
  removeNewLines(cssString)
    .split(/\s*}(?![\s]*["',}])/g)
    .filter(truthyValues);
