'use strict';
module.exports = function(config) {
    config.set({
        basePath: '../../../',
        files: [
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
            }
        ],
        exclude: [
            'main/js/lib/**/*spec.js',
            'main/js/app/bg.bootstrap.js'
        ],
        autoWatch: true,
        frameworks: ['jasmine', 'requirejs'],
        reporters: ['dots', 'coverage'],
        preprocessors: {
            'main/js/app/**/*.js': 'coverage'
        },
        browsers: ['Chrome'],
        logLevel: config.LOG_INFO,
        junitReporter: {
            outputFile: 'test/unit/coverage/test-results.xml'
        },
        coverageReporter: {
            dir: 'test/unit/coverage',
        }
    });
};