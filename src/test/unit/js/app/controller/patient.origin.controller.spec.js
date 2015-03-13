define(["patientOriginController", "angularMocks", "utils", "dhisId", "timecop", "orgUnitRepository", "patientOriginRepository", "datasetRepository"], function(PatientOriginController, mocks, utils, dhisId, timecop, OrgUnitRepository, PatientOriginRepository, DatasetRepository) {
    describe("patientOriginController", function() {
        var scope, patientOriginController, q, patientOriginRepository, hustle, origins, orgUnitRepository;

        beforeEach(module("hustle"));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });
            scope.orgUnit = {
                "name": "Project1",
                "id": "prj1"
            };

            var modules = [{
                "id": "mod1",
                "name": "mod1",
                "openingDate": "2014-12-12"
            }];

            patientOriginRepository = new PatientOriginRepository();
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(patientOriginRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, modules));

            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(datasetRepository, "getOriginDatasets").and.returnValue(utils.getPromise(q, {}));

            origins = [{
                "id": "origin1",
                "name": "Origin1",
                "longitude": 100,
                "latitude": 80,
                "clientLastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            Timecop.install();
            Timecop.freeze(new Date("2014-04-01T00:00:00.000Z"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should set patientOriginDetails on scope on initialization", function() {
            scope.orgUnit = {
                "id": "prj1"
            };
            patientOriginRepository.get.and.returnValue(utils.getPromise(q, {
                "orgUnit": "prj1",
                "origins": origins
            }));
            patientOriginController = new PatientOriginController(scope, hustle, q, patientOriginRepository, orgUnitRepository, datasetRepository);
            scope.$apply();

            expect(patientOriginRepository.get).toHaveBeenCalledWith("prj1");
        });

        it("should add patient origin if no origins are present", function() {
            patientOriginRepository.get.and.returnValue(utils.getPromise(q, {}));
            patientOriginController = new PatientOriginController(scope, hustle, q, patientOriginRepository, orgUnitRepository, datasetRepository);
            scope.patientOrigin = {
                "name": "Origin1",
                "longitude": 100,
                "latitude": 80
            };
            scope.$apply();

            scope.save();
            scope.$apply();

            var expectedPayload = {
                orgUnit: "prj1",
                origins: [{
                    "id": "Origin1",
                    "name": "Origin1",
                    "longitude": 100,
                    "latitude": 80,
                    clientLastUpdated: "2014-04-01T00:00:00.000Z",
                }]
            };
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedPayload,
                type: "uploadPatientOriginDetails"
            }, "dataValues");
            expect(scope.saveFailure).toEqual(false);
        });

        it("should add new patient origins to existing patient origins", function() {
            patientOriginRepository.get.and.returnValue(utils.getPromise(q, {
                "orgUnit": "prj1",
                "origins": origins
            }));
            patientOriginController = new PatientOriginController(scope, hustle, q, patientOriginRepository, orgUnitRepository, datasetRepository);
            scope.patientOrigin = {
                "name": "Origin2",
                "longitude": 100,
                "latitude": 80
            };
            scope.$apply();

            scope.save();
            scope.$apply();

            var expectedPayload = {
                orgUnit: "prj1",
                origins: [{
                    "id": "origin1",
                    "name": "Origin1",
                    "longitude": 100,
                    "latitude": 80,
                    "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                }, {
                    "id": "Origin2",
                    "name": "Origin2",
                    "longitude": 100,
                    "latitude": 80,
                    "clientLastUpdated": "2014-04-01T00:00:00.000Z",
                }]
            };
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedPayload,
                type: "uploadPatientOriginDetails"
            }, "dataValues");
        });

        it("should create new orgunits under child modules on adding new patient origins", function() {
            var modules = [{
                "id": "p1",
                "name": "p1",
                "openingDate": "2014-02-02"
            }];

            patientOriginRepository.get.and.returnValue(utils.getPromise(q, {}));
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));

            patientOriginController = new PatientOriginController(scope, hustle, q, patientOriginRepository, orgUnitRepository, datasetRepository);

            scope.patientOrigin = {
                "name": "Origin1",
                "longitude": 100,
                "latitude": 80
            };

            scope.orgUnit = {
                "id": "prj1"
            };

            scope.$apply();

            scope.save();
            scope.$apply();

            var expectedUpserts = [{
                "name": scope.patientOrigin.name,
                "shortName": scope.patientOrigin.name,
                "displayName": scope.patientOrigin.name,
                "id": dhisId.get(scope.patientOrigin.name + "p1"),
                "level": 7,
                "openingDate": "2014-02-02",
                "coordinates": "[" + scope.patientOrigin.longitude + "," + scope.patientOrigin.latitude + "]",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Patient Origin"
                }],
                "parent": {
                    "id": "p1"
                }
            }];

            expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith("prj1");
            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should associate origin orgunits with origin datsets", function() {
            var modules = [{
                "id": "p1",
                "name": "p1",
                "openingDate": "2014-02-02"
            }];

            var originDatasets = [{
                "id": "origin",
                "name": "origin",
                "organisationUnits": []
            }];

            var expectedUpserts = [{
                "id": "origin",
                "name": "origin",
                "organisationUnits": [{
                    "id": "Origin1p1",
                    "name": "Origin1"
                }]
            }];

            patientOriginRepository.get.and.returnValue(utils.getPromise(q, {}));
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
            datasetRepository.getOriginDatasets.and.returnValue(utils.getPromise(q, originDatasets));

            patientOriginController = new PatientOriginController(scope, hustle, q, patientOriginRepository, orgUnitRepository, datasetRepository);

            scope.patientOrigin = {
                "name": "Origin1",
                "longitude": 100,
                "latitude": 80
            };

            scope.orgUnit = {
                "id": "prj1"
            };

            scope.$apply();

            scope.save();
            scope.$apply();

            expect(datasetRepository.getOriginDatasets).toHaveBeenCalled();
            expect(datasetRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
        });
    });
});
