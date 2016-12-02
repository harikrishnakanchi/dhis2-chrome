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
                    'isOnline': jasmine.createSpy('dhisMonitorIsOnline').and.returnValue(true)
                }
            };

            injector.get.and.callFake(function(service) {
                return injectorGetStubs[service];
            });

            handleTimeoutInterceptor = new HandleTimeoutInterceptor(q, injector, timeout);
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

            handleTimeoutInterceptor.responseError(rejection);

            expect(q.reject).toHaveBeenCalledWith(rejection);
            expect(platformUtils.sendMessage).not.toHaveBeenCalled();
            expect(fakeHttp).not.toHaveBeenCalled();
        });
    });
});
