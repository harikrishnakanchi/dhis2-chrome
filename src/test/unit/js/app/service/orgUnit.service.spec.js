define(["orgUnitService", "angularMocks", "properties", "utils"], function(OrgUnitService, mocks, properties, utils) {
    describe("org unit service", function() {
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

        it("should save organization units in dhis and generate resource tables", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }, {
                "id": "org_1",
                "level": 1
            }];

            var expectedPayload = {
                organisationUnits: [{
                    id: 'org_0',
                    level: 1
                }, {
                    "id": "org_1",
                    "level": 1
                }]
            };

            orgUnitService.upsert(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.expectPOST(properties.dhis.url + "/api/resourceTables").respond(200, "ok");
            httpBackend.flush();
        });

        it("should save organization unit in dhis and generate resource tables", function() {
            var orgUnit = {
                "id": "org_0",
                "level": 1
            };

            var expectedPayload = {
                organisationUnits: [{
                    id: 'org_0',
                    level: 1
                }]
            };

            orgUnitService.upsert(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.expectPOST(properties.dhis.url + "/api/resourceTables").respond(200, "ok");
            httpBackend.flush();
        });

        it("should send attributes along with metadata for project org units and generate reource tables", function() {

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

            orgUnitService.upsert(payload);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.expectPOST(properties.dhis.url + "/api/resourceTables").respond(200, "ok");
            httpBackend.flush();
        });

        it("should get org unit with a particular id", function() {
            var orgUnitId = "org1234";

            orgUnitService.get(orgUnitId);

            httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?filter=id:eq:org1234&paging=false&fields=:all,!dataSets,!access,!href,!uuid').respond(200, "ok");
            httpBackend.flush();
        });

        it("should get multiple org units with given ids", function() {
            var orgUnitId = ["id1", "id2", "id3"];

            orgUnitService.get(orgUnitId);

            httpBackend.expectGET(properties.dhis.url +
                '/api/organisationUnits.json?filter=id:eq:id1&filter=id:eq:id2&filter=id:eq:id3&paging=false&fields=:all,!dataSets,!access,!href,!uuid').respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org units since lastUpdated", function() {
            var lastUpdatedTime = "2014-12-30T09:13:41.092Z";

            orgUnitService.getAll(lastUpdatedTime);

            httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?paging=false&fields=:all,!dataSets,!access,!href,!uuid&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z').respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org units", function() {
            orgUnitService.getAll();

            httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?paging=false&fields=:all,!dataSets,!access,!href,!uuid').respond(200, "ok");
            httpBackend.flush();
        });
    });
});
