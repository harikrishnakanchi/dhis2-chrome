exports.config = {
    chromeOnly: true,
    chromeDriver: '../../../node_modules/protractor/selenium/chromedriver',
    baseUrl: 'http://localhost:8081/',

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
