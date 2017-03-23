define(["handleResponseErrorInterceptor", "angularMocks", "properties", "platformUtils"], function(HandleResponseErrorInterceptor, mocks, properties, platformUtils) {
    describe("httpInterceptor", function() {
        var q, injector, fakeHttp, timeout, handleResponseErrorInterceptor;

        beforeEach(mocks.inject(function($q, $timeout) {
            q = $q;
            timeout = $timeout;

            injector = {
                "get": jasmine.createSpy('injectorGet')
            };

            fakeHttp = jasmine.createSpy('http');

            var injectorGetStubs = {
                '$http': fakeHttp,
                'dhisMonitor': {
                    'isOnline': jasmine.createSpy('dhisMonitorIsOnline').and.returnValue(true)
                }
            };

            injector.get.and.callFake(function(service) {
                return injectorGetStubs[service];
            });

            handleResponseErrorInterceptor = new HandleResponseErrorInterceptor(q, injector, timeout);
        }));

        it("should retry in case of timeout", function() {
            spyOn(q, "reject");
            spyOn(platformUtils, "sendMessage");

            var rejection = {
                "config": {
                    "method": "GET",
                    "url": "http://localhost:8080/api/someUrl"
                },
                "status": 0
            };

            handleResponseErrorInterceptor.responseError(rejection);

            expect(q.reject).not.toHaveBeenCalled();    
            expect(platformUtils.sendMessage).toHaveBeenCalledWith("timeoutOccurred");

            timeout.flush();

            expect(fakeHttp).toHaveBeenCalledWith({
                method: 'GET',
                url: 'http://localhost:8080/api/someUrl',
                params: {
                    retry: 1
                }
            });
        });

        it("should not retry in case of non-GET requests", function() {
            spyOn(q, "reject");
            spyOn(platformUtils, "sendMessage");

            var rejection = {
                "config": {
                    "method": "HEAD",
                    "url": properties.dhisPing.url + "?sdfgdsfgsdfg"
                },
                "status": 0
            };

            handleResponseErrorInterceptor.responseError(rejection);

            expect(q.reject).toHaveBeenCalledWith(rejection);
            expect(platformUtils.sendMessage).not.toHaveBeenCalled();
            expect(fakeHttp).not.toHaveBeenCalled();
        });

        describe('errorCodes', function () {
            beforeEach(function () {
                spyOn(q, "reject");
            });

            var getRejectionPayload = function (status) {
                return {
                    config: {
                        method: "HEAD",
                    },
                    status: status
                };
            };

            it('should send the appropriate error code on failure', function () {
                var expectedRejection = getRejectionPayload(401);
                expectedRejection.errorCode = "UNAUTHORISED";

                handleResponseErrorInterceptor.responseError(getRejectionPayload(401));
                expect(q.reject).toHaveBeenCalledWith(expectedRejection);
            });

            it('should send the appropriate error code when there is no internet', function () {
                injector.get('dhisMonitor').isOnline.and.returnValue(false);

                var expectedRejection = getRejectionPayload('someStatus');
                expectedRejection.errorCode = "NETWORK_UNAVAILABLE";

                handleResponseErrorInterceptor.responseError(getRejectionPayload('someStatus'));
                expect(q.reject).toHaveBeenCalledWith(expectedRejection);
            });
        });
    });
});
