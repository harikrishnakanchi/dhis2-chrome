define(["configureRequestInterceptor", "angularMocks", "properties"], function(ConfigureRequestInterceptor, mocks, properties) {
    describe("configureRequestInterceptor", function() {

        it("should set authorization header and timeout for http request", function() {
            var config = {
                'url': properties.dhis.url,
                'headers': {},
                'timeout': properties.http.timeout
            };

            var configureRequestInterceptor = new ConfigureRequestInterceptor();

            var expectedConfig = configureRequestInterceptor.request(config);
            expect(expectedConfig.headers.Authorization).toEqual(properties.dhis.auth_header);
        });

    });
});