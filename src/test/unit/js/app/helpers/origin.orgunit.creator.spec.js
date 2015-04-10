define(["originOrgunitCreator", "angularMocks", "utils", "orgUnitRepository", "patientOriginRepository", "dhisId", "orgUnitGroupHelper", "datasetRepository"],
    function(OriginOrgunitCreator, mocks, utils, OrgUnitRepository, PatientOriginRepository, dhisId, OrgUnitGroupHelper, DatasetRepository) {
        describe("origin orgunit creator", function() {

            var scope, q, originOrgunitCreator, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper, datasetRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;

                orgUnitRepository = new OrgUnitRepository();
                patientOriginRepository = new PatientOriginRepository();
                orgUnitGroupHelper = new OrgUnitGroupHelper();
                datasetRepository = new DatasetRepository();

                spyOn(orgUnitRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                spyOn(datasetRepository, "getOriginDatasets").and.returnValue(utils.getPromise(q, {}));
                spyOn(datasetRepository, "associateOrgUnits").and.returnValue(utils.getPromise(q, {}));

                spyOn(patientOriginRepository, "get");

                spyOn(orgUnitGroupHelper, "createOrgUnitGroups");

                originOrgunitCreator = new OriginOrgunitCreator(q, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper, datasetRepository);
            }));

            it("should create orgin orgunits for the given patient origin", function() {
                var module = {
                    "id": "mod1",
                    "name": "mod1",
                    "parent": {
                        "id": "opunit1"
                    }
                };
                var patientOrigin = {
                    "id": "o1",
                    "name": "o1"
                };

                var originOrgUnits = [{
                    "name": 'o1',
                    "shortName": 'o1',
                    "displayName": 'o1',
                    "id": 'o1mod1',
                    "level": 7,
                    "openingDate": undefined,
                    "attributeValues": [{
                        "attribute": {
                            "code": 'Type',
                            "name": 'Type'
                        },
                        "value": 'Patient Origin'
                    }, {
                        "attribute": {
                            "code": 'isNewDataModel',
                            "name": 'Is New Data Model'
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "id": 'mod1'
                    }
                }];

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                originOrgunitCreator.create(module, patientOrigin);
                scope.$apply();

                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(originOrgUnits);
            });


            it("should get patient origin info from repository and create origin org units if no patient origin is passed", function() {
                var module = {
                    "id": "mod1",
                    "name": "mod1",
                    "parent": {
                        "id": "opunit1"
                    }
                };

                var patientOrigins = {
                    "origins": [{
                        "id": "o1",
                        "name": "o1"
                    }]
                };

                var originOrgUnits = [{
                    "name": 'o1',
                    "shortName": 'o1',
                    "displayName": 'o1',
                    "id": 'o1mod1',
                    "level": 7,
                    "openingDate": undefined,
                    "attributeValues": [{
                        "attribute": {
                            "code": 'Type',
                            "name": 'Type'
                        },
                        "value": 'Patient Origin'
                    }, {
                        "attribute": {
                            "code": 'isNewDataModel',
                            "name": 'Is New Data Model'
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "id": 'mod1'
                    }
                }];

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });
                patientOriginRepository.get.and.returnValue(utils.getPromise(q, patientOrigins));

                originOrgunitCreator.create(module);
                scope.$apply();

                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(originOrgUnits);
            });

            it("should add origins to origin dataset", function() {
                var module = {
                    "id": "mod1",
                    "name": "mod1",
                    "parent": {
                        "id": "opunit1"
                    }
                };
                var patientOrigin = {
                    "id": "o1",
                    "name": "o1"
                };

                var originOrgUnits = [{
                    "name": 'o1',
                    "shortName": 'o1',
                    "displayName": 'o1',
                    "id": 'o1mod1',
                    "level": 7,
                    "openingDate": undefined,
                    "attributeValues": [{
                        "attribute": {
                            "code": 'Type',
                            "name": 'Type'
                        },
                        "value": 'Patient Origin'
                    }, {
                        "attribute": {
                            "code": 'isNewDataModel',
                            "name": 'Is New Data Model'
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "id": 'mod1'
                    }
                }];

                var originDataset = [{
                    "id": "ods1",
                    "name": "origin"
                }];

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                datasetRepository.getOriginDatasets.and.returnValue(utils.getPromise(q, originDataset));

                originOrgunitCreator.create(module, patientOrigin);
                scope.$apply();
                expect(datasetRepository.associateOrgUnits.calls.argsFor(0)[0]).toEqual(originDataset);
                expect(datasetRepository.associateOrgUnits.calls.argsFor(0)[1]).toEqual(originOrgUnits);
            });
        });
    });
