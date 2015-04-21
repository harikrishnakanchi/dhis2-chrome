define(["dashboardController", "angularMocks", "utils", "filesystemService", "indexeddbUtils", "timecop", "sessionHelper", "md5", "moment", "indexedDBLogger", "lodash"],
    function(DashboardController, mocks, utils, FilesystemService, IndexeddbUtils, timecop, SessionHelper, md5, moment, indexedDBLogger, _) {
        describe("dashboard controller", function() {
            var q, rootScope, db, hustle, dashboardController, fakeModal, timeout, filesystemService, indexeddbUtils, idbDump, sessionHelper, location;

            beforeEach(module("hustle"));

            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location) {
                q = $q;
                scope = $rootScope.$new();
                hustle = $hustle;
                rootScope = $rootScope;
                timeout = $timeout;
                location = $location;

                var allDatasets = [{
                    "id": "DS1",
                    "name": "Dataset1",
                    "organisationUnits": [{
                        "id": "123",
                        "name": "mod1"
                    }, {
                        "id": "456",
                        "name": "mod2"
                    }]
                }];

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                idbDump = {
                    "storeName": [{
                        "id": "identity"
                    }]
                };

                scope.resourceBundle = {
                    "syncRunning": "syncRunning"
                };

                filesystemService = new FilesystemService(q);
                indexeddbUtils = new IndexeddbUtils();
                sessionHelper = new SessionHelper();

                spyOn(indexeddbUtils, "backupEntireDB").and.returnValue(utils.getPromise(q, idbDump));
                spyOn(indexeddbUtils, "restore").and.returnValue(utils.getPromise(q, {}));
                spyOn(sessionHelper, "logout");
                spyOn(location, "path");
                spyOn(fakeModal, 'open').and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                rootScope.hasRoles = function(args) {
                    if (args[0] === "Superuser")
                        return false;
                    else
                        return true;
                };

                Timecop.install();
                Timecop.freeze(new Date("2014-05-30 12:43:54"));

                dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, indexeddbUtils, filesystemService, sessionHelper, location);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should fetch and display all organisation units", function() {
                scope.syncNow();

                scope.$apply();
                timeout.flush();

                var syncableTypes = ["downloadMetadata", "downloadSystemSetting", "downloadPatientOriginDetails", "downloadOrgUnit", "downloadOrgUnitGroups",
                    "downloadProgram", "downloadData", "downloadEventData", "downloadDatasets"
                ];

                var expectedHustleArgs = _.map(syncableTypes, function(type) {
                    return [{
                        "type": type,
                        "data": []
                    }, "dataValues"];
                });

                expect(hustle.publish.calls.count()).toEqual(syncableTypes.length);
                _.forEach(syncableTypes, function(type, i) {
                    expect(hustle.publish.calls.argsFor(i)).toEqual(expectedHustleArgs[i]);
                });
            });

            it("should set current users project", function() {
                scope.$parent.projects = [{
                    "id": 321,
                    "name": "Prj1"
                }, {
                    "id": "123"
                }];

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "name": 'Superuser'
                        }]
                    },
                    "organisationUnits": [{
                        "id": "123",
                        "name": "MISSIONS EXPLOS"
                    }]
                };

                rootScope.hasRoles = function(args) {
                    if (args[0] === "Superuser")
                        return true;
                    else
                        return false;
                };

                dashboardController = new DashboardController(scope, hustle, q, rootScope, datasetRepository, fakeModal, timeout);

                scope.$apply();

                expect(scope.$parent.currentUserProject.id).toBe("123");
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
                expect(filesystemService.writeFile).toHaveBeenCalledWith('dhis_idb_20140530-124354.clone', jasmine.any(Blob));

                expect(scope.showMessage).toBeTruthy();
                expect(scope.message).toEqual("Clone created successfully at Desktop");
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
                expect(filesystemService.writeFile).toHaveBeenCalledWith('dhis_idb_20140530-124354.clone', jasmine.any(Blob));

                expect(scope.showMessage).toBeTruthy();
                expect(scope.message).toEqual("Error creating clone: InvalidFile");
            });

            it("should load clone to indexed db from selected file", function() {
                spyOn(filesystemService, "readFile").and.returnValue(utils.getPromise(q, {
                    "target": {
                        "result": "{}"
                    }
                }));

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
                expect(filesystemService.writeFile).toHaveBeenCalledWith('logs_20140530-124354.zip', jasmine.any(Blob));

                expect(scope.showMessage).toBeTruthy();
            });
        });
    });
