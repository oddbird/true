import { Comment, Node } from 'css';
export declare const truthyValues: (item?: any) => boolean;
export declare const isCommentNode: (node: Node) => node is Comment;
export declare const removeNewLines: (cssString: string) => string;
export declare const splitSelectorAndProperties: (blocks: string[]) => {
    selector: string;
    output: string;
}[];
export declare const cssStringToArrayOfRules: (cssString: string) => string[];
