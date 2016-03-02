define(["handleTimeoutInterceptor", "angularMocks", "properties", "chromeUtils"], function(HandleTimeoutInterceptor, mocks, properties, chromeUtils) {
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
            spyOn(chromeUtils, "sendMessage");

            var rejection = {
                "config": {
                    "method": "GET",
                    "url": "http://localhost:8080/api/someUrl"
                },
                "status": 0
            };

            handleTimeoutInterceptor.responseError(rejection);

            expect(q.reject).not.toHaveBeenCalled();
            expect(chromeUtils.sendMessage).toHaveBeenCalledWith("timeoutOccurred");

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
            spyOn(chromeUtils, "sendMessage");

            var rejection = {
                "config": {
                    "method": "HEAD",
                    "url": properties.dhisPing.url + "?sdfgdsfgsdfg"
                },
                "status": 0
            };

            handleTimeoutInterceptor.responseError(rejection);

            expect(q.reject).toHaveBeenCalledWith(rejection);
            expect(chromeUtils.sendMessage).not.toHaveBeenCalled();
            expect(fakeHttp).not.toHaveBeenCalled();
        });
    });
});
