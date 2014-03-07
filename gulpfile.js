var gulp = require('gulp');
var karma = require('gulp-karma');

gulp.task('test', function() {
    return gulp.src('src/test/resources/js/app/**/*.js')
        .pipe(karma({
            configFile: 'src/test/resources/js/conf/karma.conf.js',
            action: 'run'
        }));
});