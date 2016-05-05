define(["dhisMonitor", "utils", "angularMocks", "chromeUtils", "mockChrome", "userPreferenceRepository", "properties", "timecop"], function(DhisMonitor, utils, mocks, chromeUtils, MockChrome, UserPreferenceRepository, properties, timecop) {
    describe("dhis.monitor", function() {
        var q, log, http, httpBackend, rootScope, timeout, userPreferenceRepository, dhisMonitor, currentTime, favIconUrl;
        var callbacks = {};

        beforeEach(mocks.inject(function($injector, $q, $log, $timeout, $rootScope) {
            q = $q;
            log = $log;
            timeout = $timeout;
            rootScope = $rootScope;
            http = $injector.get('$http');
            httpBackend = $injector.get('$httpBackend');
            mockChrome = new MockChrome();
            spyOn(chromeUtils, "sendMessage").and.callFake(mockChrome.sendMessage);
            spyOn(chromeUtils, "addListener").and.callFake(mockChrome.addListener);
            spyOn(chromeUtils, "getPraxisVersion").and.returnValue("5.1");
            rootScope.praxisUid = "ade3fab1ab0";
            userPreferenceRepository = new UserPreferenceRepository();
            var userPreferences = {
                locale: "en",
                orgunits: [],
                selectedProject: {
                    id: "1",
                    name: "randomName - ss153"
                },
                userRoles:[{
                    name: "Data entry user"
                }]
            };
            spyOn(userPreferenceRepository, "getCurrentUsersPreferences").and.returnValue(utils.getPromise(q, userPreferences));
            currentTime = (new Date()).getTime();
            Timecop.install();
            Timecop.freeze(currentTime);
            favIconUrl = properties.dhisPing.url + "?" + currentTime + "&pv=5.1&pid=ade3fab1ab0";
            dhisMonitor = new DhisMonitor(http, log, timeout, rootScope, userPreferenceRepository);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should go online", function() {
            var callback = jasmine.createSpy();

            httpBackend.expect("HEAD").respond(200, utils.getPromise(q, "ok"));
            dhisMonitor.online(function() {
                callback();
            });

            dhisMonitor.start();

            httpBackend.flush();
            expect(dhisMonitor.isOnline()).toBe(true);
            expect(callback).toHaveBeenCalled();
        });

        it("should go offline", function() {
            var callback = jasmine.createSpy();

            httpBackend.expect("HEAD").respond(200, utils.getPromise(q, "ok"));
            dhisMonitor.offline(function() {
                callback();
            });

            dhisMonitor.start();

            httpBackend.expect("HEAD").respond(0, utils.getPromise(q, {}));
            dhisMonitor.checkNow();

            httpBackend.flush();
            expect(dhisMonitor.isOnline()).toBe(false);
            expect(callback).toHaveBeenCalled();
        });

        it("should raise offline if offline on startup", function() {
            var onlineCallback = jasmine.createSpy();
            var offlineCallback = jasmine.createSpy();

            httpBackend.expect("HEAD").respond(0, utils.getPromise(q, {}));

            dhisMonitor.offline(function() {
                offlineCallback();
            });
            dhisMonitor.online(function() {
                onlineCallback();
            });

            dhisMonitor.start();
            httpBackend.flush();

            expect(onlineCallback.calls.count()).toBe(0);
            expect(offlineCallback.calls.count()).toBe(1);
        });

        it("should raise online if online on startup", function() {
            var onlineCallback = jasmine.createSpy();
            var offlineCallback = jasmine.createSpy();

            httpBackend.expect("HEAD").respond(200, utils.getPromise(q, "ok"));

            dhisMonitor.offline(function() {
                offlineCallback();
            });
            dhisMonitor.online(function() {
                onlineCallback();
            });

            dhisMonitor.start();
            httpBackend.flush();


            expect(onlineCallback.calls.count()).toBe(1);
            expect(offlineCallback.calls.count()).toBe(0);
        });

        it("should set hasPoorConnectivity to true on timeout", function() {
            mockChrome.sendMessage("timeoutOccurred");
            expect(dhisMonitor.hasPoorConnectivity()).toBe(true);
        });

        it("should reset hasPoorConnectivity to false if the timeoutOccurred event does not re-occur after some time", function() {
            mockChrome.sendMessage("timeoutOccurred");
            expect(dhisMonitor.hasPoorConnectivity()).toBe(true);

            timeout.flush();
            expect(dhisMonitor.hasPoorConnectivity()).toBe(false);
        });

        it("should get projectCode from userPreferences", function() {

            dhisMonitor.start();

            expect(userPreferenceRepository.getCurrentUsersPreferences).toHaveBeenCalled();
            httpBackend.expectHEAD(favIconUrl + "&prj=ss153").respond(200, "ok");
            httpBackend.flush();
        });

        it("should include projectCode in favicon call", function() {

            dhisMonitor.start();

            httpBackend.expectHEAD(favIconUrl + "&prj=ss153").respond(200, "ok");
            httpBackend.flush();
        });

        it("should not include projectCode in favicon call when user is opened fresh praxis instance", function() {
            userPreferenceRepository.getCurrentUsersPreferences.and.returnValue(utils.getPromise(q, undefined));
            dhisMonitor.start();

            httpBackend.expectHEAD(favIconUrl).respond(200, "ok");
            httpBackend.flush();
        });

        it("should not include projectCode in favicon call when user is logged in but not selected the project for first time", function() {
            userPreference = {
                "userCredentials": undefined,
                "locale": "en",
                "orgunits": [],
                "selectedProject": undefined
            };
            userPreferenceRepository.getCurrentUsersPreferences.and.returnValue(utils.getPromise(q, userPreference));
            dhisMonitor.start();

            httpBackend.expectHEAD(favIconUrl).respond(200, "ok");
            httpBackend.flush();
        });

        it("should include projectCode from project name in favicon call when user is logged in as project admin", function() {
            userPreference = {
                selectedProject: {
                    name: 'somename - projectCode'
                },
                userRoles:[{
                    name: "Superuser"
                }]
            };

            userPreferenceRepository.getCurrentUsersPreferences.and.returnValue(utils.getPromise(q, userPreference));
            dhisMonitor.start();

            httpBackend.expectHEAD(favIconUrl + "&prj=projectCode").respond(200, "ok");
            httpBackend.flush();
        });

        it("should include countryName in favicon call when coordination level approver is logged in", function() {
            userPreference = {
                "locale": "en",
                "orgunits": [],
                "selectedProject": {
                    "id": "1",
                    "parent": {"name" : "Country"}
                },
                "userRoles":[{
                    "name": "Coordination Level Approver"
                }]
            };

            userPreferenceRepository.getCurrentUsersPreferences.and.returnValue(utils.getPromise(q, userPreference));

            dhisMonitor.start();

            httpBackend.expectHEAD(favIconUrl + "&ctry=Country").respond(200, "ok");
            httpBackend.flush();
        });

    });
});
