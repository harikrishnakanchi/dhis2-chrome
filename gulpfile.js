var gulp = require('gulp');
var karma = require('gulp-karma');

gulp.task('test', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: 'src/test/conf/karma.conf.js',
            action: 'run'
        }));
});

gulp.task('devtest', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: 'src/test/conf/karma.conf.js',
            action: 'watch'
        }));
});

gulp.task('less', function() {
    var less = require('gulp-less');
    var path = require('path');

    gulp.src('./src/main/less/main.less')
        .pipe(less())
        .pipe(gulp.dest('./src/main/css'));
});

gulp.task('watch', function() {
    gulp.watch('./src/main/less/main.less', ['less']);
});