define(["dashboardController", "angularMocks", "utils", "approvalHelper"], function(DashboardController, mocks, utils, ApprovalHelper) {
    describe("dashboard controller", function() {
        var q, rootScope, db, hustle, dashboardController, approvalHelper;

        beforeEach(module("hustle"));

        beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
            q = $q;
            scope = $rootScope.$new();
            hustle = $hustle;
            rootScope = $rootScope;

            approvalHelper = new ApprovalHelper();

            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper);
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
            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper);

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
            dashboardController = new DashboardController(scope, hustle, q, rootScope, approvalHelper);

            scope.$apply();

            expect(scope.itemsAwaitingSubmission).toEqual(itemsAwaitingSubmission);
            expect(scope.itemsAwaitingApprovalAtUserLevel).toEqual(itemsAwaitingApprovalAtUserLevel);
            expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual(itemsAwaitingApprovalAtOtherLevels);
        });
    });
});