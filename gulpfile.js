var gulp = require('gulp');
var karmaServer = require('karma').Server;
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var shell = require('gulp-shell');
var http = require('http');
var ecstatic = require('ecstatic');
var protractor = require('gulp-protractor').protractor;
var download = require('gulp-download');
var argv = require('yargs').argv;
var karmaConf = __dirname + '/src/test/unit/conf/karma.conf.js';
var webserver;
var rename = require('gulp-rename');
var path = require('path');
var preprocess = require("gulp-preprocess");
var zip = require('gulp-zip');

var baseUrl = argv.url || "http://localhost:8080";
var baseIntUrl = argv.int_url || baseUrl;
var metadata_sync_interval = argv.metadataSyncInterval || "1";
var auth = argv.auth || "YWRtaW46ZGlzdHJpY3Q=";
auth = "Basic " + auth;
var passphrase = argv.passphrase || "My Product Key";
var iter = argv.iter || 1000;
var ks = argv.ks || 128;
var ts = argv.ts || 64;

gulp.task('test', function(onDone) {
    new karmaServer({
        configFile: karmaConf,
        singleRun: true
    }, function(exitCode) {
        if (exitCode !== 0)
            onDone('Karma has exited with exit code' + exitCode);
        else
            onDone();
        process.exit(exitCode);
    }).start();
});

gulp.task('pre-commit', ['test', 'lint']);

gulp.task('devtest', function(onDone) {
    new karmaServer({
        configFile: karmaConf
    }, onDone).start();
});

gulp.task('update-webdriver', shell.task([
    './node_modules/protractor/bin/webdriver-manager update'
]));

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
                DHIS_URL: baseUrl,
                METADATA_SYNC_INTERVAL: metadata_sync_interval,
                PASSPHRASE: passphrase,
                ITER: iter,
                KS: ks,
                TS: ts
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

gulp.task('download-metadata', function() {
    return download(baseIntUrl + "/api/metadata.json?attributes=false&dataApprovalLevels=false&userRoles=false&userGroups=false&options=false&dashboardItems=false&dashboards=false&dataElementGroupSets=false&indicators=false&indicatorTypes=false&sqlViews=false&charts=false&reportTables=false&dataSets=false&eventReports=false&eventCharts=false&programs=false&programStages=false&programStageSections=false&trackedEntities=false", auth)
        .pipe(rename("metadata.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/metadata.json")));
});

gulp.task('download-datasets', function() {
    return download(baseIntUrl + "/api/dataSets.json?fields=:all&paging=false", auth)
        .pipe(rename("dataSets.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/dataSets.json")));
});

gulp.task('download-programs', function() {
    return download(baseIntUrl + "/api/programs.json?fields=id,name,displayName,organisationUnits,attributeValues,programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]&paging=false", auth)
        .pipe(rename("programs.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/programs.json")));
});

gulp.task('download-fieldapp-settings', function() {
    return download(baseIntUrl + "/api/systemSettings.json?key=fieldAppSettings", auth)
        .pipe(rename("systemSettings.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/systemSettings.json")));
});

gulp.task('pack', ['less', 'config', 'download-metadata', 'download-datasets', 'download-programs', 'download-fieldapp-settings'], function() {
    var stream = shell(["./scripts/crxmake.sh ./src/main key.pem " + "praxis_" + (argv.env || "dev")]);
    stream.write(process.stdout);
    return stream;
});

gulp.task('zip', ['less', 'config', 'download-metadata'], function() {
    return gulp.src('./src/main/**')
        .pipe(zip("praxis_" + (argv.env || "dev") + ".zip"))
        .pipe(gulp.dest(''));
});
