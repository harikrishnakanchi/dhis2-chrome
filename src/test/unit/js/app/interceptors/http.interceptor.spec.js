define(["httpInterceptor", "angularMocks", "properties"], function(HttpInterceptor, mocks, properties) {
    describe("httpInterceptor", function() {
        var rootScope, q, httpInterceptor;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            rootScope = $rootScope;
            httpInterceptor = new HttpInterceptor($rootScope, $q);
        }));

        it("should set loading to true for http request", function() {
            httpInterceptor.request({
                'url': "http://www.google.com"
            });
            expect(rootScope.loading).toEqual(true);
            expect(rootScope.pendingRequests).toEqual(1);
        });

        it("should not handle template requests", function() {
            httpInterceptor.request({
                'url': "templates/something"
            });
            expect(rootScope.loading).toEqual();
            expect(rootScope.pendingRequests).toEqual(0);
        });

        it("should set loading to false if there are no pending requests", function() {
            rootScope.pendingRequests = 1;
            rootScope.loading = true;

            httpInterceptor.response({
                "config": {
                    "url": "templates123/blah"
                }
            });

            expect(rootScope.loading).toEqual(false);
            expect(rootScope.pendingRequests).toEqual(0);
        });

        it("should not handle template request responses", function() {
            rootScope.pendingRequests = 1;
            rootScope.loading = true;

            httpInterceptor.response({
                "config": {
                    "url": "templates/blah"
                }
            });

            expect(rootScope.loading).toEqual(true);
            expect(rootScope.pendingRequests).toEqual(1);
        });

        it("should not change loading if there are pending requests", function() {
            rootScope.pendingRequests = 2;
            rootScope.loading = true;

            httpInterceptor.response({
                "config": {
                    "url": "someurl"
                }
            });

            expect(rootScope.loading).toEqual(true);
            expect(rootScope.pendingRequests).toEqual(1);
        });

        it("should set loading to false if there are pending requests for error response", function() {
            spyOn(q, "reject");

            var httpInterceptor = new HttpInterceptor(rootScope, q);
            var rejection = {
                "config": {
                    "url": "someurl"
                }
            };
            rootScope.pendingRequests = 1;
            rootScope.loading = true;

            httpInterceptor.responseError(rejection);

            expect(rootScope.loading).toEqual(false);
            expect(rootScope.pendingRequests).toEqual(0);
            expect(q.reject).toHaveBeenCalledWith(rejection);
        });

        it("should not handle template request response errors", function() {
            spyOn(q, "reject");
            var httpInterceptor = new HttpInterceptor(rootScope, q);
            var rejection = {
                "config": {
                    "url": "templates/blah"
                }
            };
            rootScope.pendingRequests = 1;
            rootScope.loading = true;

            httpInterceptor.responseError(rejection);

            expect(rootScope.loading).toEqual(true);
            expect(rootScope.pendingRequests).toEqual(1);
            expect(q.reject).toHaveBeenCalledWith(rejection);
        });

        it("should set authorization header for http request", function() {
            var config = {
                'url': properties.dhis.url,
                'headers': {}
            };

            var expectedConfig = httpInterceptor.request(config);
            expect(expectedConfig.headers.Authorization).toEqual(properties.dhis.auth_header);
        });
    });
});