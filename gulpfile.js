var gulp = require('gulp');
var karma = require('gulp-karma');

gulp.task('test', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: 'src/test/js/conf/karma.conf.js',
            action: 'run'
        }));
});

gulp.task('devtest', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: 'src/test/js/conf/karma.conf.js',
            action: 'watch'
        }));
});