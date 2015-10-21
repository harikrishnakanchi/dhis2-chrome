define(["configureRequestInterceptor", "angularMocks", "properties", "utils", "systemSettingRepository"], function(ConfigureRequestInterceptor, mocks, properties, utils, SystemSettingRepository) {
    describe("configureRequestInterceptor", function() {
        var rootScope, systemSettingRepository;


        beforeEach(mocks.inject(function($rootScope) {
            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, 'getAuthHeader').and.returnValue("Basic Auth");
            rootScope = $rootScope;
        }));

        it("should set authorization header and timeout for http request", function() {
            rootScope.authHeader = "Basic Auth";

            var config = {
                'url': properties.dhis.url,
                'headers': {},
                'timeout': properties.http.timeout
            };
            var configureRequestInterceptor = new ConfigureRequestInterceptor(rootScope, systemSettingRepository);
            configureRequestInterceptor.request(config);
            scope.$apply();

            expect(config.headers.Authorization).toEqual("Basic Auth");
        });
    });
});
