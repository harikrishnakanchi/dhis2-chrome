define(["dashboardController", "angularMocks", "utils", "approvalHelper", "datasetRepository", "filesystemService", "indexeddbUtils", "timecop", "sessionHelper", "md5", "moment"], function(DashboardController, mocks, utils, ApprovalHelper, DatasetRepository, FilesystemService, IndexeddbUtils, timecop, SessionHelper, md5, moment) {
    describe("dashboard controller", function() {
        var q, rootScope, db, hustle, dashboardController, approvalHelper, fakeModal, timeout, datasetRepository, filesystemService, indexeddbUtils, idbDump, sessionHelper, location;

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

            approvalHelper = new ApprovalHelper();
            filesystemService = new FilesystemService(q);
            datasetRepository = new DatasetRepository();
            indexeddbUtils = new IndexeddbUtils();
            sessionHelper = new SessionHelper();

            spyOn(datasetRepository, "getAll").and.returnValue(utils.getPromise(q, allDatasets));
            spyOn(indexeddbUtils, "backupEntireDB").and.returnValue(utils.getPromise(q, idbDump));
            spyOn(indexeddbUtils, "restore").and.returnValue(utils.getPromise(q, {}));
            spyOn(sessionHelper, "logout");
            spyOn(location, "path");
            spyOn(fakeModal, 'open').and.returnValue({
                result: utils.getPromise(q, {})
            });

            rootScope.hasRoles = function(args) {
                if (args[0] === "Superuser")
                    return false;
                else
                    return true;
            };

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30 12:43:54"));

            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper, datasetRepository, fakeModal, timeout, indexeddbUtils, filesystemService, sessionHelper, location);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should fetch and display all organisation units", function() {
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.syncNow();

            scope.$apply();
            timeout.flush();

            expect(hustle.publish).toHaveBeenCalledWith({
                "type": "downloadData"
            }, "dataValues");
            expect(hustle.publish).toHaveBeenCalledWith({
                "type": "downloadEventData"
            }, "dataValues");
        });

        it("should format periods to be shown on dashboard", function() {
            var expectedPeriod = "W42 - " + moment('10-13-2014', 'MM-DD-YYYY').startOf("isoWeek").toDate().toLocaleDateString() + " - " + moment('10-19-2014', 'MM-DD-YYYY').endOf("isoWeek").toDate().toLocaleDateString();
            expect(scope.formatPeriods("2014W42")).toEqual(expectedPeriod);
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

            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper, datasetRepository, fakeModal, timeout);

            scope.$apply();

            expect(scope.$parent.currentUserProject.id).toBe("123");
        });

        it("should set user approval level", function() {
            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userRoles": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Project Level Approver'
                    }]
                },
                "organisationUnits": [{
                    "id": "123",
                    "name": "MISSIONS EXPLOS"
                }]
            };

            spyOn(approvalHelper, "getApprovalStatus").and.returnValue(utils.getPromise(q, {}));
            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper, datasetRepository, fakeModal, timeout);

            scope.$apply();
            timeout.flush();

            expect(scope.userApprovalLevel).toBe(1);
        });

        it("should set items awaiting submission and approval on scope", function() {
            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userRoles": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Project Level Approver'
                    }]
                },
                "organisationUnits": [{
                    "id": "123",
                    "name": "MISSIONS EXPLOS"
                }]
            };

            var approvalStatusData = [{
                "moduleId": "123",
                "moduleName": "mod1",
                "status": [{
                    "period": "2014W17",
                    "submitted": true,
                    "nextApprovalLevel": 1
                }, {
                    "period": "2014W18",
                    "submitted": true,
                    "nextApprovalLevel": 2
                }, {
                    "period": "2014W19",
                    "submitted": true,
                    "nextApprovalLevel": 3
                }, {
                    "period": "2014W20",
                    "submitted": true,
                    "nextApprovalLevel": undefined
                }, {
                    "period": "2014W21",
                    "submitted": false,
                    "nextApprovalLevel": undefined
                }]
            }];

            var itemsAwaitingSubmission = [{
                "moduleId": '123',
                "moduleName": 'mod1',
                "status": [{
                    "period": '2014W21',
                    "submitted": false,
                    "nextApprovalLevel": undefined
                }]
            }];

            var itemsAwaitingApprovalAtUserLevel = [{
                "moduleId": '123',
                "moduleName": 'mod1',
                "status": [{
                    "period": '2014W17',
                    "submitted": true,
                    "nextApprovalLevel": 1
                }]
            }];

            var itemsAwaitingApprovalAtOtherLevels = [{
                "moduleId": '123',
                "moduleName": 'mod1',
                "status": [{
                    "period": "2014W18",
                    "submitted": true,
                    "nextApprovalLevel": 2
                }, {
                    "period": "2014W19",
                    "submitted": true,
                    "nextApprovalLevel": 3
                }]
            }];

            spyOn(approvalHelper, "getApprovalStatus").and.returnValue(utils.getPromise(q, approvalStatusData));
            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper, datasetRepository, fakeModal, timeout);

            scope.$apply();
            timeout.flush();

            expect(scope.itemsAwaitingSubmission).toEqual(itemsAwaitingSubmission);
            expect(scope.itemsAwaitingApprovalAtUserLevel).toEqual(itemsAwaitingApprovalAtUserLevel);
            expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual(itemsAwaitingApprovalAtOtherLevels);
        });

        it("should approve selected items", function() {
            spyOn(approvalHelper, "markDataAsComplete");
            scope.resourceBundle = {
                "dataApprovalConfirmationMessage": "mssg"
            };

            scope.itemsAwaitingApprovalAtUserLevel = [{
                "moduleId": "123",
                "moduleName": "mod1",
                "status": [{
                    "period": "2014W17",
                    "submitted": true,
                    "nextApprovalLevel": 1
                }, {
                    "period": "2014W18",
                    "submitted": true,
                    "nextApprovalLevel": 1,
                    "shouldBeApproved": true
                }]
            }, {
                "moduleId": "456",
                "moduleName": "mod2",
                "status": [{
                    "period": "2014W17",
                    "submitted": true,
                    "nextApprovalLevel": 1,
                    "shouldBeApproved": true
                }, {
                    "period": "2014W18",
                    "submitted": true,
                    "nextApprovalLevel": 1,
                    "shouldBeApproved": true
                }]
            }];

            var expectedItemsAwaitingApprovalAtUserLevel = [{
                "moduleId": "123",
                "moduleName": "mod1",
                "status": [{
                    "period": "2014W17",
                    "submitted": true,
                    "nextApprovalLevel": 1,
                    "shouldBeApproved": false
                }]
            }];

            var expectedItemsAwaitingApprovalAtOtherLevels = [{
                "moduleId": "123",
                "moduleName": "mod1",
                "status": [{
                    "period": "2014W18",
                    "submitted": true,
                    "nextApprovalLevel": 2,
                    "shouldBeApproved": true
                }]
            }, {
                "moduleId": "456",
                "moduleName": "mod2",
                "status": [{
                    "period": "2014W17",
                    "submitted": true,
                    "nextApprovalLevel": 2,
                    "shouldBeApproved": true
                }, {
                    "period": "2014W18",
                    "submitted": true,
                    "nextApprovalLevel": 2,
                    "shouldBeApproved": true
                }]
            }];

            rootScope.currentUser = {
                "userCredentials": {
                    "username": "prj_approver_l1"
                }
            };

            scope.userApprovalLevel = 1;
            scope.itemsAwaitingApprovalAtOtherLevels = [];

            scope.bulkApprove();

            scope.$apply();
            timeout.flush();

            expect(approvalHelper.markDataAsComplete).toHaveBeenCalled();
            expect(scope.itemsAwaitingApprovalAtUserLevel).toEqual(expectedItemsAwaitingApprovalAtUserLevel);
            expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual(expectedItemsAwaitingApprovalAtOtherLevels);
        });

        it("should select all weeks awaiting approval if select all checkbox is checked", function() {
            scope.weeks.approveAllItems = true;
            scope.itemsAwaitingApprovalAtUserLevel = [{
                "moduleId": "123",
                "status": [{
                    "period": "2014W18",
                    "shouldBeApproved": false
                }]
            }, {
                "moduleId": "456",
                "status": [{
                    "period": "2014W17",
                    "shouldBeApproved": true
                }, {
                    "period": "2014W18",
                    "shouldBeApproved": false
                }]
            }];

            var expectedItemsAwaitingApprovalAtUserLevel = [{
                "moduleId": "123",
                "status": [{
                    "period": "2014W18",
                    "shouldBeApproved": true
                }]
            }, {
                "moduleId": "456",
                "status": [{
                    "period": "2014W17",
                    "shouldBeApproved": true
                }, {
                    "period": "2014W18",
                    "shouldBeApproved": true
                }]
            }];

            scope.toggleAllItemsAwaitingApproval();
            scope.$apply();
            expect(scope.itemsAwaitingApprovalAtUserLevel).toEqual(expectedItemsAwaitingApprovalAtUserLevel);
        });

        it("should de-select select all option if one of the weeks are unchecked", function() {
            scope.weeks.approveAllItems = true;

            scope.toggleSelectAllOption(false);
            scope.$apply();
            expect(scope.weeks.approveAllItems).toBe(false);
        });

        it("should check the select all checkbox , when all the weeks are selected", function() {
            scope.weeks.approveAllItems = false;

            scope.itemsAwaitingApprovalAtUserLevel = [{
                "moduleId": "123",
                "status": [{
                    "period": "2014W18",
                    "shouldBeApproved": true
                }]
            }, {
                "moduleId": "456",
                "status": [{
                    "period": "2014W17",
                    "shouldBeApproved": true
                }, {
                    "period": "2014W18",
                    "shouldBeApproved": true
                }]
            }];

            scope.toggleSelectAllOption(true);
            scope.$apply();
            expect(scope.weeks.approveAllItems).toBe(true);
        });

        it("should clone the entire indexed db successfully and save it to a file", function() {
            idbDump = JSON.stringify(idbDump);
            var expectedFileContents = idbDump + "\nchecksum: " + md5(idbDump);
            spyOn(filesystemService, "writeFile").and.returnValue(utils.getPromise(q, {
                "name": "Desktop"
            }));
            scope.resourceBundle = {
                "createCloneSuccessMessage": "Clone created successfully at "
            };

            scope.createClone();

            scope.$apply();

            expect(indexeddbUtils.backupEntireDB).toHaveBeenCalled();
            expect(filesystemService.writeFile).toHaveBeenCalledWith('dhis_idb_20140530-124354.clone', expectedFileContents,
                'application/json');

            expect(scope.showMessage).toBeTruthy();
            expect(scope.message).toEqual("Clone created successfully at Desktop");
        });

        it("should fail if cloning entire indexedDb fails", function() {
            idbDump = JSON.stringify(idbDump);
            var expectedFileContents = idbDump + "\nchecksum: " + md5(idbDump);
            spyOn(filesystemService, "writeFile").and.returnValue(utils.getRejectedPromise(q, {
                "name": "InvalidFile"
            }));
            scope.resourceBundle = {
                "createCloneErrorMessage": "Error creating clone: "
            };

            scope.createClone();

            scope.$apply();

            expect(indexeddbUtils.backupEntireDB).toHaveBeenCalled();
            expect(filesystemService.writeFile).toHaveBeenCalledWith('dhis_idb_20140530-124354.clone', expectedFileContents,
                'application/json');

            expect(scope.showMessage).toBeTruthy();
            expect(scope.message).toEqual("Error creating clone: InvalidFile");
        });

        it("should load clone to indexed db from selected file", function() {
            spyOn(filesystemService, "readFile").and.returnValue(utils.getPromise(q, {
                "target": {
                    "result": "{}\nchecksum: " + md5('{}')
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

            spyOn(indexeddbUtils, "backupLogs").and.returnValue(utils.getPromise(q, logsContent));
            var expectedFileContents = JSON.stringify(logsContent) + "\nchecksum: " + md5(JSON.stringify(logsContent));
            spyOn(filesystemService, "writeFile").and.returnValue(utils.getPromise(q, {
                "name": "Desktop"
            }));

            scope.resourceBundle = {
                "createCloneSuccessMessage": "Clone created successfully at "
            };

            scope.dumpLogs();

            scope.$apply();

            expect(indexeddbUtils.backupLogs).toHaveBeenCalled();
            expect(filesystemService.writeFile).toHaveBeenCalledWith('logs_dump_20140530-124354.logs', expectedFileContents,
                'application/json');

            expect(scope.showMessage).toBeTruthy();
        });
    });
});
