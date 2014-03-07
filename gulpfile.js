var gulp = require('gulp');
var karma = require('gulp-karma');

gulp.task('test', function() {
    return gulp.src(['src/main/**/*.js', 'src/test/js/app/**/*.js'])
        .pipe(karma({
            configFile: 'src/test/resources/js/conf/karma.conf.js',
            action: 'run'
        }));
});