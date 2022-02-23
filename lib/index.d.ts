import * as css from 'css';
export interface TrueOptions {
    describe: (description: string, fn: () => void) => void;
    it: (description: string, fn: () => void) => void;
    sass?: any;
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
export declare type Context = {
    modules: Module[];
    currentModule?: Module;
    currentTest?: Test;
    currentAssertion?: Assertion;
    currentOutputRules?: Rule[];
    currentExpectedRules?: Rule[];
};
export declare type Rule = css.Comment | css.Rule | css.AtRule;
export declare type Parser = (rule: Rule, ctx: Context) => Parser;
export declare const runSass: (sassOptions: any, trueOptions: TrueOptions) => void;
export declare const formatFailureMessage: (assertion: Assertion) => string;
export declare const parse: (rawCss: Readonly<string>, ctxLines?: number | undefined) => Module[];
