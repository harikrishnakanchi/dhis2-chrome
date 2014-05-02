define(["orgUnitService", "angularMocks", "properties", "utils"], function(OrgUnitService, mocks, properties, utils) {
    describe("projects controller", function() {
        var http, httpBackend, projectService, db, mockOrgStore, q;

        beforeEach(mocks.inject(function($httpBackend, $http, $q) {
            http = $http;
            httpBackend = $httpBackend;
            q = $q;

            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };
            db = {
                objectStore: function() {}
            };

            spyOn(db, "objectStore").and.returnValue(mockOrgStore);
            spyOn(mockOrgStore, "upsert").and.returnValue(utils.getPromise(q, "someId"));

            orgUnitService = new OrgUnitService(http, db);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save organization unit in dhis", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }];

            var expectedPayload = {
                organisationUnits: [{
                    id: 'org_0',
                    level: 1
                }]
            };

            orgUnitService.create(orgUnit).then(function(data) {
                expect(data).toEqual("someId");
            });

            expect(db.objectStore).toHaveBeenCalledWith("organisationUnits");
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });


        it("should send attributes along with metadata for project org units", function() {

            var payload = [{
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "parent": {
                    name: 'Name1',
                    id: 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "value": "val1"
                }, {
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": "val2"
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": "val3"
                }, {
                    "attribute": {
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": "val4"
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": "val5"
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": "val6"
                }]
            }];


            var expectedPayload = {
                "organisationUnits": payload
            };

            orgUnitService.create(payload);

            expect(db.objectStore).toHaveBeenCalledWith("organisationUnits");
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(payload);
            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

        it("should associate organization units to datasets in dhis", function() {
            var datasets = [{
                "id": "DS_Physio",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "hvybNW8qEov"
                }]
            }];

            var expectedPayload = {
                dataSets: datasets
            };

            orgUnitService.associateDataSetsToOrgUnit(datasets).then(function(data) {
                expect(data).toEqual("someId");
            });

            expect(db.objectStore).toHaveBeenCalledWith("dataSets");
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(datasets);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get datasets associated with org units", function() {
            var dataset1 = {
                "id": "DS1",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "Mod1Id"
                }, {
                    "name": "Mod2",
                    "id": "Mod2Id"
                }]
            };
            var dataset2 = {
                "id": "DS2",
                "organisationUnits": [{
                    "name": "Mod3",
                    "id": "Mod3Id"
                }, {
                    "name": "Mod2",
                    "id": "Mod2Id"
                }]
            };
            var dataset3 = {
                "id": "DS3",
                "organisationUnits": [{
                    "name": "Mod3",
                    "id": "Mod3Id"
                }, {
                    "name": "Mod1",
                    "id": "Mod1Id"
                }]
            };
            var orgUnit = {
                "name": "Mod2",
                "id": "Mod2Id"
            };
            var datasets = [dataset1, dataset2, dataset3];
            spyOn(mockOrgStore, "getAll").and.returnValue(utils.getPromise(q, datasets));

            orgUnitService.getDatasetsAssociatedWithOrgUnit(orgUnit).then(function(associatedDataSets) {
                expect(associatedDataSets).toEqual([dataset1, dataset2]);
            });

        });

        it("should save system settings to dhis", function() {
            var data = {
                "moduleId1": ["test1", "test2"],
                "moduleId2": ["test1", "test2"]
            };

            var projectId = "test";

            orgUnitService.setSystemSettings(projectId, data);

            httpBackend.expectPOST(properties.dhis.url + "/api/systemSettings/" + projectId, data).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org units", function() {
            var someOrgUnits = [{
                "a": "b"
            }, {
                "c": "d"
            }];
            spyOn(mockOrgStore, "getAll").and.returnValue(utils.getPromise(q, someOrgUnits));
            orgUnitService.getAll("someOrgUnit").then(function(results) {
                expect(results).toEqual(someOrgUnits);
            });
        });

    });
});