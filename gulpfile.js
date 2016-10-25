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
var zip = require('gulp-zip');
var exportTranslations = require('./tasks/export.translations');
var importTranslations = require('./tasks/import.translations');
var requirejs = require('requirejs');
var runSequence = require('run-sequence');
var template = require('gulp-template');
var browserSync = require('browser-sync').create();

var baseUrl = argv.url || "http://localhost:8080";
var baseIntUrl = argv.int_url || baseUrl;
var metadata_sync_interval = argv.metadataSyncInterval || "1";
var auth = argv.auth || "YWRtaW46ZGlzdHJpY3Q=";
auth = "Basic " + auth;
var passphrase = argv.passphrase || "My Product Key";
var iter = argv.iter || 1000;
var ks = argv.ks || 128;
var ts = argv.ts || 64;
var supportEmail = argv.supportEmail || "";
var chromeAppDistPath = "./dist/chromeApp/";
var pwaDistPath = "./dist/pwa/";
var devMode = argv.devMode || false;

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

gulp.task('config', function () {
    return gulp.src('./conf/overrides.js')
        .pipe(template({
                DHIS_URL: baseUrl,
                METADATA_SYNC_INTERVAL: metadata_sync_interval,
                PASSPHRASE: passphrase,
                ITER: iter,
                KS: ks,
                TS: ts,
                SUPPORT_EMAIL: supportEmail,
                DEV_MODE: devMode
            }))
        .pipe(gulp.dest(chromeAppDistPath + 'js/app/conf'))
        .pipe(gulp.dest(pwaDistPath + 'js/app/conf'));
});

gulp.task('less', function() {
    var less = require('gulp-less');
    var path = require('path');

    return gulp.src('./src/main/less/main.less')
        .pipe(less())
        .pipe(gulp.dest('./src/main/css'));
});

gulp.task('watch', ['watchPack'], function() {
    browserSync.init({
        server: {
            baseDir: pwaDistPath
        }
    });
    var watcher = gulp.watch(['./src/main/**/*.js', './src/main/**/*.json', './src/main/**/*.less'], ['watchPack']);
    return watcher;
});

gulp.task('download-metadata', function () {
    var stream = download(baseIntUrl + "/api/metadata.json?assumeTrue=false&categories=true&categoryCombos=true&categoryOptionCombos=true&categoryOptions=true&dataElementGroups=true&dataElements=true&optionSets=true&organisationUnitGroupSets=true&sections=true&translations=true&users=true&organisationUnitGroups=true", auth);
    stream.pipe(rename("metadata.json")).pipe(gulp.dest(path.dirname(chromeAppDistPath + "data/metadata.json")));
    stream.pipe(rename("metadata.json")).pipe(gulp.dest(path.dirname(pwaDistPath + "data/metadata.json")));
    return stream;
});

gulp.task('download-datasets', function () {
    var stream = download(baseIntUrl + "/api/dataSets.json?fields=:all,attributeValues[:identifiable,value,attribute[:identifiable]],!organisationUnits&paging=false", auth);
    stream.pipe(rename("dataSets.json")).pipe(gulp.dest(path.dirname(chromeAppDistPath + "data/dataSets.json")));
    stream.pipe(rename("dataSets.json")).pipe(gulp.dest(path.dirname(pwaDistPath + "data/dataSets.json")));
    return stream;
});

gulp.task('download-programs', function () {
    var stream = download(baseIntUrl + "/api/programs.json?fields=id,name,displayName,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]&paging=false", auth);
    stream.pipe(rename("programs.json")).pipe(gulp.dest(path.dirname(chromeAppDistPath + "data/programs.json")));
    stream.pipe(rename("programs.json")).pipe(gulp.dest(path.dirname(pwaDistPath + "data/programs.json")));
    return stream;
});

gulp.task('download-fieldapp-settings', function() {
    var stream = download(baseIntUrl + "/api/systemSettings.json?key=fieldAppSettings,versionCompatibilityInfo", auth);
    stream.pipe(rename("systemSettings.json")).pipe(gulp.dest(path.dirname(chromeAppDistPath + "data/systemSettings.json")));
    stream.pipe(rename("systemSettings.json")).pipe(gulp.dest(path.dirname(pwaDistPath + "data/systemSettings.json")));
    return stream;
});

gulp.task('download-organisationunits', function() {
    var stream = download(baseIntUrl + "/api/organisationUnits.json?fields=:all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid&paging=false", auth);
    stream.pipe(rename("organisationUnits.json")).pipe(gulp.dest(path.dirname(chromeAppDistPath + "data/organisationUnits.json")));
    stream.pipe(rename("organisationUnits.json")).pipe(gulp.dest(path.dirname(pwaDistPath + "data/organisationUnits.json")));
    return stream;
});

gulp.task('download-packaged-data', ['download-metadata', 'download-datasets', 'download-programs', 'download-fieldapp-settings', 'download-organisationunits'], function () {});

gulp.task('pack', ['pwa', 'chromeApp'], function(callBack) {
    runSequence(['config', 'download-packaged-data'], 'makeCRX', callBack);
});

gulp.task('watchPack', ['pwa', 'chromeApp'], function(callBack) {
    devMode = true;
    runSequence('config', function () {
        browserSync.reload();
        callBack();
    });
});

gulp.task('zip', ['less', 'config', 'download-metadata'], function() {
    return gulp.src('./src/main/**')
        .pipe(zip("praxis_" + (argv.env || "dev") + ".zip"))
        .pipe(gulp.dest(''));
});

gulp.task("chromeApp", ['generateDist'], function () {
    gulp.src('src/main/index.html')
        .pipe(template({bootstrapFile: 'bootstrap'}))
        .pipe(gulp.dest(chromeAppDistPath));

    return gulp.src('src/main/background.html')
        .pipe(template({bootstrapFile: 'bg.bootstrap'}))
        .pipe(gulp.dest(chromeAppDistPath));
});

gulp.task('generateDist', ['less'], function () {
    var stream = gulp.src(['./src/main/**']);
    stream.pipe(gulp.dest(chromeAppDistPath));
    stream.pipe(gulp.dest(pwaDistPath));
    return stream;
});

gulp.task('makeCRX', function () {
    var stream = shell(["./scripts/crxmake.sh ./dist/chromeApp key.pem " + "praxis_" + (argv.env || "dev")]);
    stream.write(process.stdout);
    return stream;
});

gulp.task("pwa", ['generateDist'], function () {
    return gulp.src('src/main/index.html')
        .pipe(template({bootstrapFile: 'pwa.bootstrap'}))
        .pipe(gulp.dest(pwaDistPath));
});

gulp.task('export-translations', exportTranslations);
gulp.task('import-translations', importTranslations);