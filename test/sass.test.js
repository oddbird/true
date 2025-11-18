/* eslint-disable @typescript-eslint/no-require-imports */

const path = require('node:path');

const sassFile = path.join(__dirname, 'scss', 'test.scss');
const sassErrorFile = path.join(__dirname, 'scss', 'test-errors.scss');
let runSass;

if (process.env.USE_BUILT) {
  runSass = require('../lib').runSass;
} else {
  runSass = require('../src').runSass;
}
runSass({ describe, it }, sassFile);
runSass({ describe, it }, sassErrorFile, { silenceDeprecations: ['import'] });
