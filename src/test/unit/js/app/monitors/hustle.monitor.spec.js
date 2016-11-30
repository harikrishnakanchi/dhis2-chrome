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

        it("should call the msgInSyncQueue callback if count greater than zero", function() {
            var msgInQCallback = jasmine.createSpy();
            var noMsgInQCallback = jasmine.createSpy();
            var hustleMonitor = new HustleMonitor(hustle, log, q);

            hustleMonitor.msgInSyncQueue(function() {
                msgInQCallback();
            });
            hustleMonitor.noMsgInSyncQueue(function() {
                noMsgInQCallback();
            });

            hustleMonitor.checkHustleQueueCount();
            scope.$apply();

            expect(msgInQCallback.calls.count()).toBe(1);
            expect(noMsgInQCallback.calls.count()).toBe(0);
        });

        it("should call the noMsgInSyncQueue callback if count equal to zero", function() {
            var msgInQCallback = jasmine.createSpy();
            var noMsgInQCallback = jasmine.createSpy();
            hustle.getCount.and.returnValue(utils.getPromise(q, 0));
            hustle.getReservedCount.and.returnValue(utils.getPromise(q, 0));

            var hustleMonitor = new HustleMonitor(hustle, log, q);

            hustleMonitor.msgInSyncQueue(function() {
                msgInQCallback();
            });
            hustleMonitor.noMsgInSyncQueue(function() {
                noMsgInQCallback();
            });

            hustleMonitor.checkHustleQueueCount();
            scope.$apply();

            expect(msgInQCallback.calls.count()).toBe(0);
            expect(noMsgInQCallback.calls.count()).toBe(1);
        });
    });
});
