define(["orgUnitMapper", "angularMocks", "moment"], function(orgUnitMapper, mocks, moment) {
    describe("orgUnitMapper", function() {

        it("should convert project from DHIS to project for view", function() {
            var dhisProject = {
                "id": "a4acf9115a7",
                "name": 'Org1',
                "shortName": 'Org1',
                "level": 4,
                "openingDate": "2010-01-01",
                "parent": {
                    "name": "name1",
                    "id": "id1"
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
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": "val5"
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": "2011-01-01"
                }]
            };

            var result = orgUnitMapper.mapToProjectForView(dhisProject);

            var expectedResult = {
                'name': dhisProject.name,
                'openingDate': moment(dhisProject.openingDate).toDate(),
                'consultDays': "val1",
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'populationType': "val5",
                'endDate': moment("2011-01-01").toDate(),
            };

            expect(result).toEqual(expectedResult);
        });

        it("should transform orgUnit to contain attributes as per DHIS", function() {

            var orgUnit = {
                'name': 'Org1',
                'openingDate': moment("2010-01-01").toDate(),
                'consultDays': "val1",
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': "val6",
            };

            var parentOrgUnit = {
                name: 'Name1',
                id: 'Id1',
                level: 'level'
            };


            var result = orgUnitMapper.mapToProjectForDhis(orgUnit, parentOrgUnit);

            var expectedResult = {
                "id": "a4acf9115a7",
                "name": orgUnit.name,
                "shortName": orgUnit.name,
                "level": 4,
                "openingDate": moment(orgUnit.openingDate).format("YYYY-MM-DD"),
                "parent": {
                    "name": parentOrgUnit.name,
                    "id": parentOrgUnit.id
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
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": orgUnit.populationType
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": moment(orgUnit.endDate).format("YYYY-MM-DD")
                }]
            };

            expect(result).toEqual(expectedResult);
        });

        it("should map modules for dhis", function() {
            var projectOrgUnit = {
                'id': 'Project1Id',
                'name': 'Project1'
            };

            var modules = [{
                'name': "Module1",
                'datasets': [{
                    'id': 'ds_11',
                    'name': 'dataset11',
                }, {
                    'id': 'ds_12',
                    'name': 'dataset12'
                }]
            }, {
                'name': "Module2",
                'datasets': [{
                    'id': 'ds_21',
                    'name': 'dataset21',
                }, {
                    'id': 'ds_22',
                    'name': 'dataset22'
                }]
            }];

            var modules = orgUnitMapper.mapToModules(modules, projectOrgUnit);

            expect(modules).toEqual([{
                name: 'Module1',
                shortName: 'Module1',
                level: 6,
                id: '86eb3db78c7',
                openingDate: '2014-04-28',
                parent: {
                    name: 'Project1',
                    id: 'Project1Id'
                }
            }, {
                name: 'Module2',
                shortName: 'Module2',
                level: 6,
                id: 'f1941e66f2d',
                openingDate: '2014-04-28',
                parent: {
                    name: 'Project1',
                    id: 'Project1Id'
                }
            }]);
        });

        it("should map datasets for dhis", function() {
            var projectOrgUnit = {
                'id': 'Project1Id',
                'name': 'Project1'
            };

            var modules = [{
                'name': "Module1",
                'datasets': [{
                    'id': 'ds_11',
                    'name': 'dataset11',
                }, {
                    'id': 'ds_12',
                    'name': 'dataset12'
                }]
            }, {
                'name': "Module2",
                'datasets': [{
                    'id': 'ds_21',
                    'name': 'dataset21',
                }, {
                    'id': 'ds_22',
                    'name': 'dataset22'
                }]
            }];

            var datasets = orgUnitMapper.mapToDataSets(modules, projectOrgUnit);

            expect(datasets).toEqual([{
                id: 'ds_11',
                organisationUnits: [{
                    name: 'Module1',
                    id: '86eb3db78c7'
                }]
            }, {
                id: 'ds_12',
                organisationUnits: [{
                    name: 'Module1',
                    id: '86eb3db78c7'
                }]
            }, {
                id: 'ds_21',
                organisationUnits: [{
                    name: 'Module2',
                    id: 'f1941e66f2d'
                }]
            }, {
                id: 'ds_22',
                organisationUnits: [{
                    name: 'Module2',
                    id: 'f1941e66f2d'
                }]
            }]);
        });
    });
});