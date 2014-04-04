var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/spec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

require.config({
    baseUrl: '/base/main/js',
    paths: {
        angular: 'lib/angular/angular',
        angularMocks: 'lib/angular-mocks/angular-mocks',
        testData: '../../test/js/data/test.data',
        utils: '../../test/js/app/utils/utils',
    },
    shim: {
        'angular': {
            'exports': 'angular'
        },
        'angularMocks': {
            deps: ['angular'],
            'exports': 'angular.mock'
        },
    }
});

console.log("load complete");