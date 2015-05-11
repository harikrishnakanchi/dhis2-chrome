define(["appCloneController", "angularMocks", "utils", "timecop", "filesystemService", "indexeddbUtils", "sessionHelper", "indexedDBLogger", "zipUtils"],
    function(AppCloneController, mocks, utils, timecop, FilesystemService, IndexeddbUtils, SessionHelper, indexedDBLogger, zipUtils) {
        describe("appCloneController", function() {
            var appCloneController, scope, q, timeout, location, idbDump, fakeModal;

            beforeEach(mocks.inject(function($rootScope, $q, $timeout, $location) {
                scope = $rootScope.$new();
                q = $q;
                timeout = $timeout;
                location = $location;

                filesystemService = new FilesystemService(q);
                indexeddbUtils = new IndexeddbUtils();
                sessionHelper = new SessionHelper();

                idbDump = {
                    "storeName": [{
                        "id": "identity"
                    }]
                };

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                spyOn(indexeddbUtils, "backupEntireDB").and.returnValue(utils.getPromise(q, idbDump));
                spyOn(indexeddbUtils, "restore").and.returnValue(utils.getPromise(q, {}));
                spyOn(sessionHelper, "logout").and.returnValue(utils.getPromise(q, {}));
                spyOn(location, "path").and.returnValue(utils.getPromise(q, {}));
                spyOn(fakeModal, 'open').and.returnValue({
                    result: utils.getPromise(q, {})
                });

                scope.displayMessage = jasmine.createSpy("displayMessage");
                scope.resourceBundle = {};

                Timecop.install();
                Timecop.freeze(new Date("2014-05-30 12:43:54"));

                appCloneController = new AppCloneController(scope, fakeModal, timeout, indexeddbUtils, filesystemService, sessionHelper, location);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should clone the entire indexed db successfully and save it to a file", function() {
                var expectedFileContents = new Blob([JSON.stringify(idbDump)], {
                    "type": "application/json"
                });
                spyOn(filesystemService, "writeFile").and.returnValue(utils.getPromise(q, {
                    "name": "Desktop"
                }));
                scope.resourceBundle = {
                    "createCloneSuccessMessage": "Clone created successfully at "
                };

                scope.createClone();

                scope.$apply();

                expect(indexeddbUtils.backupEntireDB).toHaveBeenCalled();
                expect(filesystemService.writeFile).toHaveBeenCalledWith('dhis_idb_20140530-124354.msf', jasmine.any(Blob));
            });

            it("should fail if cloning entire indexedDb fails", function() {
                var expectedFileContents = new Blob([JSON.stringify(idbDump)], {
                    "type": "application/json"
                });
                spyOn(filesystemService, "writeFile").and.returnValue(utils.getRejectedPromise(q, {
                    "name": "InvalidFile"
                }));
                scope.resourceBundle = {
                    "createCloneErrorMessage": "Error creating clone: "
                };

                scope.createClone();

                scope.$apply();

                expect(indexeddbUtils.backupEntireDB).toHaveBeenCalled();
                expect(filesystemService.writeFile).toHaveBeenCalledWith('dhis_idb_20140530-124354.msf', jasmine.any(Blob));
            });

            it("should load clone to indexed db from selected file", function() {
                spyOn(filesystemService, "readFile").and.returnValue(utils.getPromise(q, {
                    "target": {
                        "result": "{}"
                    }
                }));

                spyOn(zipUtils, "readZipFile").and.returnValue([{
                    "name": "blah"
                }]);

                scope.loadClone();
                scope.$apply();

                expect(filesystemService.readFile).toHaveBeenCalled();
                expect(indexeddbUtils.restore).toHaveBeenCalled();
                expect(sessionHelper.logout).toHaveBeenCalled();
                expect(location.path).toHaveBeenCalledWith('#/login');
            });

            it("should dump logs to a file", function() {
                var logsContent = {
                    "logs": "foo bar"
                };

                spyOn(indexedDBLogger, "exportLogs").and.returnValue(utils.getPromise(q, logsContent));
                var expectedFileContents = new Blob([JSON.stringify(logsContent)], {
                    "type": "application/json"
                });

                spyOn(filesystemService, "writeFile").and.returnValue(utils.getPromise(q, {
                    "name": "Desktop"
                }));

                scope.resourceBundle = {
                    "createCloneSuccessMessage": "Clone created successfully at "
                };

                scope.dumpLogs();

                scope.$apply();

                expect(indexedDBLogger.exportLogs).toHaveBeenCalled();
                expect(new Blob()).toEqual(jasmine.any(Blob));
                expect(filesystemService.writeFile).toHaveBeenCalledWith('logs_dump_20140530-124354.msf', jasmine.any(Blob));
            });
        });
    });
