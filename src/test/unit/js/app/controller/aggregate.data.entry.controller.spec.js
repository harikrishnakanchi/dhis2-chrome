define(["aggregateDataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "timecop", "dataRepository", "approvalDataRepository", "orgUnitRepository", "excludedDataElementsRepository", "datasetRepository", "programRepository", "referralLocationsRepository", "translationsService", "moduleDataBlockFactory", "dataSyncFailureRepository"],
    function(AggregateDataEntryController, testData, mocks, _, utils, orgUnitMapper, moment, timecop, DataRepository, ApprovalDataRepository, OrgUnitRepository, ExcludedDataElementsRepository, DatasetRepository, ProgramRepository, ReferralLocationsRepository, TranslationsService, ModuleDataBlockFactory, DataSyncFailureRepository) {
        describe("aggregateDataEntryController ", function() {
            var scope, routeParams, q, location, anchorScroll, aggregateDataEntryController, rootScope, parentProject, fakeModal,
                window, hustle, timeout, origin1, origin2, mockModuleDataBlock, selectedPeriod,
                dataRepository, approvalDataRepository, programRepository, orgUnitRepository, datasetRepository, referralLocationsRepository, excludedDataElementsRepository, translationsService, moduleDataBlockFactory, dataSyncFailureRepository;

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
                scope = $rootScope.$new();

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

                scope.year = 2014;
                scope.week = {
                    "weekNumber": 14,
                    "weekYear": 2014
                };
                selectedPeriod = '2014W14';
                scope.selectedModule = {
                    'id': 'mod1',
                    'name': 'Mod1',
                    'parent': {
                        'id': 'proj1'
                    }
                };

                parentProject = {
                    'id': 'proj1',
                    'attributeValues': [{
                        'attribute': {
                            'code': 'Type',
                            'name': 'Type',
                        },
                        'value': 'Project'
                    }]
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
                    "syncModuleDataBlockDesc": "some description"
                };

                fakeModal = { open: function() {} };
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                scope.dataentryForm = { $setPristine: function() {} };
                spyOn(scope.dataentryForm, '$setPristine');


                spyOn(location, "hash");

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, parentProject));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, [origin1, origin2]));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, undefined));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, {}));

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                dataRepository = new DataRepository();
                spyOn(dataRepository, "save").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataRepository, "saveAsDraft").and.returnValue(utils.getPromise(q, {}));

                spyOn(hustle, "publishOnce").and.returnValue(utils.getPromise(q, {}));

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeDataElements").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeCategoryOptionCombinations").and.returnValue(utils.getPromise(q, []));

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, []));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.returnValue([]);
                spyOn(translationsService, "translateReferralLocations").and.returnValue([]);

                mockModuleDataBlock = {
                    approvedAtProjectLevel: false,
                    approvedAtCoordinationLevel: false
                };
                scope.moduleDataBlock = mockModuleDataBlock;
                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, "create").and.returnValue(utils.getPromise(q, mockModuleDataBlock));

                dataSyncFailureRepository = new DataSyncFailureRepository();
                spyOn(dataSyncFailureRepository, "delete").and.returnValue(utils.getPromise(q, undefined));

                aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, anchorScroll, location, fakeModal, rootScope, window, timeout, dataRepository, excludedDataElementsRepository, approvalDataRepository, orgUnitRepository, datasetRepository, programRepository, referralLocationsRepository, translationsService, moduleDataBlockFactory, dataSyncFailureRepository);

                scope.$emit("moduleWeekInfo", [scope.selectedModule, scope.week]);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should return the sum of the list ", function() {
                scope.$apply();
                var list = {
                    "option1": {
                        "value": "1"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": "3"
                    },
                    "option4": {
                        "value": "4"
                    }
                };

                expect(scope.sum(list, "de1", ['option1', 'option3', 'option4'])).toBe(8);
            });

            it("should return the sum of valid values ", function() {
                scope.$apply();
                var list = {
                    "option1": {
                        "value": "1"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": undefined
                    },
                    "option4": {
                        "value": "4"
                    }
                };

                expect(scope.sum(list, "de1", ['option1', 'option3', 'option4'])).toBe(5);
            });

            it("should return true if number of origins are greater than 1 ", function() {
                scope.$apply();
                scope.moduleAndOriginOrgUnitIds = ["a3439134495", "a469d3ba630", "aff112d79b4"];
                var dataSet = {id: "a339b7fa9eb",
                    organisationUnits:[
                        {id:"a3439134495"},
                        {id:"a469d3ba630"}
                ]};

                expect(scope.showTotalLabelForOriginDatasetSection(dataSet)).toBe(true);
            });

            it("should return the sum of valid expressions ", function() {
                scope.$apply();
                var list = {
                    "option1": {
                        "formula": "1 + 3",
                        "value": "4"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": "3"
                    },
                    "option4": {
                        "value": "4"
                    }
                };

                expect(scope.sum(list, "de1", ['option1', 'option3', 'option4'])).toBe(11);
            });

            it("should return the sum of the map ", function() {
                scope.$apply();

                var list = {
                    "option1": {
                        "value": "1"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": "3"
                    },
                    "option4": {
                        "value": "4"
                    }
                };
                expect(scope.sum(list, "de1", ['option1', 'option3', 'option4'])).toBe(8);
            });

            it("should return the sum of the same option for all data elements in a section ", function() {
                scope.$apply();
                var section = {
                    "dataElements": [{
                        "id": "de1",
                        "isIncluded": true
                    }, {
                        "id": "de2",
                        "isIncluded": true
                    }]
                };

                var option = "option1";
                var list = {
                    "de1": {
                        "option1": {
                            "value": "5"
                        },
                        "option3": {
                            "value": "10"
                        }
                    },
                    "de2": {
                        "option1": {
                            "value": "1"
                        },
                        "option3": {
                            "value": "2"
                        }
                    },
                    "de3": {
                        "option1": {
                            "value": "10"
                        },
                        "option2": {
                            "value": "20"
                        }
                    }
                };

                expect(scope.columnSum(list, section, option)).toBe(6);
            });

            it("should return the column sum in a section for configured data elements in referral dataset", function() {
                var section = {
                    "dataElements": [{
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
                    }]
                };

                var option = "option1";
                var list = {
                    "de1": {
                        "option1": {
                            "value": "5"
                        }
                    },
                    "de2": {
                        "option1": {
                            "value": "1"
                        }
                    },
                    "de3": {
                        "option1": {
                            "value": "10"
                        }
                    }
                };
                scope.$apply();
                scope.referralLocations = {
                    "DE 1": "Awesome Name",
                    "DE 3": "Another awesome name"
                };

                expect(scope.columnSum(list, section, option, true)).toBe(15);
            });

            it("should return the column sum in a section for only data elements which are included", function() {
                var section = {
                    "dataElements": [{
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
                        "isIncluded": false
                    }]
                };

                var option = "option1";
                var list = {
                    "de1": {
                        "option1": {
                            "value": "5"
                        }
                    },
                    "de2": {
                        "option1": {
                            "value": "1"
                        }
                    },
                    "de3": {
                        "option1": {
                            "value": "10"
                        }
                    }
                };
                scope.$apply();

                expect(scope.columnSum(list, section, option, false)).toBe(6);
            });

            it("should return the sum of all the rows for a given section", function() {
                scope.$apply();
                var section = {
                    "dataElements": [{
                        "id": "de1"
                    }, {
                        "id": "de2"
                    }]
                };
                var forDataElement1 = {
                    "option1": {
                        "value": "1"
                    },
                    "option3": {
                        "value": "2"
                    }
                };
                var forDataElement2 = {
                    "option1": {
                        "value": "10"
                    },
                    "option3": {
                        "value": "20"
                    }
                };
                scope.sum(forDataElement1, "de1", ["option1", "option3"]);
                scope.sum(forDataElement2, "de2", ["option1", "option3"]);

                expect(scope.totalSum(section)).toEqual(33);
                expect(scope.rowTotal).toEqual({
                    "de1": 3,
                    "de2": 30
                });
            });

            it("should evaluate expression on blur and store as string", function() {
                scope.dataValues = {
                    "mod1": {
                        "blah": {
                            "some": {
                                "value": "1+9"
                            }
                        }
                    }
                };
                scope.evaluateExpression("mod1", "blah", "some");

                expect(scope.dataValues.mod1.blah.some.value).toEqual("10");
            });

            it("should submit data values to indexeddb and dhis", function() {
                scope.submit();
                scope.$apply();

                expect(dataRepository.save).toHaveBeenCalled();
                expect(hustle.publishOnce).toHaveBeenCalledWith({
                    data: {
                        moduleId: scope.selectedModule.id,
                        period: selectedPeriod
                    },
                    type: 'syncModuleDataBlock',
                    locale: 'en',
                    desc: scope.resourceBundle.syncModuleDataBlockDesc + selectedPeriod + ', ' + scope.selectedModule.name
                }, 'dataValues');

                expect(scope.submitSuccess).toBe(true);
                expect(scope.saveSuccess).toBe(false);
                expect(scope.submitError).toBe(false);
                expect(scope.saveError).toBe(false);
                expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
            });

            it("should save data values as draft to indexeddb", function() {
                scope.saveAsDraft();
                scope.$apply();

                expect(dataRepository.saveAsDraft).toHaveBeenCalled();
                expect(hustle.publishOnce).not.toHaveBeenCalled();
                expect(scope.submitSuccess).toBe(false);
                expect(scope.saveSuccess).toBe(true);
                expect(scope.submitError).toBe(false);
                expect(scope.saveError).toBe(false);
                expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
            });

            it("should create module data block for current module and period", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, 'someMockModuleDataBlock'));
                scope.$apply();

                expect(moduleDataBlockFactory.create).toHaveBeenCalledWith(scope.selectedModule.id, selectedPeriod);
                expect(scope.moduleDataBlock).toBe('someMockModuleDataBlock');
            });

            it("should warn the user when data will have to be reapproved", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    approvedAtProjectLevel: true,
                    approvedAtCoordinationLevel: true
                }));

                scope.$apply();
                scope.submit();

                expect(fakeModal.open).toHaveBeenCalled();
            });

            it("should let the user know of failures when saving the data to indexedDB ", function() {
                dataRepository.save.and.returnValue(utils.getRejectedPromise(q, {}));

                scope.submit();
                scope.$apply();

                expect(dataRepository.save).toHaveBeenCalled();
                expect(hustle.publishOnce).not.toHaveBeenCalled();
                expect(scope.submitSuccess).toBe(false);
                expect(scope.saveSuccess).toBe(false);
                expect(scope.submitError).toBe(true);
                expect(scope.saveError).toBe(false);
            });

            it("should set syncError to true when selected orgUnit and period data failed to sync to DHIS", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    failedToSync: true
                }));

                scope.$apply();
                expect(scope.syncError).toBe(true);
            });

            it("should fetch max length to calculate col span for category options", function() {
                var maxCols = scope.maxcolumns([
                    [1, 2],
                    [4, 5, 4, 5]
                ]);

                expect(maxCols).toEqual(4);
            });

            it("safe get dataValues should initialize data value and option if not present", function() {
                scope.$apply();
                var dataValues = {};
                var result = scope.safeGet(dataValues, "blah", "someOption", "mod2");

                expect(dataValues).toEqual({
                    "mod2": {
                        "blah": {
                            "someOption": {
                                "formula": '',
                                "value": ''
                            }
                        }
                    }
                });
                expect(result).toEqual({
                    "formula": '',
                    "value": ''
                });
            });

            it("safe get dataValues should return if already present", function() {
                scope.$apply();
                var dataValues = {
                    "mod2": {
                        "blah": {
                            "someOption": "test"
                        }
                    }
                };

                var result = scope.safeGet(dataValues, "blah", "someOption", "mod2");

                expect(dataValues).toEqual({
                    "mod2": {
                        "blah": {
                            "someOption": "test"
                        }
                    }
                });
                expect(result).toEqual(dataValues.mod2.blah.someOption);
            });

            it("should fetch empty data if no data exists for the given period", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    dataValues: []
                }));

                scope.$apply();

                expect(scope.dataValues).toEqual({});
            });

            it("should display data for the given period", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    dataValues: [{
                        "dataElement": "DE_Oedema",
                        "categoryOptionCombo": "32",
                        "value": "3",
                        "dataset": "abbc",
                        "orgUnit": "mod1"
                    }, {
                        "dataElement": "DE_Oedema",
                        "categoryOptionCombo": "33",
                        "value": "12",
                        "dataset": "abbc",
                        "orgUnit": "mod1"
                    }]
                }));

                scope.$apply();

                expect(scope.dataValues).toEqual({
                    "mod1": {
                        "DE_Oedema": {
                            "32": {
                                "formula": '3',
                                "value": '3',
                                "existingValue": true
                            },
                            "33": {
                                "formula": '12',
                                "value": '12',
                                "existingValue": true
                            }
                        }
                    }
                });
            });

            it("should display the correct submit option for auto approved projects", function() {
                orgUnitRepository.getParentProject.and.returnValue(utils.getPromise(q, {
                    "id": "proj1",
                    "attributeValues": [{
                        'attribute': {
                            'code': 'autoApprove',
                            'name': 'Auto Approve',
                            'id': 'e65afaec61d'
                        },
                        'value': 'true'
                    }, {
                        'attribute': {
                            'code': 'Type',
                            'name': 'Type',
                        },
                        'value': 'Project'
                    }]
                }));

                scope.$apply();

                expect(scope.projectIsAutoApproved).toBeTruthy();
            });

            it("should populate list of projectPopulation attributes", function() {
                orgUnitRepository.getParentProject.and.returnValue(utils.getPromise(q, {
                    "id": "proj1",
                    "attributeValues": [{
                        'attribute': {
                            'code': 'estimatedTargetPopulation',
                            'name': 'Population',
                            'id': 'p1'
                        },
                        'value': '1000'
                    }, {
                        'attribute': {
                            'code': 'estPopulationLessThan1Year',
                            'name': 'Proportion of children < 1 year old',
                        },
                        'value': '12'
                    }, {
                        'attribute': {
                            'code': 'estPopulationBetween1And5Years',
                            'name': 'Proportion of children < 5 years old',
                        },
                        'value': '20'
                    }, {
                        'attribute': {
                            'code': 'estPopulationOfWomenOfChildBearingAge',
                            'name': 'Proportion of women of child bearing age',
                        },
                        'value': '30'
                    }]
                }));

                scope.$apply();

                expect(scope.projectPopulationDetails).toEqual({
                    "estimatedTargetPopulation": '1000',
                    "estPopulationLessThan1Year": '12',
                    "estPopulationBetween1And5Years": '20',
                    "estPopulationOfWomenOfChildBearingAge": '30'
                });
            });

            it('should prevent navigation if data entry form is dirty', function() {
                scope.dataentryForm.$dirty = false;
                scope.dataentryForm.$dirty = true;
                scope.$apply();

                expect(scope.preventNavigation).toEqual(true);
            });

            it('should not prevent navigation if data entry form is not dirty', function() {
                scope.dataentryForm.$dirty = true;
                scope.dataentryForm.$dirty = false;
                scope.$apply();

                expect(scope.preventNavigation).toEqual(false);
            });

            it("should return true if current week is selected", function() {
                var selectedWeek = {
                    'weekNumber': 2,
                    "weekYear": 2014,
                    'startOfWeek': moment().startOf("isoWeek").format("YYYY-MM-DD"),
                    'endOfWeek': moment().endOf("isoWeek").format("YYYY-MM-DD")
                };

                expect(scope.isCurrentWeekSelected(selectedWeek)).toEqual(true);
                scope.$apply();
            });

            it("should return false if current week is not selected", function() {
                var selectedWeek = {
                    'weekNumber': 21,
                    "weekYear": 2014,
                    'startOfWeek': moment("2001-01-01", "YYYY-MM-DD").startOf("isoWeek").format("YYYY-MM-DD"),
                    'endOfWeek': moment("2001-01-01", "YYYY-MM-DD").endOf("isoWeek").format("YYYY-MM-DD")
                };

                expect(scope.isCurrentWeekSelected(selectedWeek)).toEqual(false);
                scope.$apply();
            });

            it("should expand the first dataset panel", function() {
                var id = "first_panel_id";
                var isDatasetOpen = scope.getDatasetState(id, true);
                expect(isDatasetOpen[id]).toBe(true);
            });

            it("should not expand the first dataset panel after the first time", function() {
                var id = "first_panel_id";
                scope.isDatasetOpen[id] = false;
                var isDatasetOpen = scope.getDatasetState(id, true);
                expect(isDatasetOpen[id]).toBe(false);
            });

            it("should not expand the other panels", function() {
                var id = "some_other_panel_id";
                var isDatasetOpen = scope.getDatasetState(id, false);
                expect(isDatasetOpen[id]).toBe(undefined);
            });

            it("should render all panels completely and print tally sheet in the next tick", function() {
                spyOn(window, "print");

                scope.printWindow();
                timeout.flush();

                expect(scope.printingTallySheet).toBeTruthy();
                expect(window.print).toHaveBeenCalled();
            });

            it("should set submitted flag based on state of module data block", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    submitted: false
                }));

                scope.$apply();

                expect(scope.isSubmitted).toBe(false);
            });

            it("should submit data for auto approval", function() {
                var periodAndOrgUnit = {
                    period: selectedPeriod,
                    orgUnit: scope.selectedModule.id
                };
                scope.$apply();

                scope.submitAndApprove();
                scope.$apply();

                expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith(periodAndOrgUnit, rootScope.currentUser.userCredentials.username, {});
                expect(hustle.publishOnce).toHaveBeenCalledTimes(1);
                expect(hustle.publishOnce).toHaveBeenCalledWith({
                    data: {
                        moduleId: periodAndOrgUnit.orgUnit,
                        period: periodAndOrgUnit.period
                    },
                    type: 'syncModuleDataBlock',
                    locale: 'en',
                    desc: scope.resourceBundle.syncModuleDataBlockDesc + selectedPeriod + ', ' + scope.selectedModule.name
                }, 'dataValues');
            });

            it("should set isCompleted flag based on whether moduleDataBlock is approved at project level", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    approvedAtProjectLevel: true
                }));

                scope.$apply();

                expect(scope.isCompleted).toBeTruthy();
            });

            it("should set isApproved flag based on whether moduleDataBlock is approved at coordination level", function() {
                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, {
                    approvedAtCoordinationLevel: true
                }));

                scope.$apply();

                expect(scope.isApproved).toBeTruthy();
            });
        });
    });
