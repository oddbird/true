/* eslint-env mocha, jest */

'use strict';

const path = require('path');

const main = require('../lib/main.js');

const sassFile = path.join(__dirname, 'scss', 'test.scss');
main.runSass({ file: sassFile }, { describe, it });
