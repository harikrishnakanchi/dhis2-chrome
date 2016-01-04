define(["programRepository", "angularMocks", "utils", "timecop"], function(ProgramRepository, mocks, utils, timecop) {
    describe("programRepository", function() {
        var scope, q, programRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;

            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            programRepository = new ProgramRepository(mockDB.db, q);

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should get Programs for OrgUnit", function() {
            var programDataForOrgUnit = {
                'id': 'p1'
            };
            mockStore.find.and.returnValue(utils.getPromise(q, programDataForOrgUnit));

            var actualValues;
            programRepository.getProgramForOrgUnit("ou1").then(function(programData) {
                actualValues = programData;
            });

            scope.$apply();

            expect(actualValues).toEqual(programDataForOrgUnit);
        });

        it("should find all propgrams", function() {
            var programIds = ["p1", "p2"];
            programRepository.findAll(programIds);
            scope.$apply();

            expect(mockStore.each).toHaveBeenCalled();
            expect(mockStore.each.calls.argsFor(0)[0].inList).toEqual(programIds);
        });

        it("should save programs", function() {
            var programs = [{
                "id": "prg1",
                "name": "program1",
                "organisationUnits": [{
                    "id": "orgUnit1",
                    "name": "orgUnit1"
                }]
            }];

            var expectedUpsertedPrograms = [{
                "id": "prg1",
                "name": "program1",
                "orgUnitIds": ["orgUnit1"],
                "clientLastUpdated": "2014-05-30T12:43:54.972Z",
                "organisationUnits": [{
                    "id": "orgUnit1",
                    "name": "orgUnit1"
                }]
            }];

            var actualUpsertResult;
            programRepository.upsert(programs).then(function(data) {
                actualUpsertResult = data;
            });
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpsertedPrograms);
            expect(actualUpsertResult).toEqual(expectedUpsertedPrograms);
        });

        it("should get program", function() {

            var programData = {
                'id': 'p1',
                'name': 'ER - Presenting Line List',
                'displayName': 'ER - Presenting Line List',
                'programStages': [{
                    'id': 'p1s1',
                    'name': 'ER - Presenting Line List Stage 1',
                    'programStageSections': [{
                        'id': 'st1',
                        'name': 'Arrival',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date'
                            }
                        }, {
                            'dataElement': {
                                'id': 'd2',
                                'name': 'Mode of Arrival'
                            }
                        }]
                    }, {
                        'id': 'st2',
                        'name': 'Discharge',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date'
                            }
                        }, {
                            'dataElement': {
                                'id': 'd3',
                                'name': 'Mode of Discharge'
                            }
                        }]
                    }]

                }, {
                    'id': 'p1s2',
                    'name': 'ER - Presenting Line List Stage 2',
                    'programStageSections': [{
                        'id': 'st3',
                        'name': 'Default Section',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date'
                            }
                        }]
                    }]
                }]
            };

            var dataElement1Data = {
                'id': 'd1',
                'name': 'Date',
                'type': 'date'
            };

            var dataElement2Data = {
                'id': 'd2',
                'name': 'Mode of Arrival',
                'type': 'string'
            };

            var dataElement3Data = {
                'id': 'd3',
                'name': 'Mode of Discharge',
                'type': 'string'
            };

            mockStore.getAll.and.returnValue(utils.getPromise(q, []));

            mockStore.find.and.callFake(function(id) {
                if (id === "p1")
                    return utils.getPromise(q, programData);
                if (id === "d1")
                    return utils.getPromise(q, dataElement1Data);
                if (id === "d2")
                    return utils.getPromise(q, dataElement2Data);
                if (id === "d3")
                    return utils.getPromise(q, dataElement3Data);
                return utils.getPromise(q, undefined);
            });

            var actualValues;
            programRepository.get("p1").then(function(programData) {
                actualValues = programData;
            });

            scope.$apply();

            expect(actualValues).toEqual({
                'id': 'p1',
                'name': 'ER - Presenting Line List',
                'displayName': 'ER - Presenting Line List',
                'programStages': [{
                    'id': 'p1s1',
                    'name': 'ER - Presenting Line List Stage 1',
                    'programStageSections': [{
                        'id': 'st1',
                        'name': 'Arrival',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date',
                                'type': 'date',
                                'isIncluded': true
                            }
                        }, {
                            'dataElement': {
                                'id': 'd2',
                                'name': 'Mode of Arrival',
                                'type': 'string',
                                'isIncluded': true


                            }
                        }]
                    }, {
                        'id': 'st2',
                        'name': 'Discharge',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date',
                                'type': 'date',
                                'isIncluded': true

                            }
                        }, {
                            'dataElement': {
                                'id': 'd3',
                                'name': 'Mode of Discharge',
                                'type': 'string',
                                'isIncluded': true
                            }
                        }]
                    }]

                }, {
                    'id': 'p1s2',
                    'name': 'ER - Presenting Line List Stage 2',
                    'programStageSections': [{
                        'id': 'st3',
                        'name': 'Default Section',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date',
                                'type': 'date',
                                'isIncluded': true
                            }
                        }]
                    }]

                }]
            });
        });

        it("should get program with excluded data elements", function() {

            var excludedDataElementIds = ['d2'];

            var programData = {
                'id': 'p1',
                'name': 'ER - Presenting Line List',
                'displayName': 'ER - Presenting Line List',
                'programStages': [{
                    'id': 'p1s1',
                    'name': 'ER - Presenting Line List Stage 1',
                    'programStageSections': [{
                        'id': 'st1',
                        'name': 'Arrival',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date'
                            }
                        }, {
                            'dataElement': {
                                'id': 'd2',
                                'name': 'Mode of Arrival'
                            }
                        }]
                    }, {
                        'id': 'st2',
                        'name': 'Discharge',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date'
                            }
                        }, {
                            'dataElement': {
                                'id': 'd3',
                                'name': 'Mode of Discharge'
                            }
                        }]
                    }]
                }]
            };

            var dataElement1Data = {
                'id': 'd1',
                'name': 'Date',
                'type': 'date'
            };

            var dataElement2Data = {
                'id': 'd2',
                'name': 'Mode of Arrival',
                'type': 'string'
            };

            var dataElement3Data = {
                'id': 'd3',
                'name': 'Mode of Discharge',
                'type': 'string'
            };

            mockStore.getAll.and.returnValue(utils.getPromise(q, []));

            mockStore.find.and.callFake(function(id) {
                if (id === "p1")
                    return utils.getPromise(q, programData);
                if (id === "d1")
                    return utils.getPromise(q, dataElement1Data);
                if (id === "d2")
                    return utils.getPromise(q, dataElement2Data);
                if (id === "d3")
                    return utils.getPromise(q, dataElement3Data);
                return utils.getPromise(q, undefined);
            });

            var actualValues;
            programRepository.get("p1", excludedDataElementIds).then(function(programData) {
                actualValues = programData;
            });

            scope.$apply();

            expect(actualValues).toEqual({
                'id': 'p1',
                'name': 'ER - Presenting Line List',
                'displayName': 'ER - Presenting Line List',
                'programStages': [{
                    'id': 'p1s1',
                    'name': 'ER - Presenting Line List Stage 1',
                    'programStageSections': [{
                        'id': 'st1',
                        'name': 'Arrival',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date',
                                'type': 'date',
                                'isIncluded': true
                            }
                        }, {
                            'dataElement': {
                                'id': 'd2',
                                'name': 'Mode of Arrival',
                                'type': 'string',
                                'isIncluded': false
                            }
                        }]
                    }, {
                        'id': 'st2',
                        'name': 'Discharge',
                        'programStageDataElements': [{
                            'dataElement': {
                                'id': 'd1',
                                'name': 'Date',
                                'type': 'date',
                                'isIncluded': true
                            }
                        }, {
                            'dataElement': {
                                'id': 'd3',
                                'name': 'Mode of Discharge',
                                'type': 'string',
                                'isIncluded': true
                            }
                        }]
                    }]

                }]
            });
        });

        it("should get all new data model programs", function() {
            var allPrograms = [{
                "id": "p1",
                "name": "Program1",
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "code": "isNewDataModel"
                    }
                }]
            }, {
                "id": "p2",
                "name": "Program2",
                "attributeValues": [{
                    "value": "false",
                    "attribute": {
                        "code": "isNewDataModel"
                    }
                }]
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, allPrograms));

            var expectedPrograms = [allPrograms[0]];
            var actualPrograms;

            programRepository.getAll().then(function(data) {
                actualPrograms = data;
            });

            scope.$apply();
            expect(actualPrograms).toEqual(expectedPrograms);
        });

        it("should associate org units to programs", function() {
            var program = {
                "id": "Prg",
                "name": "Program"
            };

            var orgUnits = [{
                "id": "ou1",
                "name": "ou1"
            }];

            var expectedProgramsUpsert = [{
                "id": "Prg",
                "name": "Program",
                "organisationUnits": orgUnits,
                "clientLastUpdated": "2014-05-30T12:43:54.972Z",
                "orgUnitIds": ["ou1"]
            }];

            programRepository.associateOrgUnits(program, orgUnits);

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedProgramsUpsert);

        });
    });
});