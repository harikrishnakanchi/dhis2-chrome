var gulp = require('gulp');
var karma = require('gulp-karma');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var shell = require('gulp-shell');
var http = require('http');
var ecstatic = require('ecstatic');
var protractor = require('gulp-protractor').protractor;
var download = require('gulp-download');
var argv = require('yargs').argv;
var karmaConf = 'src/test/unit/conf/karma.conf.js';
var webserver;
var fs = require('fs');
var rename = require('gulp-rename');
var path = require('path');
var ChromeExtension = require("crx");
var preprocess = require("gulp-preprocess");
var cat = require("gulp-cat");

var base_url = argv.url || "http://localhost:8080";
var auth = argv.auth || "Basic c2VydmljZS5hY2NvdW50OiFBQkNEMTIzNA==";

gulp.task('test', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: karmaConf,
            action: 'run'
        })).on('error', function(err) {
            throw err;
        });
});

gulp.task('update-webdriver', shell.task([
    './node_modules/protractor/bin/webdriver-manager update'
]));

gulp.task('devtest', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: karmaConf,
            action: 'watch',
            preprocessors: {}
        }));
});

gulp.task('start-http', function() {
    webserver = http.createServer(
        ecstatic({
            root: __dirname + '/src/main'
        })
    );
    webserver.listen(8081);
    return webserver;
});

gulp.task('ft', ['update-webdriver', 'start-http'], function() {
    return gulp.src('src/test/functional/**/*.js').pipe(protractor({
        configFile: 'src/test/functional/protractor.conf.js'
    })).on('error', function(e) {
        throw e;
    }).on('end', function() {
        webserver.close();
    });
});

gulp.task('lint', function() {
    return gulp.src(['./src/main/js/app/**/*.js', './src/test/**/js/app/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});

gulp.task('config', function() {
    return gulp.src('./conf/overrides.js')
        .pipe(preprocess({
            context: {
                DHIS_URL: base_url,
                DHIS_AUTH: auth
            }
        }))
        .pipe(gulp.dest('./src/main/js/app/conf'));
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


gulp.task('download-org', function() {
    return download(base_url + "/api/organisationUnits.json?fields=:all&paging=false", auth)
        .pipe(rename("organisationUnits.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/organisationUnits.json")));
});

gulp.task('download-systemSettings', function() {
    return download(base_url + "/api/systemSettings.json", auth)
        .pipe(gulp.dest(path.dirname("src/main/data/systemSettings.json")));
});
gulp.task('download-translations', function() {
    return download(base_url + "/api/translations.json", auth)
        .pipe(gulp.dest(path.dirname("src/main/data/translations.json")));
});

gulp.task('download-metadata', ['download-org', 'download-systemSettings', 'download-translations'], function() {
    return download(base_url + "/api/metadata.json", auth)
        .pipe(gulp.dest(path.dirname("src/main/data/metadata.json")));
});

gulp.task('pack', ['less', 'config', 'download-metadata'], function() {
    var crx = new ChromeExtension({
        rootDirectory: "src/main",
        privateKey: fs.readFileSync("key.pem")
    });
    return crx.pack().then(function(buf) {
        fs.writeFile("dhis2_" + (argv.env || "dev") + ".crx", buf);
        crx.destroy();
    });
});
