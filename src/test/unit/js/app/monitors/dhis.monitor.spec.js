define(["dhisMonitor", "utils", "angularMocks", "chromeRuntime", "mockChrome"], function(DhisMonitor, utils, mocks, chromeRuntime, MockChrome) {
    describe("dhis.monitor", function() {
        var q, http, httpBackend;
        var callbacks = {};

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            http = $injector.get('$http');
            httpBackend = $injector.get('$httpBackend');
            mockChrome = new MockChrome();
            spyOn(chromeRuntime, "sendMessage").and.callFake(mockChrome.sendMessage);
            spyOn(chromeRuntime, "addListener").and.callFake(mockChrome.addListener);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should go online", function() {
            var called = false;

            httpBackend.expect("HEAD").respond(200, utils.getPromise(q, "ok"));
            var dhisMonitor = new DhisMonitor(http);
            dhisMonitor.online(function() {
                called = true;
            });

            dhisMonitor.start();

            httpBackend.flush();
            expect(dhisMonitor.isOnline()).toBe(true);
            expect(called).toBe(true);
        });

        it("should go offline", function() {
            var called = false;

            httpBackend.expect("HEAD").respond(0, utils.getPromise(q, {}));
            var dhisMonitor = new DhisMonitor(http);

            dhisMonitor.offline(function() {
                called = true;
            });

            dhisMonitor.start();

            httpBackend.flush();
            expect(dhisMonitor.isOnline()).toBe(false);
            expect(called).toBe(true);
        });

    });
});