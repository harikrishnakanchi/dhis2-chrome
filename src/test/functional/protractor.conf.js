exports.config = {
    allScriptsTimeout: 20000,
    specs: ['**/*.js', '**/**/*.js'],

    chromeOnly: true,
    capabilities: {
        'browserName': 'chrome'
    },
    framework: 'jasmine',
    baseUrl: 'http://localhost:8081/',
    rootElement: '#praxis',

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 300000
    }
};