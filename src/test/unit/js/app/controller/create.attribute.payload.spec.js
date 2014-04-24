define(["createAttributePayload", "angularMocks"], function(CreateAttributePayload, mocks) {
    describe("createAttributePayload", function() {
        var http, httpBackend, scope, projectService;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
        }));

        it("should transform payload to contain attributes", function() {

            var orgUnit = [{
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
            }];

            var expectedPayload = [{
                "id": orgUnit[0].id,
                "name": orgUnit[0].name,
                "shortName": orgUnit[0].shortName,
                "level": orgUnit[0].level,
                "openingDate": orgUnit[0].openingDate,
                "parent": {
                    "name": orgUnit[0].parent.name,
                    "id": orgUnit[0].parent.id
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "value": orgUnit[0].consultDays
                }, {
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": orgUnit[0].context
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": orgUnit[0].location
                }, {
                    "attribute": {
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": orgUnit[0].projectType
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": orgUnit[0].endDate
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": orgUnit[0].populationType
                }]
            }];

            var result = CreateAttributePayload(orgUnit);

            expect(result).toEqual(expectedPayload);
        });

    });
});