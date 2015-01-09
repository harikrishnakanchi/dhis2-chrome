'use strict';
module.exports = function(config) {
    config.set({
        basePath: '../../../',
        files: [
            'test/integration/test.main.js', {
                pattern: 'test/integration/test.config.js',
                included: false
            }, {
                pattern: 'main/js/app/**/*.js',
                included: false
            }, {
                pattern: 'main/js/lib/**/*.js',
                included: false
            }, {
                pattern: 'test/integration/js/**/*.js',
                included: false
            }
        ],
        exclude: [
            'main/js/lib/**/*spec.js',
            'main/js/app/bg.bootstrap.js'
        ],
        autoWatch: true,
        frameworks: ['requirejs', 'jasmine'],
        reporters: ['dots'],
        browsers: ['Chrome_sans_security'],
        customLaunchers: {
            Chrome_sans_security: {
                base: 'Chrome',
                flags: ['--disable-web-security']
            }
        },
        logLevel: config.LOG_ERROR,
        browserNoActivityTimeout: 30000,
        junitReporter: {
            outputFile: 'test/integration/coverage/test-results.xml'
        }
    });
};
