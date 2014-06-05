exports.config = {
    chromeOnly: true,
    chromeDriver: '../../../node_modules/protractor/selenium/chromedriver',
    capabilities: {
        'browserName': 'chrome'
    },

    specs: ['**/*.spec.js','**/**/*.spec.js'],
    rootElement: '#dhis2',

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    }
};
