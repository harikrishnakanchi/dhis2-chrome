var gulp = require('gulp');
var karmaServer = require('karma').Server;
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var shell = require('gulp-shell');
var http = require('http');
var express = require('express');
var compress = require('compression');
var nocache = require('nocache');
var protractor = require('gulp-protractor').protractor;
var request = require('request');
var fs = require('fs');
var argv = require('yargs').argv;
var karmaConf = __dirname + '/src/test/unit/conf/karma.conf.js';
var webserver;
var path = require('path');
var zip = require('gulp-zip');
var template = require('gulp-template');
var requirejs = require('requirejs');

var baseUrl = argv.url || "http://localhost:8080";
var baseIntUrl = argv.int_url || baseUrl;
var metadata_sync_interval = argv.metadataSyncInterval || "1";
var auth = "Basic " + (argv.auth || "YWRtaW46ZGlzdHJpY3Q=");

var passphrase = argv.passphrase || "My Product Key";
var iter = argv.iter || 1000;
var ks = argv.ks || 128;
var ts = argv.ts || 64;

var supportEmail = argv.supportEmail || "";
var praxisConfiguration = require('./praxis.configuration.json');

var exportTranslations = require('./tasks/export.translations');
var importTranslations = require('./tasks/import.translations');

var ensureDirectoryExistence = function(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

var download = function (url, outputFile, onDone) {
    ensureDirectoryExistence(outputFile);

    var options = {
        url: url,
        headers: {
            'Authorization': auth
        }
    };

    return request(options)
        .on('response', function (response) {
            if(response.statusCode != 200) {
                onDone("Server exited with " + response.statusCode);
                process.exit(1);
            }
            else {
                var fileStream = fs.createWriteStream(outputFile);
                response.pipe(fileStream);
                fileStream.on('finish', function () {
                    onDone();
                })
            }
        });
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

gulp.task('serve', ['generate-service-worker', 'watch'], function() {

    var app = express();

    app.use(compress());    // gzip
    app.use(nocache());     // nocache

    app.use('/', express.static(__dirname + '/src/main'));
    webserver = app.listen(8081);
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
        .pipe(jshint({expr: true}))
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
                PRAXIS_CONFIGURATION: JSON.stringify(praxisConfiguration)
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
    requirejs(['./src/main/js/app/conf/metadata.conf.js'], function (metadataConf) {
        var buildUrl = function () {
            var url = `&organisationUnitGroups=true&organisationUnitGroups:fields=${metadataConf.fields.organisationUnitGroups.params}`;
            metadataConf.entities.forEach(function (entity) {
                url += `&${entity}=true&${entity}:fields=${metadataConf.fields[entity].params}`;
            });
            return url;
        };
        download(baseIntUrl + "/api/metadata.json?assumeTrue=False" + buildUrl(), "./src/main/data/metadata.json", callback);
    });
});

gulp.task('download-datasets', function (callback) {
    requirejs(['./src/main/js/app/conf/metadata.conf.js'], function (metadataConf) {
        download(baseIntUrl + "/api/dataSets.json?paging=false&fields=" + metadataConf.fields.dataSets.params, "./src/main/data/dataSets.json", callback);
    });
});

gulp.task('download-programs', function (callback) {
    requirejs(['./src/main/js/app/conf/metadata.conf.js'], function (metadataConf) {
        download(baseIntUrl + "/api/programs.json?paging=false&fields=" + metadataConf.fields.programs.params, "./src/main/data/programs.json", callback);
    });
});

gulp.task('download-fieldapp-settings', function(callback) {
    requirejs(['./src/main/js/app/conf/metadata.conf.js'], function (metadataConf) {
        download(baseIntUrl + "/api/systemSettings.json?key=" + metadataConf.fields.systemSettings.key, "./src/main/data/systemSettings.json", callback);
    });
});

gulp.task('download-organisation-units', function(callback) {
    requirejs(['./src/main/js/app/conf/metadata.conf.js'], function (metadataConf) {
        download(baseIntUrl + "/api/organisationUnits.json?paging=false&fields=" + metadataConf.fields.organisationUnits.params, "./src/main/data/organisationUnits.json", callback)
    });
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
            rootDir + '/img/*',
            rootDir + '/js/**/*/!(chrome.*.js)',
            rootDir + '/templates/**/*',
            rootDir + '/index.html'
        ],
        stripPrefix: rootDir + '/',
        importScripts: ['js/app/pwa/service.worker.events.js'],
        templateFilePath: 'service-worker-custom.tmpl',
        skipWaiting: false
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

gulp.task('generate-pwa', ['config', 'generate-service-worker'], function () {});

gulp.task('generate-pwa-zip', ['config', 'generate-service-worker'], function () {
    var basePath = './src/main';
    return gulp.src([
        `${basePath}/**`,
        `!${basePath}/js/app/chrome{,/**}`,
        `!${basePath}/less{,/**}`,
        `!${basePath}/chrome.app.html`,
        `!${basePath}/background.html`
    ])
        .pipe(zip("praxis_pwa_" + (argv.env || "dev") + ".zip"))
        .pipe(gulp.dest(''));
});

gulp.task('zip', ['less', 'config', 'download-metadata'], function() {
    var basePath = './src/main';
    return gulp.src([
        `${basePath}/**`,
        `!${basePath}/js/app/pwa{,/**}`,
        `!${basePath}/less{,/**}`,
        `!${basePath}/index.html`,
        `!${basePath}/service.worker.js`
    ])
        .pipe(zip("praxis_" + (argv.env || "dev") + ".zip"))
        .pipe(gulp.dest(''));
});

gulp.task('export-translations', exportTranslations);
gulp.task('import-translations', importTranslations);