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
        lodash: 'lib/lodash/dist/lodash',
        moment: "lib/moment/min/moment-with-locales",
        utils: '../../test/integration/js/utils/utils',
        idbUtils: '../../test/integration/js/utils/idb.utils',
        httpTestUtils: '../../test/integration/js/utils/http.utils',
        dataValueBuilder: '../../test/integration/js/builders/data.value.builder',
        overrides: "../../test/integration/conf/overrides"
    },
    shim: {
        'angular': {
            'exports': 'angular'
        },
        'angularMocks': {
            deps: ['angular'],
            'exports': 'angular.mock'
        },
        'testApp': {
            deps: ['angular']
        }
    }
});

console.log("load complete");
console.debug = function() {};
