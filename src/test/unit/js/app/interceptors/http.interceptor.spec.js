define(["httpInterceptor", "angularMocks", "properties", "chromeRuntime"], function(HttpInterceptor, mocks, properties, chromeRuntime) {
    describe("httpInterceptor", function() {
        var rootScope, q, httpInterceptor;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            rootScope = $rootScope;
            httpInterceptor = new HttpInterceptor(rootScope, q, chromeRuntime);
        }));

        it("should check for connectivity in case of timeout", function() {
            spyOn(q, "reject");
            var httpInterceptor = new HttpInterceptor(rootScope, q, chromeRuntime);
            var rejection = {
                "config": {
                    "url": "templates/blah"
                },
                "status": 0
            };

            spyOn(chromeRuntime, "sendMessage");
            httpInterceptor.responseError(rejection);
            expect(chromeRuntime.sendMessage).toHaveBeenCalledWith("checkNow");
            expect(q.reject).toHaveBeenCalledWith(rejection);
        });

        it("should not proxy dhis ping requests", function() {
            spyOn(q, "reject");
            var httpInterceptor = new HttpInterceptor(rootScope, q, chromeRuntime);
            var rejection = {
                "config": {
                    "url": properties.dhisPing.url + "?sdfgdsfgsdfg"
                },
                "status": 0
            };

            spyOn(chromeRuntime, "sendMessage");
            httpInterceptor.responseError(rejection);
            expect(chromeRuntime.sendMessage).not.toHaveBeenCalled();
            expect(q.reject).toHaveBeenCalledWith(rejection);
        });

        it("should set authorization header and timeout for http request", function() {
            var config = {
                'url': properties.dhis.url,
                'headers': {},
                'timeout': properties.http.timeout
            };

            var expectedConfig = httpInterceptor.request(config);
            expect(expectedConfig.headers.Authorization).toEqual(properties.dhis.auth_header);
        });

        it("should remove last updated from http request payload", function() {
            var config = {
                'method': "POST",
                'url': properties.dhis.url,
                'headers': {},
                'timeout': properties.http.timeout,
                'data': {
                    "organisationUnits": [{
                        "name": "OpUnit1",
                        "id": "opUnit1",
                        "level": 5,
                        "lastUpdated": "2015-02-02T07:00:51.496Z",
                        "created": "2015-02-02T05:22:24.867+0000"

                    }]
                }
            };

            var expectedConfig = httpInterceptor.request(config);

            var expectedPayload = {
                "organisationUnits": [{
                    "name": "OpUnit1",
                    "id": "opUnit1",
                    "level": 5
                }]
            };
            expect(expectedConfig.data).toEqual(expectedPayload);
        });

        it("should remove last updated from http request payload", function() {
            var config = {
                'method': "POST",
                'url': properties.dhis.url,
                'headers': {},
                'timeout': properties.http.timeout,
                'data': {
                    "name": "OpUnit1",
                    "id": "opUnit1",
                    "level": 5,
                    "lastUpdated": "2015-02-02T07:00:51.496Z",
                    "created": "2015-02-02T05:22:24.867+0000"

                }
            };

            var expectedConfig = httpInterceptor.request(config);

            var expectedPayload = {
                "name": "OpUnit1",
                "id": "opUnit1",
                "level": 5
            };
            expect(expectedConfig.data).toEqual(expectedPayload);
        });

    });
});