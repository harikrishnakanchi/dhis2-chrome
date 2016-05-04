define(["dashboardController", "angularMocks", "approvalDataRepository", "orgUnitRepository", "dataRepository", "programEventRepository", "moduleDataBlockFactory", "utils", "moment", "timecop", "properties", "lodash", "dateUtils"],
    function(DashboardController, mocks, ApprovalDataRepository, OrgUnitRepository, DataRepository, ProgramEventRepository, ModuleDataBlockFactory, utils, moment, timecop, properties, _, dateUtils) {
        describe("dashboardController", function() {
            var q, rootScope, db, hustle, scope, location, timeout, fakeModal, approvalDataRepository, orgUnitRepository, dataRepository, moduleDataBlockFactory;

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
                    open: jasmine.createSpy("open").and.returnValue({
                        result: utils.getPromise(q, {})
                    })
                };

                rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(false);

                scope.resourceBundle = {
                    "dataApprovalConfirmationMessage": "Are you sure?",
                    "uploadCompletionDataDesc": "Uploading Completion Data for ",
                    "uploadApprovalDataDesc": "Uploading Approval Data for "
                };

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "getApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

                dataRepository = new DataRepository();
                spyOn(dataRepository, "getSubmittedDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, []));

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, []));

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, "createForProject").and.returnValue(utils.getPromise(q, []));

                spyOn(hustle, "publish");

                spyOn(dateUtils, "getPeriodRange").and.returnValue([]);

                Timecop.install();
                Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "locale": "en",
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
                    }],
                    "selectedProject": {
                        "id": "123",
                        "name": "MISSIONS EXPLOS"
                    }
                };

            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            describe('formatPeriods', function() {
                it("should format periods to be shown on dashboard", function() {
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);

                    var expectedPeriod = "W42 - " + moment('10-13-2014', 'MM-DD-YYYY').startOf("isoWeek").toDate().toLocaleDateString() + " - " + moment('10-19-2014', 'MM-DD-YYYY').endOf("isoWeek").toDate().toLocaleDateString();
                    expect(scope.formatPeriods("2014W42")).toEqual(expectedPeriod);
                });
            });

            describe('bulk approve', function() {
                it("should bulk approve for project level approvers", function() {
                    rootScope.hasRoles.and.callFake(function(roles) {
                        if (_.contains(roles, 'Project Level Approver'))
                            return true;
                        return false;
                    });

                    var moduleDataBlocks = [{
                        "moduleId": "mod1",
                        "period": "2014W01",
                        'submitted': true,
                        'approvedAtProjectLevel': false
                    }, {
                        "moduleId": "mod2",
                        "period": "2014W01",
                        'submitted': true,
                        'approvedAtProjectLevel': false,
                        "selectedForApproval": true
                    }, {
                        "moduleId": "mod1",
                        "period": "2014W02",
                        'submitted': true,
                        'approvedAtProjectLevel': false,
                        "selectedForApproval": true
                    }, {
                        "moduleId": "mod2",
                        "period": "2014W02",
                        'submitted': true,
                        'approvedAtProjectLevel': true,
                        "approvedAtCoordinationLevel": false
                    }];

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, moduleDataBlocks));
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);

                    scope.bulkApprove();
                    scope.$apply();

                    expect(fakeModal.open).toHaveBeenCalled();

                    expect(approvalDataRepository.markAsComplete).toHaveBeenCalledWith([{
                        "orgUnit": "mod2",
                        "period": "2014W01"
                    }, {
                        "orgUnit": "mod1",
                        "period": "2014W02"
                    }], "dataentryuser");

                    expect(hustle.publish.calls.count()).toEqual(1);
                    expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                        "data": [{
                            "period": "2014W01",
                            "orgUnit": "mod2"
                        }, {
                            "orgUnit": "mod1",
                            "period": "2014W02"
                        }],
                        "type": "uploadCompletionData",
                        "locale": "en",
                        "desc": "Uploading Completion Data for 2014W01,2014W02"
                    });

                });

                it("should bulk approve for coordination level approvers", function() {
                    rootScope.hasRoles.and.callFake(function(roles) {
                        if (_.contains(roles, 'Coordination Level Approver'))
                            return true;
                        return false;
                    });

                    var moduleDataBlocks = [{
                        "moduleId": "mod1",
                        "period": "2014W01",
                        'isSubmitted': true,
                        'isComplete': true,
                        "isApproved": false
                    }, {
                        "moduleId": "mod2",
                        "period": "2014W01",
                        'isSubmitted': true,
                        'isComplete': true,
                        "isApproved": false,
                        "selectedForApproval": true
                    }, {
                        "moduleId": "mod1",
                        "period": "2014W02",
                        'isSubmitted': true,
                        'isComplete': true,
                        "isApproved": false,
                        "selectedForApproval": true
                    }];

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, moduleDataBlocks));
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);

                    scope.bulkApprove();
                    scope.$apply();

                    expect(fakeModal.open).toHaveBeenCalled();

                    expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith([{
                        "orgUnit": "mod2",
                        "period": "2014W01"
                    }, {
                        "orgUnit": "mod1",
                        "period": "2014W02"
                    }], "dataentryuser");

                    expect(hustle.publish.calls.count()).toEqual(1);
                    expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                        "data": [{
                            "period": "2014W01",
                            "orgUnit": "mod2"
                        }, {
                            "orgUnit": "mod1",
                            "period": "2014W02"
                        }],
                        "type": "uploadApprovalData",
                        "locale": "en",
                        "desc": "Uploading Approval Data for 2014W01,2014W02"
                    });

                });
            });

            describe('load dashboard', function() {

                it('should create module data blocks for project', function() {
                    dateUtils.getPeriodRange.and.returnValue(["2014W01", "2014W02", "2014W03"]);
                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, []));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    scope.$apply();

                    expect(moduleDataBlockFactory.createForProject).toHaveBeenCalledWith(
                        rootScope.currentUser.selectedProject.id,
                        ["2014W01", "2014W02", "2014W03"]
                    );
                });

                it('should filter items awaiting at data entry level', function() {
                    var expectedModuleDataBlocks = [{
                        "moduleId": "a0560fac722",
                        "awaitingActionAtDataEntryLevel": true,
                        "isNotSynced": true
                    },{
                        "moduleId": "a0560fac723",
                        "awaitingActionAtDataEntryLevel": false,
                        "isNotSynced": false
                    }];

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, expectedModuleDataBlocks));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    scope.$apply();

                    expect(scope.itemsAwaitingSubmission).toEqual([expectedModuleDataBlocks[0]]);
                });

                it('should filter items awaiting action at project level approval', function() {
                    var expectedModuleDataBlocks = [{
                        "moduleId": "a0560fac722",
                        awaitingActionAtProjectLevelApprover: false,
                        "isNotSynced": false
                    },{
                        "moduleId": "a0560fac723",
                        "awaitingActionAtProjectLevelApprover": true,
                        "isNotSynced": false
                    }];

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, expectedModuleDataBlocks));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    scope.$apply();

                    expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual([expectedModuleDataBlocks[1]]);
                });

                it('should filter items awaiting action at coordination level approval', function() {
                    var expectedModuleDataBlocks = [{
                        "moduleId": "a0560fac722",
                        awaitingActionAtCoordinationLevelApprover: false,
                        "isNotSynced": false
                    },{
                        "moduleId": "a0560fac723",
                        "awaitingActionAtCoordinationLevelApprover": true,
                        "isNotSynced": false
                    }];

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, expectedModuleDataBlocks));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    scope.$apply();

                    expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual([expectedModuleDataBlocks[1]]);
                });
            });

            describe('getTemplateUrl', function() {
                it("should return the aggregate data entry template url by default", function() {
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    rootScope.hasRoles.and.callFake(function(roles) {
                        if (_.contains(roles, 'Data entry user'))
                            return true;
                        return false;
                    });
                    rootScope.currentUser.userCredentials = {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Data entry user'
                        }]
                    };
                    var item = {
                        "moduleId": "mod1",
                        "period": "2014W01",
                        'submitted': true,
                        'approvedAtProjectLevel': false,
                        'lineListService': false
                    };

                    var result = scope.getTemplateUrl(item);
                    expect(result).toEqual("#/aggregate-data-entry/mod1/2014W01");
                });

                it("should return the list-list entry template url for a data entry user if current module contains line list programs", function() {
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    rootScope.hasRoles.and.callFake(function(roles) {
                        if (_.contains(roles, 'Data entry user'))
                            return true;
                        return false;
                    });
                    rootScope.currentUser.userCredentials = {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Data entry user'
                        }]
                    };
                    rootScope.$apply();
                    var item = {
                        "moduleId": "mod1",
                        "period": "2014W01",
                        'submitted': true,
                        'approvedAtProjectLevel': false,
                        'lineListService': true
                    };

                    var result = scope.getTemplateUrl(item);
                    expect(result).toEqual("#/line-list-summary/mod1/?filterBy=dateRange&startDate=2013-12-30&endDate=2014-01-05");
                });

                it("should return the approval template if user is a project level approver", function() {
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    rootScope.hasRoles.and.callFake(function(roles) {
                        if (_.contains(roles, 'Project Level Approver'))
                            return true;
                        return false;
                    });
                    rootScope.currentUser.userCredentials = {
                        "username": "projectLevelApprover",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Project Level Approver'
                        }]
                    };
                    var item = {
                        "moduleId": "mod1",
                        "period": "2014W01",
                        'isSubmitted': true,
                        'isComplete': false,
                        'isLineListService': true
                    };

                    var result = scope.getTemplateUrl(item);
                    expect(result).toEqual("#/data-approval/mod1/2014W01");
                });

                it("should return the approval template if user is a coordination level approver", function() {
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository, moduleDataBlockFactory);
                    rootScope.hasRoles.and.callFake(function(roles) {
                        if (_.contains(roles, 'Coordination Level Approver'))
                            return true;
                        return false;
                    });
                    rootScope.currentUser.userCredentials = {
                        "username": "projectLevelApprover",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Coordination Level Approver'
                        }]
                    };
                    var item = {
                        "moduleId": "mod1",
                        "period": "2014W01",
                        'isSubmitted': true,
                        'isComplete': false,
                        'isLineListService': true
                    };

                    var result = scope.getTemplateUrl(item);
                    expect(result).toEqual("#/data-approval/mod1/2014W01");
                });
            });
        });
    });
