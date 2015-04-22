define(["dataEntryApprovalDashboardController", "angularMocks", "approvalDataRepository", "orgUnitRepository", "dataRepository", "programEventRepository", "utils", "moment", "timecop", "properties", "lodash"],
    function(DataEntryApprovalDashboardController, mocks, ApprovalDataRepository, OrgUnitRepository, DataRepository, ProgramEventRepository, utils, moment, timecop, properties, _) {
        describe("dataEntryApprovalDashboardController", function() {
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
                spyOn(dataRepository, "getDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, []));

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, []));

                spyOn(hustle, "publish");

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

            it("should format periods to be shown on dashboard", function() {
                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);

                var expectedPeriod = "W42 - " + moment('10-13-2014', 'MM-DD-YYYY').startOf("isoWeek").toDate().toLocaleDateString() + " - " + moment('10-19-2014', 'MM-DD-YYYY').endOf("isoWeek").toDate().toLocaleDateString();
                expect(scope.formatPeriods("2014W42")).toEqual(expectedPeriod);
            });

            it("should select appropriate modules for approval for project level users", function() {

                rootScope.hasRoles.and.callFake(function(roles) {
                    if (_.contains(roles, 'Project Level Approver'))
                        return true;
                    return false;
                });

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);

                scope.dashboardData = [{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false
                }, {
                    "moduleId": "mod1",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false
                }];

                scope.toggleSelectAll(true);

                expect(scope.dashboardData).toEqual([{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod1",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false
                }]);
            });

            it("should deselect appropriate modules for approval for project level users", function() {

                rootScope.hasRoles.and.callFake(function(roles) {
                    if (_.contains(roles, 'Project Level Approver'))
                        return true;
                    return false;
                });

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);

                scope.dashboardData = [{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false
                }, {
                    "moduleId": "mod1",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false
                }];

                scope.toggleSelectAll(false);

                expect(scope.dashboardData).toEqual([{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": false
                }, {
                    "moduleId": "mod1",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": false
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false
                }]);
            });

            it("should select appropriate modules for coordination level users", function() {

                rootScope.hasRoles.and.callFake(function(roles) {
                    if (_.contains(roles, 'Coordination Level Approver'))
                        return true;
                    return false;
                });

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);

                scope.dashboardData = [{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod2",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false
                }];

                scope.toggleSelectAll(true);

                expect(scope.dashboardData).toEqual([{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod2",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false,
                    "selectedForApproval": true
                }]);
            });

            it("should deselect appropriate modules for coordination level users", function() {

                rootScope.hasRoles.and.callFake(function(roles) {
                    if (_.contains(roles, 'Coordination Level Approver'))
                        return true;
                    return false;
                });

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);

                scope.dashboardData = [{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod2",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false
                }];

                scope.toggleSelectAll(false);

                expect(scope.dashboardData).toEqual([{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false,
                    "selectedForApproval": false
                }, {
                    "moduleId": "mod2",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false,
                    "selectedForApproval": false
                }]);
            });


            it("should show data for all user modules", function() {
                rootScope.currentUser.selectedProject = {
                    "id": "prj1",
                    "name": "Project 1"
                };

                var modules = [{
                    "id": "mod1",
                    "name": "Module 1",
                    "openingDate": "2014-01-01",
                    "parent": {
                        "name": "OpUnit 1"
                    }
                }, {
                    "id": "mod2",
                    "name": "Module 2",
                    "openingDate": "2014-01-01",
                    "parent": {
                        "name": "OpUnit 1"
                    }
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(["prj1"]);
                expect(_.uniq(_.pluck(scope.dashboardData, "moduleId"))).toEqual(["mod1", "mod2"]);
                expect(_.uniq(_.pluck(scope.dashboardData, "moduleName"))).toEqual(["OpUnit 1 - Module 1", "OpUnit 1 - Module 2"]);
            });

            it("should show data for all pre-defined periods or based on org unit opening date, whichever is later", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2014-01-01",
                    "parent": {
                        "name": "parent"
                    },
                    "displayName": "parent - mod1"
                }, {
                    "id": "456",
                    "name": "mod2",
                    "openingDate": "2014-04-01",
                    "parent": {
                        "name": "parent"
                    },
                    "displayName": "parent - mod2"
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(_.pluck(_.filter(scope.dashboardData, "moduleId", "123"), "period")).toEqual(['2014W11', '2014W12', '2014W13', '2014W14', '2014W15', '2014W16', '2014W17', '2014W18', '2014W19', '2014W20', '2014W21', '2014W22']);
                expect(_.pluck(_.filter(scope.dashboardData, "moduleId", "456"), "period")).toEqual(['2014W14', '2014W15', '2014W16', '2014W17', '2014W18', '2014W19', '2014W20', '2014W21', '2014W22']);
            });

            it("should set the appropriate status when data has not been submitted", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));
                programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(_.every(scope.dashboardData, "isSubmitted", false)).toBe(true);
                expect(_.every(scope.dashboardData, "isComplete", false)).toBe(true);
                expect(_.every(scope.dashboardData, "isApproved", false)).toBe(true);
            });

            it("should set the appropriate status when data has been submitted for a period", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var dataValues = [{
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W16",
                    "value": "9"
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataValues));
                programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(_.find(scope.dashboardData, "period", "2014W16").isSubmitted).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W16").isComplete).toBe(false);
                expect(_.find(scope.dashboardData, "period", "2014W16").isApproved).toBe(false);
            });

            it("should set the appropriate status based on event data for a period", function() {
                var modules = [{
                    "id": "mod1",
                    "name": "module 1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }, {
                    "id": "mod2",
                    "name": "module 2",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var origins = [{
                    "id": "org1",
                    "parent": {
                        "id": "mod1"
                    }
                }, {
                    "id": "org2",
                    "parent": {
                        "id": "mod1"
                    }
                }, {
                    "id": "org3",
                    "parent": {
                        "id": "mod2"
                    }
                }];

                var eventDataValues = [{
                    "event": "ev1",
                    "period": "2014W16",
                    "orgUnit": "org1"
                }, {
                    "event": "ev2",
                    "period": "2014W16",
                    "orgUnit": "org1"
                }, {
                    "event": "ev3",
                    "period": "2014W16",
                    "orgUnit": "org2"
                }, {
                    "event": "ev4",
                    "period": "2014W17",
                    "orgUnit": "org3",
                    "localStatus": "READY_FOR_DHIS"
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, origins));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));
                programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, eventDataValues));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                var mod1Period2014W16 = _.find(scope.dashboardData, {
                    "period": "2014W16",
                    "moduleId": "mod1"
                });
                expect(mod1Period2014W16.isSubmitted).toBe(true);
                expect(mod1Period2014W16.isComplete).toBe(false);
                expect(mod1Period2014W16.isApproved).toBe(false);

                var mod2Period2014W17 = _.find(scope.dashboardData, {
                    "period": "2014W17",
                    "moduleId": "mod2"
                });
                expect(mod2Period2014W17.isSubmitted).toBe(true);
                expect(mod2Period2014W17.isComplete).toBe(false);
                expect(mod2Period2014W17.isApproved).toBe(false);
            });

            it("should set the appropriate status when data has been saved as draft for a period", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var dataValues = [{
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W16",
                    "value": "9",
                    "isDraft": true
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataValues));
                programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(_.find(scope.dashboardData, "period", "2014W16").isSubmitted).toBe(false);
                expect(_.find(scope.dashboardData, "period", "2014W16").isComplete).toBe(false);
                expect(_.find(scope.dashboardData, "period", "2014W16").isApproved).toBe(false);
            });

            it("should set the appropriate status when data has been marked as complete for a period", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var dataValues = [{
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W16",
                    "value": "9"
                }, {
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W17",
                    "value": "10"
                }];

                var approvalData = [{
                    "orgUnit": "123",
                    "period": "2014W16",
                    "isComplete": true
                }, {
                    "orgUnit": "123",
                    "period": "2014W17",
                    "isComplete": true,
                    "status": "NEW"
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataValues));
                programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, approvalData));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(_.find(scope.dashboardData, "period", "2014W16").isSubmitted).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W16").isComplete).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W16").isApproved).toBe(false);

                expect(_.find(scope.dashboardData, "period", "2014W17").isSubmitted).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W17").isComplete).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W17").isApproved).toBe(false);
            });

            it("should set the appropriate status when data has been marked as approved for a period", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var dataValues = [{
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W16",
                    "value": "9"
                }, {
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W17",
                    "value": "10"
                }];

                var approvalData = [{
                    "orgUnit": "123",
                    "period": "2014W16",
                    "isComplete": true,
                    "isApproved": true
                }, {
                    "orgUnit": "123",
                    "period": "2014W17",
                    "isComplete": true,
                    "isApproved": true,
                    "status": "NEW"
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataValues));
                programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, approvalData));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(_.find(scope.dashboardData, "period", "2014W16").isSubmitted).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W16").isComplete).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W16").isApproved).toBe(true);

                expect(_.find(scope.dashboardData, "period", "2014W17").isSubmitted).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W17").isComplete).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W17").isApproved).toBe(true);
            });

            it("should set the appropriate status when approval data has been deleted for a period", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var dataValues = [{
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W16",
                    "value": "9"
                }, {
                    "categoryOptionCombo": "co123",
                    "dataElement": "de123",
                    "orgUnit": "123",
                    "period": "2014W17",
                    "value": "10"
                }];

                var approvalData = [{
                    "orgUnit": "123",
                    "period": "2014W16",
                    "isComplete": false,
                    "status": "DELETED"
                }, {
                    "orgUnit": "123",
                    "period": "2014W17",
                    "isComplete": false,
                    "isApproved": false,
                    "status": "DELETED"
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataValues));
                programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, approvalData));

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);
                scope.$apply();

                expect(_.find(scope.dashboardData, "period", "2014W16").isSubmitted).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W16").isComplete).toBe(false);
                expect(_.find(scope.dashboardData, "period", "2014W16").isApproved).toBe(false);

                expect(_.find(scope.dashboardData, "period", "2014W17").isSubmitted).toBe(true);
                expect(_.find(scope.dashboardData, "period", "2014W17").isComplete).toBe(false);
                expect(_.find(scope.dashboardData, "period", "2014W17").isApproved).toBe(false);
            });

            it("should bulk approve for project level approvers", function() {
                rootScope.hasRoles.and.callFake(function(roles) {
                    if (_.contains(roles, 'Project Level Approver'))
                        return true;
                    return false;
                });

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);

                scope.dashboardData = [{
                    "moduleId": "mod1",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false
                }, {
                    "moduleId": "mod2",
                    "period": "2014W01",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod1",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': false,
                    "selectedForApproval": true
                }, {
                    "moduleId": "mod2",
                    "period": "2014W02",
                    'isSubmitted': true,
                    'isComplete': true,
                    "isApproved": false
                }];

                scope.bulkApprove();
                scope.$apply();

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

                dataEntryApprovalDashboardController = new DataEntryApprovalDashboardController(scope, hustle, q, rootScope, fakeModal, timeout, location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository);

                scope.dashboardData = [{
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

                scope.bulkApprove();
                scope.$apply();

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
    });
