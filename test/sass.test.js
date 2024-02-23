/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

const path = require('node:path');

const sassFile = path.join(__dirname, 'scss', 'test.scss');
let runSass;
// eslint-disable-next-line no-process-env
if (process.env.USE_BUILT) {
  runSass = require('../lib').runSass;
} else {
  runSass = require('../src').runSass;
}
runSass({ describe, it, sass: 'sass-embedded' }, sassFile);
