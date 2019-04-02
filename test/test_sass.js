var path = require('path');
var main = require('../lib/main.js');
var sass = require('sass');
var fs = require('fs');
var path = require('path');

var sassFile = path.join(__dirname, 'scss', 'test.scss');
main.runSass({ file: sassFile }, describe, it);
main.runSass({
  data: '$_dart-sass: true;' + fs.readFileSync(sassFile, { encoding: 'utf-8' }),
  sass: sass,
  includePaths: [path.dirname(sassFile)]
}, describe, it);
