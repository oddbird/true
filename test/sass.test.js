/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

import * as path from 'path';

import { runSass as runSassSrc } from '../src';

const sassFile = path.join(__dirname, 'scss', 'test.scss');
let runSass = runSassSrc;
// eslint-disable-next-line no-process-env
if (process.env.USE_BUILT) {
  runSass = require('../lib').runSass;
}
runSass({ file: sassFile }, { describe, it });
