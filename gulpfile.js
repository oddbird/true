/* eslint-env node */

'use strict';

var beeper = require('beeper');
var chalk = require('chalk');
var gulp = require('gulp');
var log = require('fancy-log');
var sasslint = require('gulp-sass-lint');

var paths = {
  TEST_DIR: 'test/',
  SASS_DIR: 'sass/',
  IGNORE: [
    '!**/.#*',
    '!**/flycheck_*'
  ],
  init: function () {
    this.SASS = [
      this.SASS_DIR + '**/*.scss'
    ].concat(this.IGNORE);
    this.ALL_SASS = [
      this.SASS_DIR + '**/*.scss',
      this.TEST_DIR + '**/*.scss'
    ].concat(this.IGNORE);
    return this;
  }
}.init();

var onError = function (err) {
  log.error(chalk.red(err.message));
  beeper();
  this.emit('end');
};

var sasslintTask = function (src, failOnError) {
  var stream = gulp.src(src)
    .pipe(sasslint())
    .pipe(sasslint.format())
    .pipe(sasslint.failOnError());
  if (!failOnError) {
    stream.on('error', onError);
  }
  return stream;
};

gulp.task('sasslint', function () {
  return sasslintTask(paths.ALL_SASS);
});
