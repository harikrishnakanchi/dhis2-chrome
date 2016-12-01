define(["hustleMonitor", "utils", "angularMocks", "platformUtils", "mockChrome"], function(HustleMonitor, utils, mocks, platformUtils, MockChrome) {
    describe("hustle.monitor", function() {
        var q, log, scope, hustle;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($q, $log, $hustle, $rootScope) {
            q = $q;
            log = $log;
            hustle = $hustle;
            scope = $rootScope.$new();

            mockChrome = new MockChrome();
            spyOn(platformUtils, "sendMessage").and.callFake(mockChrome.sendMessage);
            spyOn(platformUtils, "addListener").and.callFake(mockChrome.addListener);
            spyOn(platformUtils, 'createAlarm');
            spyOn(platformUtils, 'addAlarmListener');
            spyOn(hustle, "getCount").and.returnValue(utils.getPromise(q, 3));
            spyOn(hustle, "getReservedCount").and.returnValue(utils.getPromise(q, 3));
        }));

        it("should check hustle queue count", function() {
            var hustleMonitor = new HustleMonitor(hustle, log, q);

            hustleMonitor.checkHustleQueueCount();

            expect(hustle.getCount).toHaveBeenCalled();
            expect(hustle.getReservedCount).toHaveBeenCalled();
        });

        it("should call the onSyncQueue callback", function() {
            var onSyncQCallback = jasmine.createSpy();
            var hustleMonitor = new HustleMonitor(hustle, log, q);

            hustleMonitor.onSyncQueueChange(function() {
                onSyncQCallback();
            });

            hustleMonitor.checkHustleQueueCount();
            scope.$apply();

            expect(onSyncQCallback).toHaveBeenCalled();
        });
    });
});
