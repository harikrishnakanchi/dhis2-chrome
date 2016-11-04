/*global Date:true*/
define(["dataApprovalController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "timecop", "dataRepository", "approvalDataRepository", "orgUnitRepository", "excludedDataElementsRepository", "dataSetRepository", "programRepository", "referralLocationsRepository", "translationsService", "moduleDataBlockFactory", "dataSyncFailureRepository"],
    function(DataApprovalController, testData, mocks, _, utils, orgUnitMapper, moment, timecop, DataRepository, ApprovalDataRepository, OrgUnitRepository, ExcludedDataElementsRepository, DatasetRepository, ProgramRepository, ReferralLocationsRepository, TranslationsService, ModuleDataBlockFactory, DataSyncFailureRepository) {
        describe("dataApprovalController ", function() {
            var rootScope, scope, routeParams, q, window, location, anchorScroll, hustle, timeout,
                dataApprovalController,
                saveSuccessPromise, saveErrorPromise, fakeModal, parentProject, selectedPeriod, origin1, origin2,
                dataRepository, datasetRepository, approvalDataRepository, orgUnitRepository, excludedDataElementsRepository, programRepository, dataSyncFailureRepository, referralLocationsRepository,
                translationsService, moduleDataBlockFactory;

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

                scope.selectedModule = {
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
                selectedPeriod = '2014W14';

                scope.dataentryForm = {
                    $setPristine: function() {}
                };

                rootScope.locale = "en";
                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Projectadmin'
                        }, {
                            "id": "hxNB8lleCsl",
                            "name": 'blah'
                        }]
                    },
                    "organisationUnits": [{
                        "id": "proj_1",
                        "name": "MISSIONS EXPLOS"
                    }, {
                        "id": "test1",
                        "name": "MISSIONS EXPLOS123"
                    }, {
                        "id": "test2",
                        "name": "MISSIONS EXPLOS345"
                    }],
                    "selectedProject": {
                        "id": "proj_1",
                        "name": "MISSIONS EXPLOS"
                    }
                };

                scope.resourceBundle = {
                    syncModuleDataBlockDesc: 'some description'
                };

                scope.startLoading = jasmine.createSpy('startLoading');
                scope.stopLoading = jasmine.createSpy('stopLoading');

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
                rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(false);
                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeDataElements").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeColumnConfigurations").and.returnValue(utils.getPromise(q, []));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, undefined));

                parentProject = {
                    'id': 'parent',
                    'attributeValues': [{
                        'attribute': {
                            'code': 'Type',
                            'name': 'Type'
                        },
                        'value': 'Project'
                    }]
                };
                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getParentProject').and.returnValue(utils.getPromise(q, parentProject));
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, [origin1, origin2]));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, {}));

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'getDataValues').and.returnValue(utils.getPromise(q, undefined));
                spyOn(dataRepository, 'getLocalStatus').and.returnValue(utils.getPromise(q, undefined));

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, []));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.returnValue([]);
                spyOn(translationsService, "translateReferralLocations").and.returnValue([]);

                spyOn(hustle, "publish");
                spyOn(hustle, "publishOnce");

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, "create").and.returnValue(utils.getPromise(q, {}));

                dataSyncFailureRepository = new DataSyncFailureRepository();
                spyOn(dataSyncFailureRepository, "delete").and.returnValue(utils.getPromise(q, undefined));
                dataApprovalController = new DataApprovalController(scope, routeParams, q, hustle, dataRepository, excludedDataElementsRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository, datasetRepository, programRepository, referralLocationsRepository, translationsService, moduleDataBlockFactory, dataSyncFailureRepository);
                scope.$emit("moduleWeekInfo", [scope.selectedModule, scope.week]);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            describe('First level approval', function () {
                var periodAndOrgUnit, storedBy;

                beforeEach(function () {
                    moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                        approvedAtProjectLevel: "level1ApprovalFromModuleDataBlock"
                    }));

                    spyOn(fakeModal, "open").and.returnValue({
                        result: utils.getPromise(q, {})
                    });

                    spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getPromise(q, {}));

                    periodAndOrgUnit = {
                        "period": '2014W14',
                        "orgUnit": 'mod1'
                    };
                    storedBy = "dataentryuser";
                    scope.selectedModule = {
                        id: 'mod1',
                        name: 'Mod1',
                        parent: {
                            id: 'parent'
                        }
                    };
                });

                it("should submit data for aggregate module", function () {

                    scope.$emit("moduleWeekInfo", [scope.selectedModule, scope.week]);
                    scope.$apply();

                    expect(moduleDataBlockFactory.create).toHaveBeenCalledWith(scope.selectedModule.id, selectedPeriod);
                    expect(scope.isCompleted).toBe("level1ApprovalFromModuleDataBlock");

                    scope.firstLevelApproval();
                    scope.$apply();

                    expect(approvalDataRepository.markAsComplete).toHaveBeenCalledWith(periodAndOrgUnit, storedBy);

                    expect(hustle.publishOnce).toHaveBeenCalledWith({
                        "data": {
                            moduleId: scope.selectedModule.id,
                            period: selectedPeriod
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc

                    }, "dataValues");
                });

                it("should submit data for linelist module", function () {
                    programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, {
                        name: 'mockProgram'
                    }));

                    scope.$emit("moduleWeekInfo", [scope.selectedModule, scope.week]);
                    scope.$apply();

                    expect(moduleDataBlockFactory.create).toHaveBeenCalledWith(scope.selectedModule.id, selectedPeriod);
                    expect(scope.isCompleted).toBe("level1ApprovalFromModuleDataBlock");

                    scope.firstLevelApproval();
                    scope.$apply();

                    expect(approvalDataRepository.markAsComplete).toHaveBeenCalledWith(periodAndOrgUnit, storedBy);

                    expect(hustle.publishOnce).toHaveBeenCalledWith({
                        "data": {
                            period: '2014W14',
                            moduleId: 'mod1'
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc
                    }, "dataValues");
                });
            });

            describe('Second level approval', function () {
                var periodAndOrgUnit, approvedBy;

                beforeEach(function () {
                    moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                        approvedAtCoordinationLevel: 'level2ApprovalFromModuleDataBlock'
                    }));

                    spyOn(fakeModal, "open").and.returnValue({
                        result: utils.getPromise(q, {})
                    });

                    spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                    periodAndOrgUnit = {
                        "period": '2014W14',
                        "orgUnit": 'mod1',
                    };
                    approvedBy = "dataentryuser";
                    scope.selectedModule = {
                        id: 'mod1',
                        name: 'Mod1',
                        parent: {
                            id: 'parent'
                        }
                    };
                });
                it("should submit data for aggregate module", function() {
                    scope.$emit("moduleWeekInfo", [scope.selectedModule, scope.week]);
                    scope.$apply();

                    expect(scope.isApproved).toBe('level2ApprovalFromModuleDataBlock');

                    scope.secondLevelApproval();
                    scope.$apply();

                    expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith(periodAndOrgUnit, approvedBy);
                    expect(hustle.publishOnce).toHaveBeenCalledWith({
                        "data": {
                            period: selectedPeriod,
                            moduleId: scope.selectedModule.id
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc
                    }, "dataValues");
                });

                it("should submit data for linelist module ", function() {
                    programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, {
                        name: 'mockProgram'
                    }));
                    scope.$emit("moduleWeekInfo", [scope.selectedModule, scope.week]);
                    scope.$apply();

                    expect(scope.isApproved).toBe('level2ApprovalFromModuleDataBlock');

                    scope.secondLevelApproval();
                    scope.$apply();

                    expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith(periodAndOrgUnit, approvedBy);
                    expect(hustle.publishOnce).toHaveBeenCalledWith({
                        "data": {
                            moduleId: periodAndOrgUnit.orgUnit,
                            period: periodAndOrgUnit.period
                        },
                        "type": "syncModuleDataBlock",
                        "locale": "en",
                        "desc": scope.resourceBundle.syncModuleDataBlockDesc
                    }, "dataValues");
                });
            });

            it("should not publish approval to DHIS if repository operation fails", function() {
                scope.$apply();
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });
                programRepository = new ProgramRepository();

                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getRejectedPromise(q, {}));

                scope.firstLevelApproval();
                scope.$apply();

                expect(hustle.publish).not.toHaveBeenCalled();
                expect(scope.firstLevelApproveSuccess).toBe(false);
                expect(scope.secondLevelApproveSuccess).toBe(false);
                expect(scope.approveError).toBe(true);
            });

            it("should notify user if first level approval is successful", function() {
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

            it("should notify the user if the second level approval is successful", function() {
                scope.$apply();

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                scope.secondLevelApproval();
                scope.$apply();

                expect(scope.firstLevelApproveSuccess).toBe(false);
                expect(scope.secondLevelApproveSuccess).toBe(true);
                expect(scope.approveError).toBe(false);
            });

            it("should not show form when data is not available", function() {
                rootScope.hasRoles.and.returnValue(true);
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    submitted: false
                }));
                scope.$apply();

                expect(scope.showForm()).toEqual(false);
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
                scope.$apply();
                expect(scope.sum(dataValues, orgUnits, "de1", ['c1', 'c2'])).toBe(6);
            });

            it("should return the sum of column for given option ", function() {
                var sectionDataElements = [{
                    "id": "de1",
                    "isIncluded": true
                }, {
                    "id": "de2",
                    "isIncluded": true
                }];
                var dataValues = {
                    "ou1": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            },
                            "c2": {
                                "value": "2"
                            }
                        },
                        "de2": {
                            "c1": {
                                "value": "10"
                            },
                            "c2": {
                                "value": "20"
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
                        "de3": {
                            "c1": {
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

                expect(scope.columnSum(dataValues, orgUnits, sectionDataElements, "c1")).toBe(12);
            });
            
            it("should return the column sum in a section for only data elements which are included", function() {
                var sectionDataElements = [{
                    "id": "de1",
                    "isIncluded": true
                }, {
                    "id": "de2",
                    "isIncluded": false
                }];
                var dataValues = {
                    "ou1": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            },
                            "c2": {
                                "value": "2"
                            }
                        },
                        "de2": {
                            "c1": {
                                "value": "10"
                            },
                            "c2": {
                                "value": "20"
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
                        "de3": {
                            "c1": {
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

                expect(scope.columnSum(dataValues, orgUnits, sectionDataElements, "c1")).toBe(2);
            });

            it("should return the column sum in a section for configured data elements in referral dataset", function() {
                var sectionDataElements = [{
                    "id": "de1",
                    "formName": "DE 1",
                    "isIncluded": true
                }, {
                    "id": "de2",
                    "formName": "DE 2",
                    "isIncluded": true
                }, {
                    "id": "de3",
                    "formName": "DE 3",
                    "isIncluded": true
                }];

                var dataValues = {
                    "ou1": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            }
                        },
                        "de2": {
                            "c1": {
                                "value": "10"
                            }
                        },
                        "de3": {
                            "c1": {
                                "value": "3"
                            }
                        }
                    }
                };

                var orgUnits = [{
                    "id": "ou1",
                    "name": "ou1"
                }];

                scope.$apply();
                scope.referralLocations = {
                    "DE 1": "Awesome Name",
                    "DE 3": "Another awesome name"
                };

                expect(scope.columnSum(dataValues, orgUnits, sectionDataElements, "c1", true)).toBe(4);
            });

            it("should return the total sum for all rows ", function() {
                var sectionDataElements = [{
                    "id": "de1"
                }, {
                    "id": "de2"
                }];
                var dataValues = {
                    "ou1": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            },
                            "c2": {
                                "value": "2"
                            }
                        },
                        "de2": {
                            "c1": {
                                "value": "10"
                            },
                            "c2": {
                                "value": "20"
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
                        "de3": {
                            "c1": {
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
                scope.$apply();
                scope.sum(dataValues, orgUnits, "de1", ['c1', 'c2']);
                scope.sum(dataValues, orgUnits, "de2", ['c1', 'c2']);
                expect(scope.rowTotal).toEqual({
                    "de1": 6,
                    "de2": 30
                });
                expect(scope.totalSum(dataValues, sectionDataElements)).toEqual(36);
            });

            it("should not sum up options that are not in the catOptComboIdsToBeTotalled ", function() {
                var dataValues = {
                    "ou1": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            },
                            "c3": {
                                "value": "2"
                            }
                        }
                    },
                    "ou2": {
                        "de1": {
                            "c1": {
                                "value": "1"
                            },
                            "c3": {
                                "value": "2"
                            }
                        },
                        "de2": {
                            "c3": {
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
                scope.$apply();
                expect(scope.sum(dataValues, orgUnits, "de1", ['c1', 'c2'])).toBe(2);
            });
        });
    });
