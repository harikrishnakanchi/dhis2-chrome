define(["orgUnitMapper", "angularMocks", "moment"], function(orgUnitMapper, mocks, moment) {
    describe("orgUnitMapper", function() {

        it("should convert project from DHIS to project for view", function() {
            var dhisProject = {
                "id": "a4acf9115a7",
                "name": 'Org1',
                "level": 3,
                "shortName": 'Org1',
                "openingDate": "2010-01-01",
                "parent": {
                    "name": "name1",
                    "id": "id1"
                },
                "attributeValues": [{
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
                }, {
                    "attribute": {
                        "code": "event",
                        "name": "Event",
                        "id": "a4ecfc70574"
                    },
                    "value": "Armed Conflict: disruption of health systems due to conflict"
                }, {
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code",
                        "id": "fa5e00d5cd2"
                    },
                    "value": "RU118"
                }]
            };

            var result = orgUnitMapper.mapToProjectForView(dhisProject);

            var expectedResult = {
                'name': dhisProject.name,
                'openingDate': moment(dhisProject.openingDate).format("YYYY-MM-DD"),
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'populationType': "val5",
                'endDate': moment("2011-01-01").format("YYYY-MM-DD"),
                'event': 'Armed Conflict: disruption of health systems due to conflict',
                'projectCode': 'RU118'
            };

            expect(result).toEqual(expectedResult);
        });

        it("should transform orgUnit to contain attributes as per DHIS", function() {

            var orgUnit = {
                'name': 'Org1',
                'openingDate': moment("2010-01-01").toDate(),
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': "val6",
                'projectCode': 'AB001',
                'event': 'Other'
            };

            var parentOrgUnit = {
                name: 'Name1',
                id: 'Id1',
                level: "2",
            };


            var result = orgUnitMapper.mapToProjectForDhis(orgUnit, parentOrgUnit);

            var expectedResult = {
                id: '1ef081fea77',
                name: 'Org1',
                level: 3,
                shortName: 'Org1',
                openingDate: '2010-01-01',
                parent: {
                    name: 'Name1',
                    id: 'Id1'
                },
                attributeValues: [{
                    attribute: {
                        id: 'a1fa2777924'
                    },
                    value: 'Project'
                }, {
                    attribute: {
                        code: 'prjCon',
                        name: 'Context',
                        id: 'Gy8V8WeGgYs'
                    },
                    value: 'val2'
                }, {
                    attribute: {
                        code: 'prjLoc',
                        name: 'Location',
                        id: 'CaQPMk01JB8'
                    },
                    value: 'val3'
                }, {
                    attribute: {
                        code: 'prjType',
                        name: 'Type of project',
                        id: 'bnbnSvRdFYo'
                    },
                    value: 'val4'
                }, {
                    attribute: {
                        code: 'prjPopType',
                        name: 'Type of population',
                        id: 'Byx9QE6IvXB'
                    },
                    value: 'val6'
                }, {
                    attribute: {
                        code: 'projCode',
                        name: 'Project Code',
                        id: 'fa5e00d5cd2'
                    },
                    value: 'AB001'
                }, {
                    attribute: {
                        code: 'event',
                        name: 'Event',
                        id: 'a4ecfc70574'
                    },
                    value: 'Other'
                }, {
                    attribute: {
                        code: 'prjEndDate',
                        name: 'End date',
                        id: 'ZbUuOnEmVs5'
                    },
                    value: '2011-01-01'
                }]
            };

            expect(result).toEqual(expectedResult);
        });

        it("should map modules for dhis", function() {
            var projectOrgUnit = {
                'id': 'Project1Id',
                'name': 'Project1',
                'level': '3',
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

            var today = new Date("2010-01-01T00:00:00");
            spyOn(window, 'Date').and.returnValue(today);

            var actualModules = orgUnitMapper.mapToModules(modules, projectOrgUnit);

            expect(actualModules).toEqual([{
                name: 'Module1',
                datasets: [{
                    'id': 'ds_11',
                    'name': 'dataset11',
                }, {
                    'id': 'ds_12',
                    'name': 'dataset12'
                }],
                shortName: 'Module1',
                id: '8110fbcb2a4',
                level: 4,
                openingDate: "2010-01-01",
                selectedDataset: undefined,
                selectedSections: undefined,
                selectedDataElements: undefined,
                attributeValues: [{
                    attribute: {
                        id: 'a1fa2777924'
                    },
                    value: 'Module'
                }],
                parent: {
                    name: 'Project1',
                    id: 'Project1Id'
                }
            }, {
                name: 'Module2',
                datasets: [{
                    'id': 'ds_21',
                    'name': 'dataset21',
                }, {
                    'id': 'ds_22',
                    'name': 'dataset22'
                }],
                shortName: 'Module2',
                id: 'c59e050c2a8',
                level: 4,
                openingDate: "2010-01-01",
                selectedDataset: undefined,
                selectedSections: undefined,
                selectedDataElements: undefined,
                attributeValues: [{
                    attribute: {
                        id: 'a1fa2777924'
                    },
                    value: 'Module'
                }],
                parent: {
                    name: 'Project1',
                    id: 'Project1Id'
                }
            }]);
        });

        it("should return all the projects under a orgUnit", function() {
            var allOrgUnit = [{
                name: "blah1",
                parent: {
                    id: 1
                }
            }, {
                name: "blah2",
                parent: {
                    id: 1
                }
            }];
            var id = 1;
            var expectedProjects = ["blah1", "blah2"];

            var projects = orgUnitMapper.getChildOrgUnitNames(allOrgUnit, id);

            expect(expectedProjects).toEqual(projects);
        });

        it("should map datasets for dhis", function() {
            var originalDataSets = [{
                'id': 'ds_11',
                'name': 'dataset11',
            }, {
                'id': 'ds_12',
                'name': 'dataset12'
            }];

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
                    'id': 'ds_11',
                    'name': 'dataset21',
                }]
            }];

            var datasets = orgUnitMapper.mapToDataSets(modules, projectOrgUnit, originalDataSets);
            var expectedDatasets = [{
                id: 'ds_11',
                name: 'dataset11',
                organisationUnits: [{
                    name: 'Module1',
                    id: '8110fbcb2a4'
                }, {
                    name: 'Module2',
                    id: 'c59e050c2a8'
                }]
            }, {
                id: 'ds_12',
                name: 'dataset12',
                organisationUnits: [{
                    name: 'Module1',
                    id: '8110fbcb2a4'
                }]
            }];

            expect(datasets).toEqual(expectedDatasets);
        });

        it("should filter modules from org units", function() {
            var project = {
                'name': 'Project1',
                'id': 'id1',
                'attributeValues': [{
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Project"
                }]
            };

            var module = {
                'name': 'Module1',
                'attributeValues': [{
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "name": "Project1",
                    "id": "id1"
                },
            };

            var opUnit = {
                'name': 'opunit1',
                'id': 'opunit1',
                'attributeValues': [{
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Operation Unit"
                }],
                "parent": {
                    "name": "Project1",
                    "id": "id1"
                },
            };

            var moduleUnderOpunit = {
                'name': 'Module2',
                'attributeValues': [{
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "name": "opunit1",
                    "id": "opunit1"
                },
            };
            var organisationUnits = [project, module, opUnit, moduleUnderOpunit];
            var expectedModule1 = _.merge(_.cloneDeep(module), {
                'displayName': 'Module1'
            });
            var expectedModule2 = _.merge(_.cloneDeep(moduleUnderOpunit), {
                'displayName': 'opunit1 - Module2'
            });

            var actualModules = orgUnitMapper.filterModules(organisationUnits);

            expect(actualModules).toEqual([expectedModule1, expectedModule2]);
        });
    });
});