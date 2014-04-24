define(["orgUnitService", "angularMocks", "properties"], function(OrgUnitService, mocks, properties) {
    describe("projects controller", function() {
        var http, httpBackend, scope, projectService;

        beforeEach(mocks.inject(function($rootScope, $httpBackend, $http) {
            scope = $rootScope.$new();
            http = $http;
            httpBackend = $httpBackend;
            projectService = new OrgUnitService(http);
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
            projectService.create(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", {
                "organisationUnits": orgUnit
            }).respond(200, "ok");
            httpBackend.flush();
        });


        it("should send attributes along with metadata for project org units", function() {

            var orgUnit = {
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                'consultDays': "val1",
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'endDate': "val5",
                'populationType': "val6",
                "parent": {
                    name: 'Name1',
                    id: 'Id1'
                },
            };

            var expectedPayload = {
                "organisationUnits": [{
                    "id": orgUnit.id,
                    "name": orgUnit.name,
                    "shortName": orgUnit.shortName,
                    "level": orgUnit.level,
                    "openingDate": orgUnit.openingDate,
                    "parent": {
                        "name": orgUnit.parent.name,
                        "id": orgUnit.parent.id
                    },
                    "attributeValues": [{
                        "attribute": {
                            "code": "prjConDays",
                            "name": "No of Consultation days per week",
                            "id": "VKc7bvogtcP"
                        },
                        "value": orgUnit.consultDays
                    }, {
                        "attribute": {
                            "code": "prjCon",
                            "name": "Context",
                            "id": "Gy8V8WeGgYs"
                        },
                        "value": orgUnit.context
                    }, {
                        "attribute": {
                            "code": "prjLoc",
                            "name": "Location",
                            "id": "CaQPMk01JB8"
                        },
                        "value": orgUnit.location
                    }, {
                        "attribute": {
                            "code": "prjType",
                            "name": "Type of project",
                            "id": "bnbnSvRdFYo"
                        },
                        "value": orgUnit.projectType
                    }, {
                        "attribute": {
                            "code": "prjEndDate",
                            "name": "End date",
                            "id": "ZbUuOnEmVs5"
                        },
                        "value": orgUnit.endDate
                    }, {
                        "attribute": {
                            "code": "prjPopType",
                            "name": "Type of population",
                            "id": "Byx9QE6IvXB"
                        },
                        "value": orgUnit.populationType
                    }]
                }]
            };

            projectService.create(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

    });
});