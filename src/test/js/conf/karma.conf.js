'use strict';
module.exports = function(config) {
    config.set({
        basePath: '../../../..',
        files: [
            'main/js/app/**/*.js',
            'test/js/app/**/*.js'
        ],
        autoWatch: true,
        frameworks: ['jasmine'],
        browsers: ['PhantomJS'],
        reporters: ['dots', 'junit', 'coverage'],
        preprocessors: {
            'src/main/js/app/**/*.js': ['coverage']
        },
        logLevel: config.LOG_INFO,
        singleRun: true,
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