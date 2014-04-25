define(["orgUnitMapper", "angularMocks"], function(orgUnitMapper, mocks) {
    describe("orgUnitMapper", function() {

        it("should transform payload to contain attributes", function() {

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

            var result = orgUnitMapper.toDhisProject(orgUnit);

            var expectedResult = {
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
            };

            expect(result).toEqual(expectedResult);
        });

    });
});