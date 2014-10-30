define(["dashboardController", "angularMocks", "utils", "approvalHelper", "dataSetRepository"], function(DashboardController, mocks, utils, ApprovalHelper, DataSetRepository) {
    describe("dashboard controller", function() {
        var q, rootScope, db, hustle, dashboardController, approvalHelper, fakeModal, timeout, dataSetRepository;

        beforeEach(module("hustle"));

        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout) {
            q = $q;
            scope = $rootScope.$new();
            hustle = $hustle;
            rootScope = $rootScope;
            timeout = $timeout;

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

            approvalHelper = new ApprovalHelper();
            dataSetRepository = new DataSetRepository();
            spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDatasets));
            spyOn(fakeModal, 'open').and.returnValue({
                result: utils.getPromise(q, {})
            });

            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper, dataSetRepository, fakeModal, timeout);
        }));

        it("should fetch and display all organisation units", function() {
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.syncNow();

            expect(scope.isSyncRunning).toEqual(true);
            expect(scope.isSyncDone).toEqual(undefined);

            scope.$apply();

            expect(scope.isSyncRunning).toEqual(false);
            expect(scope.isSyncDone).toEqual(true);
            expect(hustle.publish).toHaveBeenCalledWith({
                "type": "downloadData"
            }, "dataValues");
        });

        it("should format periods to be shown on dashboard", function() {
            expect(scope.formatPeriods("2014W42")).toEqual("W42 - 2014-10-13 - 2014-10-19");
        });

        it("should set user approval level", function() {
            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Approver - Level 1'
                    }]
                },
                "organisationUnits": [{
                    "id": "123",
                    "name": "MISSIONS EXPLOS"
                }]
            };

            spyOn(approvalHelper, "getApprovalStatus").and.returnValue(utils.getPromise(q, {}));
            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper, dataSetRepository, fakeModal, timeout);

            scope.$apply();

            expect(scope.userApprovalLevel).toBe(1);
        });

        it("should set items awaiting submission and approval on scope", function() {
            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Approver - Level 1'
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
            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper, dataSetRepository, fakeModal, timeout);

            scope.$apply();

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

        it("should de-select select all option if one of the weeks are unchecked", function(){
            scope.weeks.approveAllItems = true;

            scope.toggleSelectAllOption(false);
            scope.$apply();
            expect(scope.weeks.approveAllItems).toBe(false);
        });

        it("should check the select all checkbox , when all the weeks are selected", function(){
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

    });
});