define(["dashboardController", "angularMocks", "approvalDataRepository", "moduleDataBlockFactory", "utils", "moment", "timecop", "properties", "lodash", "dateUtils", "checkVersionCompatibility", "systemSettingRepository", "chromeUtils", "dataSyncFailureRepository"],
    function(DashboardController, mocks, ApprovalDataRepository, ModuleDataBlockFactory, utils, moment, timecop, properties, _, dateUtils, CheckVersionCompatibility, SystemSettingRepository, chromeUtils, DataSyncFailureRepository) {
        describe("dashboardController", function() {
            var q, rootScope, hustle, scope, location, timeout, fakeModal, dashboardController,
                approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, systemSettingRepository, dataSyncFailureRepository;

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
                    "syncModuleDataBlockDesc": "some description",
                    "uploadApprovalDataDesc": 'some other description',
                    "uploadCompletionDataDesc": 'yet another description'
                };

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "getApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, "createForProject").and.returnValue(utils.getPromise(q, []));

                systemSettingRepository = new SystemSettingRepository();
                checkVersionCompatibility = CheckVersionCompatibility(systemSettingRepository);
                spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, []));
                spyOn(chromeUtils, "getPraxisVersion").and.returnValue('5.1');

                spyOn(hustle, "publish");
                spyOn(hustle, "publishOnce");

                spyOn(dateUtils, "getPeriodRange").and.returnValue([]);

                Timecop.install();
                Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

                rootScope.locale = "en";
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
                    }],
                    "selectedProject": {
                        "id": "123",
                        "name": "MISSIONS EXPLOS"
                    }
                };

                dataSyncFailureRepository = new DataSyncFailureRepository();
                spyOn(dataSyncFailureRepository, "delete").and.returnValue(utils.getPromise(q, undefined));
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            describe('formatPeriods', function() {
                it("should format periods to be shown on dashboard", function() {
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);

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
                        "moduleId": "mod3",
                        "period": "2014W02",
                        'submitted': true,
                        'approvedAtProjectLevel': false,
                        "selectedForApproval": true
                    }, {
                        "moduleId": "mod4",
                        "period": "2014W02",
                        "lineListService": true,
                        'submitted': true,
                        'approvedAtProjectLevel': false,
                        "selectedForApproval": true
                    }];

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, moduleDataBlocks));
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);

                    scope.bulkApprove();
                    scope.$apply();

                    expect(fakeModal.open).toHaveBeenCalled();

                    expect(approvalDataRepository.markAsComplete).toHaveBeenCalledWith([{
                        "orgUnit": "mod2",
                        "period": "2014W01"
                    }, {
                        "orgUnit": "mod3",
                        "period": "2014W02"
                    }, {
                        "orgUnit": "mod4",
                        "period": "2014W02"
                    }], rootScope.currentUser.userCredentials.username);

                    expect(hustle.publish.calls.count()).toEqual(1);
                    expect(hustle.publishOnce.calls.count()).toEqual(2);
                    expect(hustle.publishOnce.calls.argsFor(0)[0]).toEqual({
                        "data": {
                            "moduleId": "mod2",
                            "period": "2014W01"
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc + " 2014W01"
                    });
                    expect(hustle.publishOnce.calls.argsFor(1)[0]).toEqual({
                        "data": {
                            "moduleId": "mod3",
                            "period": "2014W02"
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc + " 2014W02"
                    });
                    expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                        "data": [{
                            "orgUnit": "mod4",
                            "period": "2014W02"
                        }],
                        "type": "uploadCompletionData",
                        "locale": "en",
                        "desc": scope.resourceBundle.uploadCompletionDataDesc + "2014W02"
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
                        "moduleId": "mod3",
                        "period": "2014W02",
                        'isSubmitted': true,
                        'isComplete': true,
                        "isApproved": false,
                        "selectedForApproval": true
                    }, {
                        "moduleId": "mod4",
                        "period": "2014W02",
                        'isSubmitted': true,
                        'isComplete': true,
                        "isApproved": false,
                        "lineListService": true,
                        "selectedForApproval": true
                    }];

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, moduleDataBlocks));
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);

                    scope.bulkApprove();
                    scope.$apply();

                    expect(fakeModal.open).toHaveBeenCalled();

                    expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith([{
                        "orgUnit": "mod2",
                        "period": "2014W01"
                    }, {
                        "orgUnit": "mod3",
                        "period": "2014W02"
                    }, {
                        "orgUnit": "mod4",
                        "period": "2014W02"
                    }], "dataentryuser");

                    expect(hustle.publish.calls.count()).toEqual(1);
                    expect(hustle.publishOnce.calls.count()).toEqual(2);
                    expect(hustle.publishOnce.calls.argsFor(0)[0]).toEqual({
                        "data": {
                            "moduleId": "mod2",
                            "period": "2014W01"
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc + " 2014W01"
                    });
                    expect(hustle.publishOnce.calls.argsFor(1)[0]).toEqual({
                        "data": {
                            "moduleId": "mod3",
                            "period": "2014W02"
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc + " 2014W02"
                    });
                    expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                        "data": [{
                            "orgUnit": "mod4",
                            "period": "2014W02"
                        }],
                        "type": "uploadApprovalData",
                        "locale": "en",
                        "desc": scope.resourceBundle.uploadApprovalDataDesc + "2014W02"
                    });
                });
            });

            describe('load dashboard', function() {

                it('should create module data blocks for project', function() {
                    dateUtils.getPeriodRange.and.returnValue(["2014W01", "2014W02", "2014W03"]);
                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, []));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
                    scope.$apply();

                    expect(moduleDataBlockFactory.createForProject).toHaveBeenCalledWith(
                        rootScope.currentUser.selectedProject.id,
                        ["2014W01", "2014W02", "2014W03"]
                    );
                });

                it('should filter items awaiting at data entry level', function() {
                    var moduleDataBlockA = {
                        "moduleId": "moduleA",
                        "moduleName": "moduleAName",
                        "awaitingActionAtDataEntryLevel": true,
                        "notSynced": true
                    }, moduleDataBlockB = {
                        "moduleId": "moduleB",
                        "moduleName": "moduleBName",
                        "awaitingActionAtDataEntryLevel": false,
                        "notSynced": false
                    };

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, [moduleDataBlockA, moduleDataBlockB]));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
                    scope.$apply();

                    expect(scope.itemsAwaitingSubmission).toEqual({ moduleAName: [moduleDataBlockA] });
                });

                it('should filter items awaiting action at project level approval', function() {
                    var moduleDataBlockA = {
                        "moduleId": "moduleA",
                        "moduleName": "moduleAName",
                        "awaitingActionAtProjectLevelApprover": false,
                        "notSynced": false
                    }, moduleDataBlockB = {
                        "moduleId": "moduleB",
                        "moduleName": "moduleBName",
                        "awaitingActionAtProjectLevelApprover": true,
                        "notSynced": false
                    };

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, [moduleDataBlockA, moduleDataBlockB]));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
                    scope.$apply();

                    expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual({ moduleBName: [moduleDataBlockB] });
                });

                it('should filter items awaiting action at coordination level approval', function() {
                    var moduleDataBlockA = {
                        "moduleId": "moduleA",
                        "moduleName": "moduleAName",
                        "awaitingActionAtCoordinationLevelApprover": false,
                        "notSynced": false
                    }, moduleDataBlockB = {
                        "moduleId": "moduleB",
                        "moduleName": "moduleBName",
                        "awaitingActionAtCoordinationLevelApprover": true,
                        "notSynced": false
                    };

                    moduleDataBlockFactory.createForProject.and.returnValue(utils.getPromise(q, [moduleDataBlockA, moduleDataBlockB]));

                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
                    scope.$apply();

                    expect(scope.itemsAwaitingApprovalAtOtherLevels).toEqual({ moduleBName: [moduleDataBlockB] });
                });
            });

            describe('getTemplateUrl', function() {
                it("should return the aggregate data entry template url by default", function() {
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
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
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
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
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
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
                    dashboardController = new DashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository);
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
