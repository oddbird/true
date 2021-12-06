import { Comment, Node } from 'css';
export declare function falsyValues(item?: any): boolean;
export declare function isCommentNode(node: Node): node is Comment;
export declare function startsWith(text: string, token: string): boolean;
export declare function removeNewLines(cssString: string): string;
export declare function cssStringToArrayOfRules(cssString: string): string[];
export declare function splitSelectorAndProperties(blocks: string[]): {
    selector: string;
    output: string;
}[];
