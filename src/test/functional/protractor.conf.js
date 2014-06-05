exports.config = {
    chromeOnly: true,
    chromeDriver: '../../../node_modules/protractor/selenium/chromedriver',
    capabilities: {
        'browserName': 'chrome'
    },

    specs: ['**/*.js', '**/**/*.js'],
    rootElement: '#dhis2',

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    }
};