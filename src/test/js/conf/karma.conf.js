'use strict';
module.exports = function(config) {
    config.set({
        basePath: '../../../',
        files: [
            'test/js/test.main.js', {
                pattern: 'test/js/test.config.js',
                included: false
            }, {
                pattern: 'main/js/app/**/*.js',
                included: false
            }, {
                pattern: 'main/js/lib/**/*.js',
                included: false
            }, {
                pattern: 'test/js/app/**/*.js',
                included: false
            }
        ],
        exclude: [
            'main/js/lib/**/*spec.js',
            'main/js/app/background.js'
        ],
        autoWatch: true,
        frameworks: ['jasmine', 'requirejs'],
        reporters: ['dots', 'junit', 'coverage'],
        preprocessors: {
            'src/main/js/app/**/*.js': ['coverage']
        },
        browsers: ['Chrome'],
        logLevel: config.LOG_INFO,
        junitReporter: {
            outputFile: 'test/coverage/test-results.xml'
        },
        coverageReporter: {
            threshold: 85,
            reporters: [{
                type: 'cobertura',
                dir: 'test/coverage/'
            }, {
                type: 'text-summary'
            }]
        }
    });
};