define(["orgUnitMapper", "angularMocks", "moment", "timecop", "dhisId", "customAttributes"], function(orgUnitMapper, mocks, moment, timecop, dhisId, customAttributes) {
    describe("orgUnitMapper", function() {
        beforeEach(function() {
            Timecop.install();
            Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));
        });

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('mapToProject', function () {
            it("should convert project from DHIS to project for view", function() {
                var dhisProject = {
                    "id": "aa4acf9115a",
                    "name": "Org1",
                    "level": 3,
                    "attributeValues": []
                };

                var allContexts = [{
                    "id": "a16b4a97ce4",
                    "name": "val2",
                    "englishName": "val2"
                }];
                var allPopTypes = [{
                    "id": "a35778ed565",
                    "name": "val5",
                    "englishName": "val5"
                }, {
                    "id": "a48f665185e",
                    "name": "val6",
                    "englishName": "val6",
                }];
                var reasonForIntervention = [{
                    "id": "a8014cfca5c",
                    "name": "Armed Conflict",
                    "englishName": "Armed Conflict"
                }];
                var modeOfOperation = [{
                    "id": "a560238bc90",
                    "name": "Direct Operation",
                    "englishName": "Direct Operation"
                }];
                var modelOfManagement = [{
                    "id": "a11a7a5d55a",
                    "name": "Collaboration",
                    "englishName": "Collaboration"
                }];
                var allProjectTypes = [{
                    "id": "a11a7aty65a",
                    "name": "Some Type",
                    "englishName": "Some Type"
                }];

                spyOn(customAttributes, 'getAttributeValue').and.callFake(function (attributeValues, code) {
                    var fakeAttributeValues = {
                        prjEndDate: '2011-01-01',
                        autoApprove: 'true',
                        prjLoc: 'val3',
                        projCode: 'RU118',
                        estimatedTargetPopulation: 1000,
                        estPopulationLessThan1Year: 11,
                        estPopulationBetween1And5Years: 12,
                        estPopulationOfWomenOfChildBearingAge: 13,
                        prjCon: 'val2',
                        prjPopType: 'val5',
                        projectType: 'Some Type',
                        reasonForIntervention: 'Armed Conflict',
                        'modeOfOperation': 'Direct Operation',
                        'modelOfManagement': 'Collaboration'
                    };
                    return fakeAttributeValues[code];
                });
                var result = orgUnitMapper.mapToProject(dhisProject, allContexts, allPopTypes, reasonForIntervention, modeOfOperation, modelOfManagement, allProjectTypes);

                var expectedResult = {
                    name:'Org1',
                    openingDate: moment(dhisProject.openingDate).toDate(),
                    context: {
                        id: 'a16b4a97ce4',
                        name: 'val2',
                        englishName: 'val2'
                    },
                    location: 'val3',
                    populationType: {
                        id: 'a35778ed565',
                        name: 'val5',
                        englishName: 'val5'
                    },
                    endDate: moment("2011-01-01").toDate(),
                    projectCode: 'RU118',
                    projectType: {
                        id: 'a11a7aty65a',
                        name: 'Some Type',
                        englishName: 'Some Type'
                    },
                    reasonForIntervention: {
                        id: 'a8014cfca5c',
                        name: 'Armed Conflict',
                        englishName: 'Armed Conflict'
                    },
                    modeOfOperation: {
                        id: 'a560238bc90',
                        name: 'Direct Operation',
                        englishName: 'Direct Operation'
                    },
                    modelOfManagement: {
                        id: 'a11a7a5d55a',
                        name: 'Collaboration',
                        englishName: 'Collaboration'
                    },
                    estimatedTargetPopulation: 1000,
                    estPopulationLessThan1Year: 11,
                    estPopulationBetween1And5Years: 12,
                    estPopulationOfWomenOfChildBearingAge: 13,
                    autoApprove: 'true'
                };

                expect(result).toEqual(expectedResult);
            });

            it("should set autoApprove to false if the attribute does not exist in dhis", function() {
                var dhisProject = {
                    "id": "aa4acf9115a",
                    "name": "Org1",
                    "level": 3
                };

                var result = orgUnitMapper.mapToProject(dhisProject);

                expect(result.autoApprove).toEqual('false');
            });
        });
        it("should transform orgUnit to contain attributes as per DHIS", function() {
            var orgUnit = {
                "name": "Org1",
                "openingDate": moment("2010-01-01").toDate(),
                "context": {
                    "name": "val2",
                    "englishName": "val2"
                },
                "location": "val3",
                "endDate": moment("2011-01-01").toDate(),
                "populationType": {
                    "name": "val6",
                    "englishName": "val6"
                },
                "projectCode": "AB001",
                "projectType": {
                    "name": "Some Type",
                    "englishName": "Some Type"
                },
                "reasonForIntervention": {
                    "name": "Armed Conflict",
                    "englishName": "Armed Conflict"
                },
                "modeOfOperation": {
                    "name": "Direct Operation",
                    "englishName": "Direct Operation"
                },
                "modelOfManagement": {
                    "name": "Collaboration",
                    "englishName": "Collaboration"
                },
                "estimatedTargetPopulation": "1000",
                "estPopulationLessThan1Year": 11,
                "estPopulationBetween1And5Years": 12,
                "estPopulationOfWomenOfChildBearingAge": 13,
                "autoApprove": "true"
            };

            var parentOrgUnit = {
                "name": "Name1",
                "id": "Id1",
                "level": "2",
            };

            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });

            var result = orgUnitMapper.mapToProjectForDhis(orgUnit, parentOrgUnit);

            var expectedResult = {
                "id": "Org1Id1",
                "name": "Org1",
                "level": 3,
                "shortName": "Org1",
                "openingDate": "2010-01-01",
                "parent": {
                    "name": "Name1",
                    "id": "Id1"
                },
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Project"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context"
                    },
                    "value": "val2"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location"
                    },
                    "value": "val3"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population"
                    },
                    "value": "val6"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code"
                    },
                    "value": "AB001"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "reasonForIntervention",
                        "name": "Reason For Intervention"
                    },
                    "value": "Armed Conflict"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "modeOfOperation",
                        "name": "Mode Of Operation"
                    },
                    "value": "Direct Operation"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "modelOfManagement",
                        "name": "Model Of Management"
                    },
                    "value": "Collaboration"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "autoApprove",
                        "name": "Auto Approve"
                    },
                    "value": "true"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "projectType",
                        "name": "Project Type"
                    },
                    "value": "Some Type"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estimatedTargetPopulation",
                        "name": "Estimated target population"
                    },
                    "value": "1000"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationLessThan1Year",
                        "name": "Est. population less than 1 year",
                    },
                    "value": "11"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationBetween1And5Years",
                        "name": "Est. population between 1 and 5 years"
                    },
                    "value": "12"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationOfWomenOfChildBearingAge",
                        "name": "Est. population of women of child bearing age"
                    },
                    "value": "13"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date"
                    },
                    "value": "2011-01-01"
                }]
            };

            expect(result).toEqual(expectedResult);
        });

        it("should map modules for dhis if id and level are not given", function() {
            var module = {
                "name": "Module1",
                "service": "Aggregate",
                "openingDate": new Date(),
                "associatedDatasets": [{
                    "id": "ds_11",
                    "name": "dataset11",
                }, {
                    "id": "ds_12",
                    "name": "dataset12"
                }],
                "parent": {
                    "name": "Parent",
                    "id": "Par1",
                    "level": 3
                }
            };

            var today = new Date("2010-01-01T00:00:00");
            spyOn(window, "Date").and.returnValue(today);
            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });
            var actualModule = orgUnitMapper.mapToModule(module);

            expect(actualModule).toEqual({
                "name": "Module1",
                "displayName": "Parent - Module1",
                "shortName": "Module1",
                "id": "Module1Par1",
                "level": 4,
                "openingDate": moment.utc(new Date()).format("YYYY-MM-DD"),
                "attributeValues": [{
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Module"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "isLineListService",
                        "name": "Is Linelist Service"
                    },
                    "value": "false"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "name": "Parent",
                    "id": "Par1"
                }
            });
        });

        it("should map modules for dhis if id and level are given", function() {
            var module = {
                "name": "Module1",
                "openingDate": new Date(),
                "service": "Aggregate",
                "associatedDatasets": [{
                    "id": "ds_11",
                    "name": "dataset11",
                }, {
                    "id": "ds_12",
                    "name": "dataset12"
                }],
                "parent": {
                    "name": "Parent",
                    "id": "Par1",
                    "level": 3
                }
            };

            var today = new Date("2010-01-01T00:00:00");
            spyOn(window, "Date").and.returnValue(today);

            var actualModule = orgUnitMapper.mapToModule(module, "someId", "someLevel");

            expect(actualModule).toEqual({
                "name": "Module1",
                "shortName": "Module1",
                "displayName": "Parent - Module1",
                "id": "someId",
                "level": "someLevel",
                "openingDate": moment.utc(new Date()).format("YYYY-MM-DD"),
                "attributeValues": [{
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Module"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "isLineListService",
                        "name": "Is Linelist Service"
                    },
                    "value": "false"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "name": "Parent",
                    "id": "Par1"
                }
            });
        });

        it("should filter modules from org units", function() {
            var project = {
                "name": "Project1",
                "id": "id1",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }]
            };

            var module = {
                "name": "Module1",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "name": "Project1",
                    "id": "id1"
                },
            };

            var opUnit = {
                "name": "opunit1",
                "id": "opunit1",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }],
                "parent": {
                    "name": "Project1",
                    "id": "id1"
                },
            };

            var moduleUnderOpunit = {
                "name": "Module2",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
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
                "displayName": "Module1"
            });
            var expectedModule2 = _.merge(_.cloneDeep(moduleUnderOpunit), {
                "displayName": "opunit1 - Module2"
            });

            var actualModules = orgUnitMapper.filterModules(organisationUnits);

            expect(actualModules).toEqual([expectedModule1, expectedModule2]);
        });

        it("should disable orgUnit", function() {
            var module = {
                "name": "Module1",
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": "false"
                }],
            };

            var expectedModule = {
                "name": "Module1",
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": "true"
                }],
            };

            var payload = orgUnitMapper.disable(module);
            expect(payload).toEqual(expectedModule);
        });

        it("should disable multiple orgUnits", function() {
            var modules = [{
                "name": "Module1",
                "attributeValues": [],
            }, {
                "name": "Module2",
                "attributeValues": [],
            }];

            var expectedModules = [{
                "name": "Module1",
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": "true"
                }],
            }, {
                "name": "Module2",
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": "true"
                }],
            }];

            var payload = orgUnitMapper.disable(modules);
            expect(payload).toEqual(expectedModules);
        });

        it("should map to existing project", function() {
            var project = {
                "name": "Project1",
                "id": "id1",
                "children": [{
                    "id": "123"
                }]
            };

            var newProject = {
                "name": "Org1",
                "openingDate": moment("2010-01-01").toDate(),
                "context": {
                    "name": "val2",
                    "englishName": "val2"
                },
                "location": "val3",
                "endDate": moment("2011-01-01").toDate(),
                "populationType": {
                    "name": "val6",
                    "englishName": "val6"
                },
                "projectCode": "AB001",
                "projectType": {
                    "name": "Some Type",
                    "englishName": "Some Type"
                },
                "reasonForIntervention": {
                    "name": "Armed Conflict",
                    "englishName": "Armed Conflict"
                },
                "modeOfOperation": {
                    "name": "Direct Operation",
                    "englishName": "Direct Operation"
                },
                "modelOfManagement": {
                    "name": "Collaboration",
                    "englishName": "Collaboration"
                },
                "autoApprove": "true",
                "estimatedTargetPopulation": "1000",
                "estPopulationLessThan1Year": "11",
                "estPopulationBetween1And5Years": "12",
                "estPopulationOfWomenOfChildBearingAge": "13"
            };

            var expectedSavedProject = {
                "name": "Org1",
                "id": "id1",
                "children": [{
                    "id": "123"
                }],
                "openingDate": "2010-01-01",
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Project"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context"
                    },
                    "value": "val2"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location"
                    },
                    "value": "val3"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population"
                    },
                    "value": "val6"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code"
                    },
                    "value": "AB001"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "reasonForIntervention",
                        "name": "Reason For Intervention"
                    },
                    "value": "Armed Conflict"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "modeOfOperation",
                        "name": "Mode Of Operation"
                    },
                    "value": "Direct Operation"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "modelOfManagement",
                        "name": "Model Of Management"
                    },
                    "value": "Collaboration"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "autoApprove",
                        "name": "Auto Approve"
                    },
                    "value": "true"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "projectType",
                        "name": "Project Type"
                    },
                    "value": "Some Type"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estimatedTargetPopulation",
                        "name": "Estimated target population"
                    },
                    "value": "1000"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationLessThan1Year",
                        "name": "Est. population less than 1 year",
                    },
                    "value": "11"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationBetween1And5Years",
                        "name": "Est. population between 1 and 5 years"
                    },
                    "value": "12"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationOfWomenOfChildBearingAge",
                        "name": "Est. population of women of child bearing age"
                    },
                    "value": "13"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date"
                    },
                    "value": "2011-01-01"
                }]
            };

            var projectToBeSaved = orgUnitMapper.mapToExistingProject(newProject, project);

            expect(projectToBeSaved).toEqual(expectedSavedProject);
        });

        it("should create patient origin orgunit payload", function() {
            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });

            var parents = [{
                "id": "p1",
                "name": "p1",
                "openingDate": "2014-02-02"
            }, {
                "id": "p2",
                "name": "p2",
                "openingDate": "2015-02-02"
            }];

            var patientOrigins = [{
                "name": "Origin1",
                "latitude": 23.21,
                "longitude": 32.12
            }, {
                "name": "Origin2",
                "latitude": 43.96,
                "longitude": 84.142
            }, {
                "name": "Unknown"
            }];

            var expectedPayload = [{
                "name": patientOrigins[0].name,
                "shortName": patientOrigins[0].name,
                "displayName": patientOrigins[0].name,
                "id": dhisId.get(patientOrigins[0].name + "p1"),
                "level": 7,
                "openingDate": "2014-02-02",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Patient Origin"
                }, {
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "id": "p1"
                },
                "coordinates": "[" + patientOrigins[0].longitude + "," + patientOrigins[0].latitude + "]",
                "featureType": "POINT"
            }, {
                "name": patientOrigins[0].name,
                "shortName": patientOrigins[0].name,
                "displayName": patientOrigins[0].name,
                "id": dhisId.get(patientOrigins[0].name + "p2"),
                "level": 7,
                "openingDate": "2015-02-02",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Patient Origin"
                }, {
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "id": "p2"
                },
                "coordinates": "[" + patientOrigins[0].longitude + "," + patientOrigins[0].latitude + "]",
                "featureType": "POINT"
            }, {
                "name": patientOrigins[1].name,
                "shortName": patientOrigins[1].name,
                "displayName": patientOrigins[1].name,
                "id": dhisId.get(patientOrigins[1].name + "p1"),
                "level": 7,
                "openingDate": "2014-02-02",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Patient Origin"
                }, {
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "id": "p1"
                },
                "coordinates": "[" + patientOrigins[1].longitude + "," + patientOrigins[1].latitude + "]",
                "featureType": "POINT"
            }, {
                "name": patientOrigins[1].name,
                "shortName": patientOrigins[1].name,
                "displayName": patientOrigins[1].name,
                "id": dhisId.get(patientOrigins[1].name + "p2"),
                "level": 7,
                "openingDate": "2015-02-02",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Patient Origin"
                }, {
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "id": "p2"
                },
                "coordinates": "[" + patientOrigins[1].longitude + "," + patientOrigins[1].latitude + "]",
                "featureType": "POINT"
            }, {
                "name": patientOrigins[2].name,
                "shortName": patientOrigins[2].name,
                "displayName": patientOrigins[2].name,
                "id": dhisId.get(patientOrigins[2].name + "p1"),
                "level": 7,
                "openingDate": "2014-02-02",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Patient Origin"
                }, {
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "id": "p1"
                }
            }, {
                "name": patientOrigins[2].name,
                "shortName": patientOrigins[2].name,
                "displayName": patientOrigins[2].name,
                "id": dhisId.get(patientOrigins[2].name + "p2"),
                "level": 7,
                "openingDate": "2015-02-02",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Patient Origin"
                }, {
                    "attribute": {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    "value": "true"
                }],
                "parent": {
                    "id": "p2"
                }
            }];

            var actualPayload = orgUnitMapper.createPatientOriginPayload(patientOrigins, parents);

            expect(actualPayload).toEqual(expectedPayload);
        });
    });
});
