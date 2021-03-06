var gulp = require('gulp');
var path = require('path');
var del = require('del');
var rename = require("gulp-rename");
var runSequence = require('run-sequence');
var webserver = require('gulp-webserver');
var livereload = require('gulp-livereload');
var ghPages = require('gulp-gh-pages');

var sass = require('gulp-sass');
var scsslint = require('gulp-scss-lint');
var autoprefixer = require('gulp-autoprefixer');
var haml = require('gulp-haml');
var prettify = require('gulp-html-prettify');

var inject = require('gulp-inject');
var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var cheerio = require('gulp-cheerio');

gulp.task('clean', function() {
  return del("build");
});

gulp.task('haml', function () {
  return gulp.src('*.haml')
  .pipe(haml())
  .pipe(gulp.dest('build'));
});

gulp.task('prettify', function(callback) {
  return gulp.src('build/*.html')
  .pipe(prettify({indent_char: ' ', indent_size: 2}))
  .pipe(gulp.dest('build'));
});

gulp.task('inlineSvg', function () {
  var svgs = gulp.src('svg/*.svg')
  .pipe(svgmin(function (file) {
    var prefix = path.basename(file.relative, path.extname(file.relative));
    return {
      plugins: [{
        cleanupIDs: {
          prefix: prefix + '-',
          minify: true
        }
      }]
    }
  }))
  .pipe(cheerio({
    run: function ($) {
      $('[fill]').removeAttr('fill');
      $('title').remove();
    },
    parserOptions: { xmlMode: true }
  }))
  .pipe(svgstore({ inlineSvg: true }));
  function fileContents (filePath, file) {
    return file.contents.toString();
  }
  return gulp
  .src('build/index.html')
  .pipe(inject(svgs, { transform: fileContents }))
  .pipe(gulp.dest('build'));
});

gulp.task('sass', function () {
  gulp.src('scss/**/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(autoprefixer({
    browsers: ['last 2 versions'],
    cascade: false
  }))
  .pipe(gulp.dest('build'))
  .pipe(livereload());
});

gulp.task('js', function () {
  gulp.src(['js/**/*.js','js/**/*.mem'])
  .pipe(gulp.dest('build/js'))
  .pipe(livereload());
});

gulp.task('copy', function () {
  gulp.src('scss/_searchbox.scss')
  .pipe(rename('searchbox.scss'))
  .pipe(gulp.dest('build/scss'));
  gulp.src('scss/themes/*.scss')
  .pipe(gulp.dest('build/scss/themes'));
  gulp.src('favicon.ico')
  .pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('scss/**/*.scss', ['sass','copy','scss-lint']);
  gulp.watch('*.haml', ['build']);
  gulp.watch('js/**/*.js', ['js']);
});

gulp.task('webserver', function() {
  gulp.src('build')
    .pipe(webserver({
      host: '0.0.0.0',
      port: 1337,
      livereload: true,
      directoryListing: false,
      open: true
    }));
});

gulp.task('build',['clean'], function(callback) {
  runSequence('haml', 'inlineSvg', 'prettify', 'js', 'sass','copy', callback);
});

gulp.task('dev', function(callback) {
  runSequence('build', 'watch','webserver', callback);
});

gulp.task('deploy', function() {
  return gulp.src('build/**/*')
    .pipe(ghPages());
});

gulp.task('scss-lint', function() {
  return gulp.src('scss/*.scss')
    .pipe(scsslint({
      'config': '.scss-lint.yml'
    }));
});
