define(["configureRequestInterceptor", "angularMocks", "properties", "utils"], function(ConfigureRequestInterceptor, mocks, properties, utils) {
    describe("configureRequestInterceptor", function() {
        var q, scope, callBack;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            chrome.storage = {
                "local": {
                    "get": function(key, callBack) {
                        callBack({
                            "auth_header": "Basic Auth"
                        });
                    }
                }
            };

        }));

        it("should set authorization header and timeout for http request", function() {
            var config = {
                'url': properties.dhis.url,
                'headers': {},
                'timeout': properties.http.timeout
            };

            var actualResult;

            var configureRequestInterceptor = new ConfigureRequestInterceptor(q);

            configureRequestInterceptor.request(config).then(function(data) {
                actualResult = data;
            });
            scope.$apply();
            expect(actualResult.headers.Authorization).toEqual("Basic Auth");
        });

    });
});