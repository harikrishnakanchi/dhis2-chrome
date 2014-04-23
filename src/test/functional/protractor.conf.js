exports.config = {
    chromeOnly: true,
    chromeDriver: '../../../node_modules/protractor/selenium/chromedriver',

    capabilities: {
        'browserName': 'chrome'
    },

    specs: ['**/*.spec.js'],

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    }
};