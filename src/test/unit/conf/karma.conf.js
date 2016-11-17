'use strict';
module.exports = function(config) {
    config.set({
        basePath: '../../../',
        files: [
            'main/js/lib/angular/angular.min.js',
            'test/unit/test.main.js', {
                pattern: 'test/unit/test.config.js',
                included: false
            }, {
                pattern: 'main/js/app/**/*.js',
                included: false
            }, {
                pattern: 'main/js/lib/**/*.js',
                included: false
            }, {
                pattern: 'test/unit/js/app/**/*.js',
                included: false
            }, {
                pattern: 'test/unit/js/data/**/*.js',
                included: false
            }, 'main/**/*.html'
        ],
        exclude: [
            'main/js/lib/**/*spec.js',
            'main/js/app/chrome.bg.bootstrap.js'
        ],
        ngHtml2JsPreprocessor: {
            stripPrefix: 'main/'
        },
        autoWatch: true,
        frameworks: ['jasmine', 'requirejs'],
        reporters: ['dots', 'coverage', 'html'],
        preprocessors: {
            'main/js/app/**/*.js': ['coverage'],
            '**/*.html': ['ng-html2js']
        },
        browsers: ['ChromeTop'],
        customLaunchers: {
            ChromeTop: {
                base: 'Chrome',
                flags: ['--window-size=720,300', '--window-position=2880,0']
            }
        },
        logLevel: config.LOG_ERROR,
        junitReporter: {
            outputFile: 'test/unit/coverage/test-results.xml'
        },
        coverageReporter: {
            dir: 'test/unit/coverage',
        }
    });
};
