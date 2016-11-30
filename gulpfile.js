// Gulp is a build system for javascript
// For reference go to http://gulpjs.com/
'use strict';

var gulp = require('gulp');
var gulpMocha = require('gulp-mocha');
var gutil = require('gulp-util');
var eslint = require('gulp-eslint');
var del = require('del');
var outDir = 'build';
var shell = require('gulp-shell');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('./tsconfig.json');
var tslint = require('gulp-tslint');
var stylish = require('gulp-tslint-stylish');
var sourcemaps = require('gulp-sourcemaps');
var gulpNewer = require('gulp-newer');
var fatalExit = true;

var paths = {
  typings: ['typings/**/*.d.ts'],
  srcTs: ['server/**/*.ts', 'common/**/*.ts', '!server/types/loopback.d.ts', '!server/types/loopback-context.d.ts'],
  srcJs: ['server*/**/*.js', 'common*/**/*.js'],
  testTs: ['test*/**/*.ts'],
  testJs: ['test*/**/*.js'],
  allJson: ['server*/**/*.json', 'common*/**/*.json', 'test*/**/*.json', 'package.json'],
  testRun: [outDir + '/test/**/*.js'],
};

function fatalError(err) {
  gutil.log('Fatal Error:' + err);
  if (fatalExit) {
    process.exit(1);
  }
}

gulp.task('clean', function() {
  return del([outDir]);
});

// process all the typescript files
gulp.task('build-ts', function(cb) {
  gutil.log('Building TypeScript from Source to ' + outDir);
  return tsProject.src() // Removed :{base: __dirname})
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .on('error', fatalError)
    .pipe(sourcemaps.write('.', {sourceRoot: __dirname + '/' + outDir}))
    .pipe(gulp.dest(outDir));
});

// process all the javascripts files
gulp.task('build-js', function() {
  //gutil.log("Copy javascript to " + outDir);
  return gulp.src(paths.srcJs.concat(paths.allJson))
    .pipe(gulpNewer({dest: outDir, ext: '.js'}))
    .pipe(gulp.dest(outDir))
    .on('error', fatalError);
});

// process all the test Javascript files
gulp.task('build-test-js', function() {
  return gulp.src(paths.testJs)
    .pipe(gulpNewer({dest: outDir, ext: '.js'}))
    .pipe(gulp.dest(outDir))
    .on('error', fatalError);

});

// Lint for javascript source directories
gulp.task('lint-js', function() {
  return gulp.src(paths.srcJs.concat(paths.testJs))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
    .on('error', fatalError);
});

// Lint for typescript source directories
gulp.task('lint-ts', function() {
  return gulp.src(paths.srcTs.concat(paths.testTs))
    .pipe(tslint())
    .pipe(tslint.report(stylish, {
      emitError: true,
      sort: true,
    }))
    .on('error', fatalError);
});

// Watch while live editing for lint errors
gulp.task('watch', function() {
  fatalExit = false;
  gulp.watch(paths.srcJs, ['lint-js', 'build-js']);
  gulp.watch(paths.srcTs.concat(paths.testTs), ['lint-ts', 'build-ts']);
  gulp.watch(paths.testJs, ['lint-test-js', 'build-test-js']);
});

// Run unit testing
gulp.task('test', ['build'], function() {
  gutil.log('Running Test at ' + paths.testRun);
  return gulp.src(paths.testRun)
    .pipe(gulpMocha({
      reporter: 'nyan',
      clearRequireCache: true,
      'ui': 'bdd'}))
    .on('error', fatalError);
});

// run the server
gulp.task('run', shell.task([
  'node ' + outDir + '/server/phoenix.js',
]));

gulp.task('build', ['build-ts', 'build-js', 'build-test-js']);
gulp.task('lint', ['build', 'lint-ts', 'lint-js']);
gulp.task('default', ['build', 'lint', 'test']);
gulp.task('start', ['run']);
