define(["programRepository", "angularMocks", "utils"], function(ProgramRepository, mocks, utils) {
    describe("programRepository", function() {
        var scope, q, programRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;

            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            programRepository = new ProgramRepository(mockDB.db, q);
        }));

        it("should get Programs for OrgUnit", function() {
            var programDataForOrgUnit = [{
                'id': 'p1'
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, programDataForOrgUnit));

            var actualValues;
            programRepository.getProgramsForOrgUnit("ou1").then(function(programData) {
                actualValues = programData;
            });

            scope.$apply();

            expect(actualValues).toEqual(programDataForOrgUnit);
        });

        it("should save org hierarchy", function() {
            var program = [{
                "id": "prg1",
                "name": "program1",
                "organisationUnits": [{
                    "id": "orgUnit1",
                    "name": "orgUnit1"
                }]
            }];

            programRepository.upsert(program).then(function(data) {
                expect(data).toEqual(program);
            });
            expect(mockStore.upsert).toHaveBeenCalledWith(program);
        });

        it("should get program", function() {

            var programData = {
                'id': 'p1',
                'name': 'ER - Presenting Line List',
                'displayName': 'ER - Presenting Line List',
                'programStages': [{
                    'id': 'p1s1',
                    'name': 'ER - Presenting Line List Stage 1'
                }, {
                    'id': 'p1s2',
                    'name': 'ER - Presenting Line List Stage 2'
                }]
            };

            var programStage1Data = {
                'id': 'p1s1',
                'name': 'ER - Presenting Line List Stage 1',
                'programStageDataElements': [{
                    'dataElement': {
                        'id': 'd1',
                        'name': 'Arrival Date'
                    }
                }, {
                    'dataElement': {
                        'id': 'd2',
                        'name': 'Mode of Arrival'
                    }
                }],
                'programStageSections': [{
                    'id': 'st1',
                    'name': 'Arrival'
                }, {
                    'id': 'st2',
                    'name': 'Discharge'
                }]
            };

            var programStage2Data = {
                'id': 'p1s2',
                'name': 'ER - Presenting Line List Stage 2',
                'programStageDataElements': [{
                    'dataElement': {
                        'id': 'd2',
                        'name': 'Mode of Arrival'
                    }
                }],
                'programStageSections': [{
                    'id': 'st1',
                    'name': 'Arrival'
                }, {
                    'id': 'st2',
                    'name': 'Discharge'
                }]
            };

            var dataElement1Data = {
                'id': 'd1',
                'name': 'Arrival Date',
                'type': 'date'
            };

            var dataElement2Data = {
                'id': 'd2',
                'name': 'Mode of Arrival',
                'type': 'string'
            };

            mockStore.getAll.and.returnValue(utils.getPromise(q, []));

            mockStore.find.and.callFake(function(id) {
                if (id === "p1")
                    return utils.getPromise(q, programData);
                if (id === "p1s1")
                    return utils.getPromise(q, programStage1Data);
                if (id === "p1s2")
                    return utils.getPromise(q, programStage2Data);
                if (id === "d1")
                    return utils.getPromise(q, dataElement1Data);
                if (id === "d2")
                    return utils.getPromise(q, dataElement2Data);
                return utils.getPromise(q, undefined);
            });

            var actualValues;
            programRepository.getProgramAndStages("p1").then(function(programData) {
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
                    'programStageDataElements': [{
                        'dataElement': {
                            'id': 'd1',
                            'name': 'Arrival Date',
                            'type': 'date'
                        }
                    }, {
                        'dataElement': {
                            'id': 'd2',
                            'name': 'Mode of Arrival',
                            'type': 'string'
                        }
                    }],
                    'programStageSections': [{
                        'id': 'st1',
                        'name': 'Arrival'
                    }, {
                        'id': 'st2',
                        'name': 'Discharge'
                    }]

                }, {
                    'id': 'p1s2',
                    'name': 'ER - Presenting Line List Stage 2',
                    'programStageDataElements': [{
                        'dataElement': {
                            'id': 'd2',
                            'name': 'Mode of Arrival',
                            'type': 'string'
                        }
                    }],
                    'programStageSections': [{
                        'id': 'st1',
                        'name': 'Arrival'
                    }, {
                        'id': 'st2',
                        'name': 'Discharge'
                    }]

                }]
            });
        });
    });
});