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
var karmaIntConf = 'src/test/integration/conf/karma.conf.js';
var webserver;
var fs = require('fs');
var rename = require('gulp-rename');
var path = require('path');
var ChromeExtension = require("crx");
var preprocess = require("gulp-preprocess");
var cat = require("gulp-cat");
var baseUrl = argv.url || "http://localhost:8080";
var baseIntUrl = argv.int_url || baseUrl;
var metadata_sync_interval = argv.metadataSyncInterval || "1";
var Q = require('q');
var auth = argv.auth || "Basic c2VydmljZS5hY2NvdW50OiFBQkNEMTIzNA==";
var rest = require('restler');

gulp.task('test', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: karmaConf,
            action: 'run'
        })).on('error', function(err) {
            throw err;
        });
});

gulp.task('check-jetty-home', function() {
    if (!process.env.JETTY_HOME) {
        console.error("Tell us where to find jetty (start.jar) by setting JETTY_HOME");
        process.exit(-1);
    }
});


gulp.task('check-war-path', function() {
    if (!process.env.DHIS_WAR_PATH) {
        console.error("Tell us where to find dhis by setting DHIS_WAR_PATH");
        process.exit(-1);
    }

    if (!fs.existsSync(path.join(process.env.DHIS_WAR_PATH, 'dhis.war'))) {
        console.error("Dhis war not preset at DHIS_WAR_PATH");
        process.exit(-1);
    }
});

gulp.task('deploy-war', function() {
    var dhis_path = path.join(process.env.DHIS_WAR_PATH, 'dhis.war');
    var jety_webapps = path.join(process.env.JETTY_HOME, 'webapps/dhis.war');
    if (fs.existsSync(jety_webapps)) {
        fs.unlinkSync(jety_webapps);
    }
    return fs.symlinkSync(dhis_path, jety_webapps);
});

gulp.task('update-webdriver', shell.task([
    './node_modules/protractor/bin/webdriver-manager update'
]));


gulp.task('reset-db', shell.task(['dropdb dhis_test  --if-exists && createdb dhis_test -O dhis && psql dhis_test < src/test/integration/db/dhis2.backup'], {
    quiet: true
}));

gulp.task('start-dhis', ['check-jetty-home', 'check-war-path', 'deploy-war', 'reset-db'], function() {
    process.env.DHIS2_HOME = path.join(__dirname, 'src/test/integration/conf');
    var deferred = Q.defer();
    var stream = shell(['java -Xms1024m -Xmx4g -XX:NewSize=256m -XX:MaxNewSize=356m -XX:PermSize=512m -XX:MaxPermSize=1024m -jar ' + process.env.JETTY_HOME + '/start.jar etc/jetty-logging.xml -Djetty.port=8888 -DSTOP.PORT=8889 -DSTOP.KEY=booyakasha'], {
        cwd: process.env.JETTY_HOME
    });

    stream.write("logs/jetty.log");

    var checkForDhis = function() {
        rest.get('http://localhost:8888/dhis').on('complete', function(result) {
            if (result instanceof Error) {
                console.log('Wait for dhis to boot');
                this.retry(10000);
            } else {
                deferred.resolve();
            }
        });
    };
    checkForDhis();
    return deferred.promise;
});

gulp.task('devtest', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: karmaConf,
            action: 'watch',
            preprocessors: {}
        }));
});

var stopDhis = function() {
    var stream = shell(['java -jar ' + process.env.JETTY_HOME + '/start.jar --stop -DSTOP.PORT=8889 -DSTOP.KEY=booyakasha']);
    stream.write(process.stdout);
    return stream;
};

gulp.task('it', ["check-jetty-home", "check-war-path", 'start-dhis'], function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: karmaIntConf,
            action: 'run',
            preprocessors: {}
        })).on('error', function(err) {
            stopDhis();
            throw err;
        })
        .on('end', function(err) {
            stopDhis();
        });
});

gulp.task('itest', function() {
    return gulp.src('_')
        .pipe(karma({
            configFile: karmaIntConf,
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
                DHIS_URL: baseUrl,
                DHIS_AUTH: auth,
                METADATA_SYNC_INTERVAL: metadata_sync_interval
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
    return download(baseIntUrl + "/api/organisationUnits.json?fields=:all&paging=false", auth)
        .pipe(rename("organisationUnits.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/organisationUnits.json")));
});

gulp.task('download-org-unit-groups', function() {
    return download(baseIntUrl + "/api/organisationUnitGroups.json?paging=false&fields=[:all]", auth)
        .pipe(rename("organisationUnitGroups.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/organisationUnitGroups.json")));
});

gulp.task('download-systemSettings', function() {
    return download(baseIntUrl + "/api/systemSettings.json", auth)
        .pipe(gulp.dest(path.dirname("src/main/data/systemSettings.json")));
});

gulp.task('download-translations', function() {
    return download(baseIntUrl + "/api/translations.json", auth)
        .pipe(gulp.dest(path.dirname("src/main/data/translations.json")));
});

gulp.task('download-programs', function() {
    return download(baseIntUrl + "/api/programs.json?fields=:all&paging=false", auth)
        .pipe(rename("programs.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/programs.json")));
});

gulp.task('download-datasets', function() {
    return download(baseIntUrl + "/api/dataSets.json?fields=:all&paging=false", auth)
        .pipe(rename("dataSets.json"))
        .pipe(gulp.dest(path.dirname("src/main/data/dataSets.json")));
});

gulp.task('download-metadata', ['download-org', 'download-org-unit-groups', 'download-systemSettings', 'download-translations', 'download-programs', 'download-datasets'], function() {
    return download(baseIntUrl + "/api/metadata.json", auth)
        .pipe(gulp.dest(path.dirname("src/main/data/metadata.json")));
});

gulp.task('pack', ['less', 'config', 'download-metadata'], function() {
    var crx = new ChromeExtension({
        rootDirectory: "src/main",
        privateKey: fs.readFileSync("key.pem")
    });
    return crx.pack().then(function(buf) {
        fs.writeFile("dhis2_" + (argv.env || "dev") + ".crx", buf);
    });
});
