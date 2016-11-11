var gulp = require('gulp');
var karmaServer = require('karma').Server;
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var shell = require('gulp-shell');
var http = require('http');
var ecstatic = require('ecstatic');
var protractor = require('gulp-protractor').protractor;
var request = require('request');
var fs = require('fs');
var argv = require('yargs').argv;
var karmaConf = __dirname + '/src/test/unit/conf/karma.conf.js';
var webserver;
var path = require('path');
var zip = require('gulp-zip');
var template = require('gulp-template');

var baseUrl = argv.url || "http://localhost:8080";
var baseIntUrl = argv.int_url || baseUrl;
var metadata_sync_interval = argv.metadataSyncInterval || "1";
var auth = "Basic " + (argv.auth || "YWRtaW46ZGlzdHJpY3Q=");

var passphrase = argv.passphrase || "My Product Key";
var iter = argv.iter || 1000;
var ks = argv.ks || 128;
var ts = argv.ts || 64;

var supportEmail = argv.supportEmail || "";

var exportTranslations = require('./tasks/export.translations');
var importTranslations = require('./tasks/import.translations');

var download = function (url, outputFile, onDone) {
    var options = {
        url: url,
        headers: {
            'Authorization': auth
        }
    };

    return request(options)
        .on('response', function(response) {
            if (response.statusCode != 200) {
                onDone("Server exited with " + response.statusCode);
                process.exit(1);
            }
        })
        .pipe(fs.createWriteStream(outputFile));
};

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

gulp.task('serve', ['download-packaged-data', 'generate-service-worker'], function() {
    webserver = http.createServer(
        ecstatic({
            root: __dirname + '/src/main',
            gzip: true,
            cache: 'private',
            showDir: true
        })
    );
    webserver.listen(8081);
    return webserver;
});

gulp.task('ft', ['update-webdriver', 'serve'], function() {
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

gulp.task('config', function () {
    return gulp.src('./conf/overrides.js')
        .pipe(template({
                DHIS_URL: baseUrl,
                METADATA_SYNC_INTERVAL: metadata_sync_interval,
                PASSPHRASE: passphrase,
                ITER: iter,
                KS: ks,
                TS: ts,
                SUPPORT_EMAIL: supportEmail
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

gulp.task('download-metadata', function (callback) {
    return download(baseIntUrl + "/api/metadata.json?assumeTrue=false&categories=true&categoryCombos=true&categoryOptionCombos=true&categoryOptions=true&dataElementGroups=true&dataElements=true&optionSets=true&organisationUnitGroupSets=true&sections=true&translations=true&users=true&organisationUnitGroups=true", "./src/main/data/metadata.json", callback);
});

gulp.task('download-datasets', function (callback) {
    return download(baseIntUrl + "/api/dataSets.json?fields=:all,attributeValues[:identifiable,value,attribute[:identifiable]],!organisationUnits&paging=false", "./src/main/data/dataSets.json", callback);
});

gulp.task('download-programs', function (callback) {
    return download(baseIntUrl + "/api/programs.json?fields=id,name,displayName,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]&paging=false", "./src/main/data/programs.json", callback);
});

gulp.task('download-fieldapp-settings', function(callback) {
    return download(baseIntUrl + "/api/systemSettings.json?key=fieldAppSettings,versionCompatibilityInfo", "./src/main/data/systemSettings.json", callback);
});

gulp.task('download-organisation-units', function(callback) {
    return download(baseIntUrl + "/api/organisationUnits.json?fields=:all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid&paging=false", "./src/main/data/organisationUnits.json", callback)
});

gulp.task('download-packaged-data', ['download-metadata', 'download-datasets', 'download-programs', 'download-fieldapp-settings', 'download-organisation-units'], function () {});

gulp.task('generate-service-worker', ['less'], function (callback) {
    var path = require('path');
    var swPrecache = require('sw-precache');
    var rootDir = 'src/main';

    swPrecache.write(path.join(rootDir, 'service.worker.js'), {
        staticFileGlobs: [
            rootDir + '/css/*.css',
            rootDir + '/fonts/*',
            rootDir + '/data/*',
            rootDir + '/img/*',
            rootDir + '/js/**/*',
            rootDir + '/templates/**/*',
            rootDir + '/*.html'
        ],
        stripPrefix: rootDir + '/',
        importScripts: ['js/app/interceptors/fetch.interceptor.js']
    }, callback);
});

gulp.task('watch', function () {
    gulp.watch('src/main/**/*' , ['generate-service-worker']);
});

gulp.task('pack', ['less', 'config', 'download-packaged-data'], function() {
    var stream = shell(["./scripts/crxmake.sh ./src/main key.pem " + "praxis_" + (argv.env || "dev")]);
    stream.write(process.stdout);
    return stream;
});

gulp.task('generate-pwa', ['config', 'download-packaged-data', 'generate-service-worker'], function () {});

gulp.task('zip', ['less', 'config', 'download-metadata'], function() {
    return gulp.src('./src/main/**')
        .pipe(zip("praxis_" + (argv.env || "dev") + ".zip"))
        .pipe(gulp.dest(''));
});

gulp.task('export-translations', exportTranslations);
gulp.task('import-translations', importTranslations);