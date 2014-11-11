define(["orgUnitMapper", "angularMocks", "moment"], function(orgUnitMapper, mocks, moment) {
    describe("orgUnitMapper", function() {

        it("should convert project from DHIS to project for view", function() {
            var dhisProject = {
                "id": "aa4acf9115a",
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
                        "name": "Context"
                    },
                    "value": "val2"
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location"
                    },
                    "value": "val3"
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population"
                    },
                    "value": "val5"
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date"
                    },
                    "value": "2011-01-01"
                }, {
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code"
                    },
                    "value": "RU118"
                }, {
                    attribute: {
                        code: 'reasonForIntervention',
                        name: 'Reason For Intervention'
                    },
                    value: 'Armed Conflict'
                }, {
                    attribute: {
                        code: 'modeOfOperation',
                        name: 'Mode Of Operation'
                    },
                    value: 'Direct Operation'
                }, {
                    attribute: {
                        code: 'modelOfManagement',
                        name: 'Model Of Management'
                    },
                    value: 'Collaboration'
                }, {
                    'attribute': {
                        'code': 'autoApprove',
                        'name': 'Auto Approve'
                    },
                    'value': 'true'
                }]
            };

            var result = orgUnitMapper.mapToProject(dhisProject);

            var expectedResult = {
                'name': dhisProject.name,
                'openingDate': moment(dhisProject.openingDate).toDate(),
                'context': "val2",
                'location': "val3",
                'populationType': "val5",
                'endDate': moment("2011-01-01").toDate(),
                'projectCode': 'RU118',
                'reasonForIntervention': 'Armed Conflict',
                'modeOfOperation': 'Direct Operation',
                'modelOfManagement': 'Collaboration',
                'autoApprove': 'true'
            };

            expect(result).toEqual(expectedResult);
        });

        it("should set autoApprove to false if the attribute does not exist in dhis", function() {
            var dhisProject = {
                "id": "aa4acf9115a",
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
                        "code": "projCode",
                        "name": "Project Code"
                    },
                    "value": "RU118"
                }]
            };

            var result = orgUnitMapper.mapToProject(dhisProject);

            var expectedResult = {
                'name': dhisProject.name,
                'openingDate': moment(dhisProject.openingDate).toDate(),
                'context': undefined,
                'location': undefined,
                'populationType': undefined,
                'endDate': undefined,
                'projectCode': 'RU118',
                'reasonForIntervention': undefined,
                'modeOfOperation': undefined,
                'modelOfManagement': undefined,
                'autoApprove': 'false'
            };

            expect(result).toEqual(expectedResult);
        });

        it("should transform orgUnit to contain attributes as per DHIS", function() {

            var orgUnit = {
                'name': 'Org1',
                'openingDate': moment("2010-01-01").toDate(),
                'context': "val2",
                'location': "val3",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': "val6",
                'projectCode': 'AB001',
                'reasonForIntervention': 'Armed Conflict',
                'modeOfOperation': 'Direct Operation',
                'modelOfManagement': 'Collaboration',
                'autoApprove': 'true'
            };

            var parentOrgUnit = {
                name: 'Name1',
                id: 'Id1',
                level: "2",
            };


            var result = orgUnitMapper.mapToProjectForDhis(orgUnit, parentOrgUnit);

            var expectedResult = {
                id: 'a131658d54b',
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
                        code: 'Type',
                        name: 'Type'
                    },
                    value: 'Project'
                }, {
                    attribute: {
                        code: 'prjCon',
                        name: 'Context'
                    },
                    value: 'val2'
                }, {
                    attribute: {
                        code: 'prjLoc',
                        name: 'Location'
                    },
                    value: 'val3'
                }, {
                    attribute: {
                        code: 'prjPopType',
                        name: 'Type of population'
                    },
                    value: 'val6'
                }, {
                    attribute: {
                        code: 'projCode',
                        name: 'Project Code'
                    },
                    value: 'AB001'
                }, {
                    attribute: {
                        code: 'reasonForIntervention',
                        name: 'Reason For Intervention'
                    },
                    value: 'Armed Conflict'
                }, {
                    attribute: {
                        code: 'modeOfOperation',
                        name: 'Mode Of Operation'
                    },
                    value: 'Direct Operation'
                }, {
                    attribute: {
                        code: 'modelOfManagement',
                        name: 'Model Of Management'
                    },
                    value: 'Collaboration'
                }, {
                    'attribute': {
                        'code': 'autoApprove',
                        'name': 'Auto Approve'
                    },
                    'value': 'true'
                }, {
                    attribute: {
                        code: 'prjEndDate',
                        name: 'End date'
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
                'service': "Aggregate",
                'datasets': [{
                    'id': 'ds_11',
                    'name': 'dataset11',
                }, {
                    'id': 'ds_12',
                    'name': 'dataset12'
                }]
            }, {
                'name': "Module2",
                'service': "Aggregate",
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
                id: 'aac1bbd0985',
                level: 4,
                openingDate: "2010-01-01",
                selectedDataset: undefined,
                attributeValues: [{
                    attribute: {
                        code: "Type",
                        name: "Type"
                    },
                    value: 'Module'
                }, {
                    attribute: {
                        code: "isLineListService",
                        name: "Is Linelist Service"
                    },
                    value: false
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
                id: 'acccf1dda36',
                level: 4,
                openingDate: "2010-01-01",
                selectedDataset: undefined,
                attributeValues: [{
                    attribute: {
                        code: "Type",
                        name: "Type"
                    },
                    value: 'Module'
                }, {
                    attribute: {
                        code: "isLineListService",
                        name: "Is Linelist Service"
                    },
                    value: false
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
                    id: 'aac1bbd0985'
                }, {
                    name: 'Module2',
                    id: 'acccf1dda36'
                }]
            }, {
                id: 'ds_12',
                name: 'dataset12',
                organisationUnits: [{
                    name: 'Module1',
                    id: 'aac1bbd0985'
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

        it("should disable orgUnit", function() {
            var module = {
                'name': 'Module1',
                'attributeValues': [{
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": false
                }],
            };

            var expectedModule = {
                'name': 'Module1',
                'attributeValues': [{
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": true
                }],
            };

            var payload = orgUnitMapper.disable(module);
            expect(payload).toEqual(expectedModule);
        });

        it("should disable multiple orgUnits", function() {
            var modules = [{
                'name': 'Module1',
                'attributeValues': [],
            }, {
                'name': 'Module2',
                'attributeValues': [],
            }];

            var expectedModules = [{
                'name': 'Module1',
                'attributeValues': [{
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": true
                }],
            }, {
                'name': 'Module2',
                'attributeValues': [{
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": true
                }],
            }];

            var payload = orgUnitMapper.disable(modules);
            expect(payload).toEqual(expectedModules);
        });

        it("should map to existing project", function() {
            var project = {
                'name': 'Project1',
                'id': 'id1',
                'children': [{
                    'id': "123"
                }]
            };

            var newProject = {
                'name': 'Org1',
                'openingDate': moment("2010-01-01").toDate(),
                'context': "val2",
                'location': "val3",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': "val6",
                'projectCode': 'AB001',
                'reasonForIntervention': 'Armed Conflict',
                'modeOfOperation': 'Direct Operation',
                'modelOfManagement': 'Collaboration',
                'autoApprove': 'true'
            };

            var projectToBeSaved = orgUnitMapper.mapToExistingProject(newProject, project);

            expect(projectToBeSaved).toEqual({
                name: 'Project1',
                id: 'id1',
                children: [{
                    id: '123'
                }],
                openingDate: '2010-01-01',
                attributeValues: [{
                    attribute: {
                        code: 'Type',
                        name: 'Type'
                    },
                    value: 'Project'
                }, {
                    attribute: {
                        code: 'prjCon',
                        name: 'Context'
                    },
                    value: 'val2'
                }, {
                    attribute: {
                        code: 'prjLoc',
                        name: 'Location'
                    },
                    value: 'val3'
                }, {
                    attribute: {
                        code: 'prjPopType',
                        name: 'Type of population'
                    },
                    value: 'val6'
                }, {
                    attribute: {
                        code: 'projCode',
                        name: 'Project Code'
                    },
                    value: 'AB001'
                }, {
                    attribute: {
                        code: 'reasonForIntervention',
                        name: 'Reason For Intervention'
                    },
                    value: 'Armed Conflict'
                }, {
                    attribute: {
                        code: 'modeOfOperation',
                        name: 'Mode Of Operation'
                    },
                    value: 'Direct Operation'
                }, {
                    attribute: {
                        code: 'modelOfManagement',
                        name: 'Model Of Management'
                    },
                    value: 'Collaboration'
                }, {
                    attribute: {
                        code: 'autoApprove',
                        name: 'Auto Approve'
                    },
                    value: 'true'
                }, {
                    attribute: {
                        code: 'prjEndDate',
                        name: 'End date'
                    },
                    value: '2011-01-01'
                }]
            });
        });
    });
});