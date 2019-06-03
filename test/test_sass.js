var path = require('path');

var main = require('../lib/main.js');

var sassFile = path.join(__dirname, 'scss', 'test.scss');
main.runSass({ file: sassFile }, { describe: describe, it: it });
