/*global Date:true*/
define(["dataApprovalController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "timecop", "dataRepository", "approvalDataRepository", "orgUnitRepository", "systemSettingRepository", "datasetRepository", "programRepository"],
    function(DataApprovalController, testData, mocks, _, utils, orgUnitMapper, moment, timecop, DataRepository, ApprovalDataRepository, OrgUnitRepository, SystemSettingRepository, DatasetRepository, ProgramRepository) {
        describe("dataApprovalController ", function() {
            var scope, routeParams, q, location, anchorScroll, dataApprovalController, rootScope, approvalStore,
                saveSuccessPromise, saveErrorPromise, dataEntryFormMock, parentProject, getApprovalDataSpy, getDataValuesSpy,
                orgUnits, window, getOrgUnitSpy, hustle, dataRepository, approvalDataRepository, timeout, orgUnitRepository, systemSettingRepository, origin1, origin2, geographicOrigins;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $anchorScroll, $location, $window, $timeout) {
                q = $q;
                hustle = $hustle;
                window = $window;
                timeout = $timeout;
                location = $location;
                anchorScroll = $anchorScroll;
                rootScope = $rootScope;
                routeParams = {};

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

                scope = $rootScope.$new();

                scope.currentModule = {
                    id: 'mod2',
                    name: 'Mod2',
                    parent: {
                        id: 'parent'
                    }
                };
                origin1 = {
                    id: 'origin1',
                    parent: {
                        id: 'mod2'
                    }
                };
                origin2 = {
                    id: 'origin2',
                    parent: {
                        id: 'mod2'
                    }
                };
                scope.year = 2014;
                scope.week = {
                    "weekNumber": 14,
                    "weekYear": 2014
                };

                scope.dataentryForm = {
                    $setPristine: function() {}
                };

                scope.resourceBundle = {
                    "dataApprovalConfirmationMessage": ""
                };

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "locale": "en",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Superuser'
                        }, {
                            "id": "hxNB8lleCsl",
                            "name": 'blah'
                        }]
                    },
                    "organisationUnits": [{
                        id: "proj_1",
                        "name": "MISSIONS EXPLOS"
                    }, {
                        id: "test1",
                        "name": "MISSIONS EXPLOS123"
                    }, {
                        id: "test2",
                        "name": "MISSIONS EXPLOS345"
                    }]
                };

                scope.resourceBundle = {
                    "uploadDataValuesDesc": "upload data for ",
                    "uploadApprovalDataDesc": "approve data at coordination level for ",
                    "uploadCompletionDataDesc": "approve data at project level for ",
                    "deleteApprovalsDesc": "restart approval process for "
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

                saveSuccessPromise = utils.getPromise(q, {
                    "ok": "ok"
                });

                saveErrorPromise = utils.getRejectedPromise(q, {
                    "ok": "ok"
                });

                spyOn(location, "hash");

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeDataElements").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeCategoryOptionCombinations").and.returnValue(utils.getPromise(q, []));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, undefined));

                orgUnitRepository = new OrgUnitRepository();
                parentProject = {
                    'id': 'parent',
                    'attributeValues': [{
                        'attribute': {
                            'code': 'Type',
                            'name': 'Type',
                        },
                        'value': 'Project'
                    }]
                };
                getOrgUnitSpy = spyOn(orgUnitRepository, "getParentProject");
                getOrgUnitSpy.and.returnValue(utils.getPromise(q, parentProject));
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, [origin1, origin2]));

                systemSettingRepository = new SystemSettingRepository();
                spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, {}));

                approvalDataRepository = new ApprovalDataRepository();
                getApprovalDataSpy = spyOn(approvalDataRepository, "getApprovalData");
                getApprovalDataSpy.and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));

                dataRepository = new DataRepository();
                getDataValuesSpy = spyOn(dataRepository, "getDataValues");
                getDataValuesSpy.and.returnValue(utils.getPromise(q, undefined));

                spyOn(hustle, "publish");
                dataApprovalController = new DataApprovalController(scope, routeParams, q, hustle, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository, datasetRepository, programRepository);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });


            it("should submit data for first level approval", function() {
                var levelOneApprovalDataSaved = false;
                getApprovalDataSpy.and.callFake(function() {
                    if (levelOneApprovalDataSaved)
                        return utils.getPromise(q, {
                            "isComplete": true
                        });
                    return utils.getPromise(q, undefined);
                });

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsComplete").and.callFake(function() {
                    levelOneApprovalDataSaved = true;
                    return utils.getPromise(q, {});
                });

                var periodAndOrgUnit = {
                    "period": '2014W14',
                    "orgUnit": 'mod1'
                };
                var storedBy = "dataentryuser";
                scope.currentModule = {
                    id: 'mod1',
                    name: 'Mod1',
                    parent: {
                        id: 'parent'
                    }
                };

                dataApprovalController = new DataApprovalController(scope, routeParams, q, hustle, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository, datasetRepository, programRepository);
                scope.$apply();

                scope.firstLevelApproval();
                scope.$apply();

                expect(approvalDataRepository.markAsComplete).toHaveBeenCalledWith(periodAndOrgUnit, storedBy);

                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [periodAndOrgUnit],
                    "type": "uploadCompletionData",
                    "locale": "en",
                    "desc": "approve data at project level for 2014W14, Module: Mod1"

                }, "dataValues");

                expect(scope.firstLevelApproveSuccess).toBe(true);
                expect(scope.secondLevelApproveSuccess).toBe(false);
                expect(scope.approveError).toBe(false);
                expect(scope.isCompleted).toEqual(true);
            });

            it("should not submit data for approval", function() {
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getRejectedPromise(q, {}));

                scope.firstLevelApproval();
                scope.$apply();

                expect(scope.firstLevelApproveSuccess).toBe(false);
                expect(scope.secondLevelApproveSuccess).toBe(false);
                expect(scope.approveError).toBe(true);
                expect(scope.isCompleted).toEqual(false);
            });

            it("should mark data as complete if proccessed", function() {
                scope.$apply();

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });
                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getPromise(q, {}));

                scope.firstLevelApproval();
                scope.$apply();

                expect(scope.firstLevelApproveSuccess).toBe(true);
                expect(scope.secondLevelApproveSuccess).toBe(false);
                expect(scope.approveError).toBe(false);
            });

            it("should mark data as approved if proccessed", function() {
                var levelTwoApprovalDataSaved = false;
                getApprovalDataSpy.and.callFake(function() {
                    if (levelTwoApprovalDataSaved)
                        return utils.getPromise(q, {
                            "isComplete": true,
                            "isApproved": true
                        });
                    return utils.getPromise(q, {
                        "isComplete": true
                    });
                });

                scope.$apply();

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsApproved").and.callFake(function() {
                    levelTwoApprovalDataSaved = true;
                    return utils.getPromise(q, {
                        "blah": "moreBlah"
                    });
                });

                scope.secondLevelApproval();
                scope.$apply();

                expect(scope.firstLevelApproveSuccess).toBe(false);
                expect(scope.secondLevelApproveSuccess).toBe(true);
                expect(scope.approveError).toBe(false);
                expect(scope.isCompleted).toEqual(true);
                expect(scope.isApproved).toEqual(true);
            });

            it("should submit data for second level approval", function() {
                var levelTwoApprovalDataSaved = false;
                getApprovalDataSpy.and.callFake(function() {
                    if (levelTwoApprovalDataSaved)
                        return utils.getPromise(q, {
                            "isComplete": true,
                            "isApproved": true
                        });
                    return utils.getPromise(q, {
                        "isComplete": true
                    });
                });

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsApproved").and.callFake(function() {
                    levelTwoApprovalDataSaved = true;
                    return utils.getPromise(q, {});
                });

                var periodAndOrgUnit = {
                    "period": '2014W14',
                    "orgUnit": 'mod1',
                };
                var approvedBy = "dataentryuser";
                scope.currentModule = {
                    id: 'mod1',
                    name: 'Mod1',
                    parent: {
                        id: 'parent'
                    }
                };

                dataApprovalController = new DataApprovalController(scope, routeParams, q, hustle, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository, datasetRepository, programRepository);
                scope.$apply();

                scope.secondLevelApproval();
                scope.$apply();

                expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith(periodAndOrgUnit, approvedBy);
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [periodAndOrgUnit],
                    "type": "uploadApprovalData",
                    "locale": "en",
                    "desc": "approve data at coordination level for 2014W14, Module: Mod1"
                }, "dataValues");
                expect(scope.secondLevelApproveSuccess).toBe(true);
                expect(scope.approveError).toBe(false);
            });

            it("should return the sum of the list ", function() {
                var dataValues = {
                    "ou1": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            },
                            "c2": {
                                "value": "2"
                            }
                        }
                    },
                    "ou2": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            },
                            "c2": {
                                "value": "2"
                            }
                        },
                        "de2": {
                            "c2": {
                                "value": "10"
                            }
                        }
                    },
                    "ou3": undefined
                };

                var orgUnits = [{
                    "id": "ou1",
                    "name": "ou1"
                }, {
                    "id": "ou2",
                    "name": "ou2"
                }, {
                    "id": "ou3",
                    "name": "ou3"
                }];

                expect(scope.sum(dataValues, orgUnits, "de1")).toBe(6);
            });
        });
    });
