define(["configureRequestInterceptor", "angularMocks", "properties", "utils"], function(ConfigureRequestInterceptor, mocks, properties, utils) {
    describe("configureRequestInterceptor", function() {
        var rootScope;

        beforeEach(mocks.inject(function($rootScope) {
            rootScope = $rootScope;
        }));

        it("should set authorization header and timeout for http request", function() {
            rootScope.authHeader = "Basic Auth";

            var config = {
                'url': properties.dhis.url,
                'headers': {},
                'timeout': properties.http.timeout
            };
            var configureRequestInterceptor = new ConfigureRequestInterceptor(rootScope);
            configureRequestInterceptor.request(config);

            expect(config.headers.Authorization).toEqual("Basic Auth");
        });

    });
});
