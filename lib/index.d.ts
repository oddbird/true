import type { Options } from 'sass';
import { Node } from 'css';
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
export declare type Context = {
    modules: Module[];
    currentModule?: Module;
    currentTest?: Test;
    currentAssertion?: Assertion;
    currentOutputRules?: Node[];
    currentExpectedRules?: Node[];
};
export declare function formatFailureMessage(assertion: Assertion): string;
export declare function runSass(sassOptions: Options, trueOptions: TrueOptions): void;
export declare function parse(rawCss: Readonly<string>, ctxLines?: Readonly<number>): Module[];
