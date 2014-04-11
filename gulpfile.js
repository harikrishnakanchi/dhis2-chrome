var gulp = require('gulp');
var karma = require('gulp-karma');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('test', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: 'src/test/conf/karma.conf.js',
            action: 'run'
        })).on('error', function(err) {
            throw err;
        });
});

gulp.task('devtest', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: 'src/test/conf/karma.conf.js',
            action: 'watch',
            preprocessors: {}
        }));
});

gulp.task('lint', function() {
    return gulp.src(['./src/main/js/app/**/*.js', './src/test/js/app/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});

gulp.task('less', function() {
    var less = require('gulp-less');
    var path = require('path');

    return gulp.src('./src/main/less/main.less')
        .pipe(less())
        .pipe(gulp.dest('./src/main/css'));
});

gulp.task('watch', function() {
    return gulp.watch('./src/main/less/main.less', ['less']);
});