define(["handleTimeoutInterceptor", "angularMocks", "properties", "chromeRuntime"], function(HandleTimeoutInterceptor, mocks, properties, chromeRuntime) {
    describe("httpInterceptor", function() {
        var q, handleTimeoutInterceptor;

        beforeEach(mocks.inject(function($q) {
            q = $q;
            handleTimeoutInterceptor = new HandleTimeoutInterceptor(q);
        }));

        it("should check for connectivity in case of timeout", function() {
            spyOn(q, "reject");
            var handleTimeoutInterceptor = new HandleTimeoutInterceptor(q);
            var rejection = {
                "config": {
                    "url": "templates/blah"
                },
                "status": 0
            };

            spyOn(chromeRuntime, "sendMessage");
            handleTimeoutInterceptor.responseError(rejection);
            expect(chromeRuntime.sendMessage).toHaveBeenCalledWith("checkNow");
            expect(q.reject).toHaveBeenCalledWith(rejection);
        });

        it("should not proxy dhis ping requests", function() {
            spyOn(q, "reject");
            var handleTimeoutInterceptor = new HandleTimeoutInterceptor(q);
            var rejection = {
                "config": {
                    "url": properties.dhisPing.url + "?sdfgdsfgsdfg"
                },
                "status": 0
            };

            spyOn(chromeRuntime, "sendMessage");
            handleTimeoutInterceptor.responseError(rejection);
            expect(chromeRuntime.sendMessage).not.toHaveBeenCalled();
            expect(q.reject).toHaveBeenCalledWith(rejection);
        });
    });
});