var CODE = process.env.COVER ? '../lib-cov/' : '../lib/';
var path = require('path');
var main = require(CODE + 'main.js');

var sassFile = path.join(__dirname, 'scss', 'test.scss');
main.runSass({file: sassFile}, describe, it);
