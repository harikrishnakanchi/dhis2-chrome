define(["handleTimeoutInterceptor", "angularMocks", "properties", "platformUtils"], function(HandleTimeoutInterceptor, mocks, properties, platformUtils) {
    describe("httpInterceptor", function() {
        var q, injector, fakeHttp, timeout, handleTimeoutInterceptor;

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
                    isOnline: jasmine.createSpy('dhisMonitorIsOnline').and.returnValue(true),
                    maxTriesReachedForNoNetwork: jasmine.createSpy('maxTriesReachedForNoNetwork').and.returnValue(false)
                }
            };

            injector.get.and.callFake(function(service) {
                return injectorGetStubs[service];
            });
            spyOn(q, "reject");
            spyOn(platformUtils, "sendMessage");

            properties.queue.maxretries = 5;

            handleTimeoutInterceptor = new HandleTimeoutInterceptor(q, injector, timeout);
        }));

        it("should not retry in case of non-GET requests", function() {
            var rejection = {
                config: {
                    method: "HEAD",
                    url: properties.dhisPing.url + "?sdfgdsfgsdfg",
                    params: {
                        retry: 0
                    }
                },
                "status": 0
            };

            handleTimeoutInterceptor.responseError(rejection);

            expect(q.reject).toHaveBeenCalledWith(rejection);
            expect(platformUtils.sendMessage).not.toHaveBeenCalled();
            expect(fakeHttp).not.toHaveBeenCalled();
        });

        describe('should retry', function () {
            var rejection;
            beforeEach(function () {
                rejection = {
                    "config": {
                        "method": "GET",
                        "url": "http://localhost:8080/api/someUrl",
                        params: {
                            retry: 0
                        }
                    },
                    "status": 0
                };
            });

            it("should retry in case of timeout", function() {
                handleTimeoutInterceptor.responseError(rejection);

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

            it('should retry for only max number of retries', function () {
                rejection.config.params.retry = 6;
                handleTimeoutInterceptor.responseError(rejection);

                expect(q.reject).toHaveBeenCalled();
                expect(fakeHttp).not.toHaveBeenCalled();
            });

        });
    });
});
