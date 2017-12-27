var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var webpack = require('webpack');
var stream = require('webpack-stream');
var sourcemaps = require('gulp-sourcemaps');
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = require("./webpack.config.js");

gulp.task('webpack-dev-server', function (callback) {
  var compiler = webpack(webpackConfig);
  new WebpackDevServer(compiler).listen(8080, "localhost", function (err) {
    if (err) throw new gulpUtil.PluginError("webpack-dev-server", err);
    gulpUtil.log("[webpack-dev-server]", "http://localhost:8080/app/index.html");
  });
});

gulp.task('webpack', [], function () {
  return gulp.src('app')
    .pipe(sourcemaps.init())
    .pipe(stream(webpackConfig, require('webpack')))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('js'));
});

gulp.task('default', ['webpack']);
gulp.task('dev', ['webpack-dev-server']);
