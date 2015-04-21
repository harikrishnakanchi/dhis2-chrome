define(["dataEntryApprovalDashboardController", "angularMocks", "approvalDataRepository", "orgUnitRepository", "dataRepository", "utils", "moment", "timecop", "lodash"],
    function(DataEntryApprovalDashboardController, mocks, ApprovalDataRepository, OrgUnitRepository, DataRepository, utils, moment, timecop, _) {
        describe("approval helper", function() {
            var q, rootScope, db, hustle, scope, location, timeout, fakeModal, approvalDataRepository, orgUnitRepository, dataRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location) {
                q = $q;
                scope = $rootScope.$new();
                hustle = $hustle;
                rootScope = $rootScope;
                timeout = $timeout;
                location = $location;

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(true);


                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "getApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, []));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));

                dataRepository = new DataRepository();
                spyOn(dataRepository, "getDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, []));

                spyOn(hustle, "publish");

                Timecop.install();
                Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should format periods to be shown on dashboard", function() {
                var expectedPeriod = "W42 - " + moment('10-13-2014', 'MM-DD-YYYY').startOf("isoWeek").toDate().toLocaleDateString() + " - " + moment('10-19-2014', 'MM-DD-YYYY').endOf("isoWeek").toDate().toLocaleDateString();
                expect(scope.formatPeriods("2014W42")).toEqual(expectedPeriod);
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

                dashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository);

                scope.$apply();
                timeout.flush();

                expect(scope.userApprovalLevel).toBe(1);
            });

            xit("should set items awaiting submission and approval on scope", function() {
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

                dashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository);

                scope.$apply();
                timeout.flush();

                expect(scope.itemsAwaitingSubmission).toEqual(itemsAwaitingSubmission);
                expect(scope.itemsAwaitingApprovalAtUserLevel).toEqual(itemsAwaitingApprovalAtUserLevel);
                expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual(itemsAwaitingApprovalAtOtherLevels);
            });

            xit("should complete selected items", function() {
                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getPromise(q, {}));
                scope.resourceBundle = {
                    "dataApprovalConfirmationMessage": "mssg",
                    "uploadCompletionDataDesc": "upload approval for "
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
                    },
                    "locale": "en"
                };

                var expectedUpserts = [{
                    "period": "2014W18",
                    "orgUnit": "123"
                }, {
                    "period": "2014W17",
                    "orgUnit": "456"
                }, {
                    "period": "2014W18",
                    "orgUnit": "456"
                }];

                scope.userApprovalLevel = 1;
                scope.itemsAwaitingApprovalAtOtherLevels = [];

                scope.bulkApprove();

                scope.$apply();
                timeout.flush();

                expect(approvalDataRepository.markAsComplete).toHaveBeenCalledWith(expectedUpserts, "prj_approver_l1");
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": expectedUpserts,
                    "type": "uploadCompletionData",
                    "locale": "en",
                    "desc": "upload approval for 2014W18,2014W17,2014W18"
                }, "dataValues");

                expect(scope.itemsAwaitingApprovalAtUserLevel).toEqual(expectedItemsAwaitingApprovalAtUserLevel);
                expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual(expectedItemsAwaitingApprovalAtOtherLevels);
            });

            xit("should approve selected items", function() {
                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));
                scope.resourceBundle = {
                    "dataApprovalConfirmationMessage": "mssg",
                    "uploadApprovalDataDesc": "approve data for "
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
                    },
                    "locale": "en"
                };

                var expectedUpserts = [{
                    "period": "2014W18",
                    "orgUnit": "123"
                }, {
                    "period": "2014W17",
                    "orgUnit": "456"
                }, {
                    "period": "2014W18",
                    "orgUnit": "456"
                }];

                scope.userApprovalLevel = 2;
                scope.itemsAwaitingApprovalAtOtherLevels = [];

                scope.bulkApprove();

                scope.$apply();
                timeout.flush();

                expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith(expectedUpserts, "prj_approver_l1");
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": expectedUpserts,
                    "type": "uploadApprovalData",
                    "locale": "en",
                    "desc": "approve data for 2014W18,2014W17,2014W18"
                }, "dataValues");
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

            xit("should get approval status from the starting date", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2014-05-30",
                    "parent": {
                        "name": "parent"
                    },
                    "displayName": "parent - mod1"
                }, {
                    "id": "456",
                    "name": "mod2",
                    "openingDate": "2014-05-30",
                    "parent": {
                        "name": "parent"
                    },
                    "displayName": "parent - mod2",
                    "attributeValues": [{
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "true"
                    }]
                }];

                var dataValues = [];
                var expectedStatus = [{
                    "moduleId": "123",
                    "moduleName": "parent - mod1",
                    "status": [{
                        "period": "2014W22",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }]
                }, {
                    "moduleId": "456",
                    "moduleName": "parent - mod2",
                    "status": [{
                        "period": "2014W22",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }]
                }];

                var orgUnitId = "123";

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataValues));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));

                approvalHelper.getApprovalStatus(orgUnitId).then(function(actualStatus) {
                    expect(actualStatus).toEqual(expectedStatus);
                });

                scope.$apply();
            });

            xit('should get approval status for last 12 weeks', function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    },
                    "displayName": "parent - mod1"
                }, {
                    "id": "234",
                    "name": "mod2",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    },
                    "displayName": "parent - mod2"
                }];

                var dataValues = [{
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W17",
                    "value": "9"
                }, {
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W18",
                    "value": "9"
                }, {
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W19",
                    "value": "9"
                }, {
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W20",
                    "value": "9"
                }];

                var approvalPeriodData = [{
                    "orgUnit": "123",
                    "period": "2014W18",
                    "isComplete": true
                }, {
                    "orgUnit": "123",
                    "period": "2014W19",
                    "isComplete": true,
                    "isApproved": true,
                }, {
                    "orgUnit": "123",
                    "period": "2014W20",
                    "isComplete": true,
                    "isApproved": true,
                    "status": "DELETED"
                }, {
                    "orgUnit": "123",
                    "period": "2014W21",
                    "isComplete": true,
                    "isApproved": true,
                    "status": "DELETED"
                }];

                var expectedStatus = [{
                    "moduleId": "123",
                    "moduleName": "parent - mod1",
                    "status": [{
                        "period": "2014W11",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W12",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W13",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W14",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W15",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W16",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
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
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W20",
                        "submitted": true,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W21",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W22",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }]
                }, {
                    "moduleId": "234",
                    "moduleName": "parent - mod2",
                    "status": [{
                        "period": "2014W11",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W12",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W13",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W14",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W15",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W16",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W17",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W18",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W19",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W20",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W21",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W22",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }]
                }];

                var orgUnitId = "123";

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataValues));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, approvalPeriodData));

                approvalHelper.getApprovalStatus(orgUnitId).then(function(actualStatus) {
                    expect(actualStatus).toEqual(expectedStatus);
                });

                scope.$apply();
            });
        });
    });
