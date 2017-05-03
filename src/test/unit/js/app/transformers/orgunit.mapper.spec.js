define(["orgUnitMapper", "angularMocks", "moment", "timecop", "dhisId", "customAttributes"], function(orgUnitMapper, mocks, moment, timecop, dhisId, customAttributes) {
    describe("orgUnitMapper", function() {

        var createMockAttribute = function (code, value) {
            return {
                "created": "2014-10-29T12:43:54.972Z",
                "lastUpdated": "2014-10-29T12:43:54.972Z",
                "attribute": {
                    "code": code
                },
                "value": value
            };
        };

        beforeEach(function() {
            spyOn(customAttributes, 'createAttribute').and.callFake(function (code, value) {
                return createMockAttribute(code, value);
            });
            Timecop.install();
            Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));
        });

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('mapOrgUnitToProject', function () {
            it("should convert project from DHIS to project for view", function() {
                var mockOrgUnitGroupSets = [{
                    id: 'orgUnitGroupSetId',
                    organisationUnitGroups: [{
                        id: 'orgUnitGroupId',
                        name: 'Direct operation'
                    }, {
                        id: 'otherOrgUnitGroupId',
                        name: 'some name',
                    }]
                }];

                var dhisProject = {
                    id: 'aa4acf9115a',
                    name: 'Org1',
                    level: 3,
                    attributeValues: [],
                    organisationUnitGroups: [{
                        id: 'orgUnitGroupId',
                        organisationUnitGroupSet: {
                            id: 'orgUnitGroupSetId'
                        }
                    }]
                };

                spyOn(customAttributes, 'getAttributeValue').and.callFake(function (attributeValues, code) {
                    var fakeAttributeValues = {
                        prjEndDate: '2011-01-01',
                        autoApprove: 'true',
                        prjLoc: 'val3',
                        projCode: 'RU118',
                        estimatedTargetPopulation: 1000,
                        estPopulationLessThan1Year: 11,
                        estPopulationBetween1And5Years: 12,
                        estPopulationOfWomenOfChildBearingAge: 13
                    };
                    return fakeAttributeValues[code];
                });
                var result = orgUnitMapper.mapOrgUnitToProject(dhisProject, mockOrgUnitGroupSets);

                var expectedResult = {
                    name:'Org1',
                    openingDate: moment(dhisProject.openingDate).toDate(),
                    location: 'val3',
                    endDate: moment("2011-01-01").toDate(),
                    projectCode: 'RU118',
                    estimatedTargetPopulation: 1000,
                    estPopulationLessThan1Year: 11,
                    estPopulationBetween1And5Years: 12,
                    estPopulationOfWomenOfChildBearingAge: 13,
                    autoApprove: 'true',
                    orgUnitGroupSets: {
                        orgUnitGroupSetId: {
                            id: "orgUnitGroupId",
                            name: "Direct operation"
                        }
                    }
                };

                expect(result).toEqual(expectedResult);
            });

            it("should set autoApprove to false if the attribute does not exist in dhis", function() {
                var dhisProject = {
                    "id": "aa4acf9115a",
                    "name": "Org1",
                    "level": 3
                };

                var result = orgUnitMapper.mapOrgUnitToProject(dhisProject);

                expect(result.autoApprove).toEqual('false');
            });
        });

        describe('mapOrgUnitToOpunit', function () {
           it('should return the mapped opUnit', function () {
               var mockOrgUnitGroupSets = [{
                   id: 'someOrgUnitGroupSetId',
                   organisationUnitGroups: [{
                       id: 'someOrgUnitGroupId',
                       name: 'someOrgUnitGroupName'
                   }, {
                       id: 'someOtherOrgUnitGroupId',
                       name: 'someOtherOrgUnitGroupName',
                   }]
               }];

               var opUnit = {
                   id: 'opUnitId',
                   name: 'opUnitName',
                   level: 5,
                   coordinates: '[29,-45]',
                   attributeValues: [],
                   openingDate: 'someDate',
                   organisationUnitGroups: [{
                       id: 'someOrgUnitGroupId',
                       organisationUnitGroupSet: {
                           id: 'someOrgUnitGroupSetId'
                       }
                   }]
               };

               var expectedResult = {
                   name:'opUnitName',
                   openingDate: 'someDate',
                   longitude: 29,
                   latitude: -45,
                   orgUnitGroupSets: {
                       someOrgUnitGroupSetId: {
                           id: "someOrgUnitGroupId",
                           name: "someOrgUnitGroupName"
                       }
                   }
               };

               var result = orgUnitMapper.mapOrgUnitToOpUnit(opUnit, mockOrgUnitGroupSets);
               expect(result).toEqual(expectedResult);
           });
        });

        describe('mapToOpUnitForDHIS', function () {
            var opUnit, project, expectedResult;
            beforeEach(function () {
                opUnit = {
                    name:'opUnitName',
                    openingDate: 'someDate',
                    longitude: 29,
                    latitude: -45,
                    orgUnitGroupSets: {
                        someOrgUnitGroupSetId: {
                            id: "someOrgUnitGroupId",
                            name: "someOrgUnitGroupName"
                        }
                    }
                };
                project = {
                    id: 'someProjectId',
                    name: 'someProjectName',
                    level: 4
                };
                expectedResult = {
                    name: 'opUnitName',
                    openingDate: 'someDate',
                    attributeValues: [{
                        value: 'Operation Unit',
                        attribute: {
                            code: 'Type'
                        }
                    }, {
                        value: 'true',
                        attribute: {
                            code: 'isNewDataModel'
                        }
                    }],
                    id: 'opUnitId',
                    shortName: 'opUnitName',
                    level: 5,
                    parent: {
                        name: "someProjectName",
                        id: "someProjectId"
                    },
                    coordinates: '[29,-45]',
                    featureType: 'POINT',
                    organisationUnitGroups: [{
                        id: 'someOrgUnitGroupId',
                        organisationUnitGroupSet: {
                            id: 'someOrgUnitGroupSetId'
                        }
                    }]
                };
                spyOn(dhisId, 'get').and.returnValue('opUnitId');
                customAttributes.createAttribute.and.callFake(function (code, value) {
                    return {
                        value: value,
                        attribute: {
                            code: code
                        }
                    };
                });
            });

            it('should return the mapped opUnit for DHIS', function () {
                var result = orgUnitMapper.mapToOpUnitForDHIS(opUnit, project);
                expect(dhisId.get).toHaveBeenCalled();
                expect(result).toEqual(expectedResult);
            });

            it('should use existing opUnit id and level for an existing opUnit', function () {
                project.id = 'opUnitId';
                project.level = 5;
                var existingOpUnit = true;
                var result = orgUnitMapper.mapToOpUnitForDHIS(opUnit, project, existingOpUnit);
                expect(dhisId.get).not.toHaveBeenCalled();
                expect(result.id).toEqual('opUnitId');
                expect(result.level).toEqual(5);
            });
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

            var today = new Date("2014-10-29T12:43:54.972Z");
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
                        "code": "Type"
                    },
                    "value": "Module"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "false"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "isNewDataModel"
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

            expect(actualModule.id).toEqual("someId");
            expect(actualModule.level).toEqual("someLevel");

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
                        "code": "isDisabled"
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
                        "code": "isDisabled"
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
                        "code": "isDisabled"
                    },
                    "value": "true"
                }],
            }, {
                "name": "Module2",
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled"
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
                "location": "val3",
                "endDate": moment("2011-01-01").toDate(),
                "populationType": {
                    "name": "val6",
                    "englishName": "val6"
                },
                "projectCode": "AB001",
                "autoApprove": "true",
                "estimatedTargetPopulation": "1000",
                "estPopulationLessThan1Year": "11",
                "estPopulationBetween1And5Years": "12",
                "estPopulationOfWomenOfChildBearingAge": "13",
                "orgUnitGroupSets": {
                    "someOrgUnitGroupSetId": {
                        id: "someOrgUnitGroupId"
                    }
                }
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
                        "code": "Type"
                    },
                    "value": "Project"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjLoc"
                    },
                    "value": "val3"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "projCode"
                    },
                    "value": "AB001"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "autoApprove"
                    },
                    "value": "true"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estimatedTargetPopulation"
                    },
                    "value": "1000"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationLessThan1Year"
                    },
                    "value": "11"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationBetween1And5Years"
                    },
                    "value": "12"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "estPopulationOfWomenOfChildBearingAge"
                    },
                    "value": "13"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "prjEndDate"
                    },
                    "value": "2011-01-01"
                }],
                "organisationUnitGroups": [{
                    "id": "someOrgUnitGroupId",
                    "organisationUnitGroupSet": {
                        "id": "someOrgUnitGroupSetId"
                    }
                }]
            };

            var projectToBeSaved = orgUnitMapper.mapToExistingProjectForDHIS(newProject, project);

            expect(projectToBeSaved).toEqual(expectedSavedProject);
        });

        describe('createPatientOriginPayload', function () {

            beforeEach(function () {
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });
            });

            it("should return the created patient origin payload", function() {
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
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "isNewDataModel"
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
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "isNewDataModel"
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
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "isNewDataModel"
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
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "isNewDataModel"
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
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "isNewDataModel"
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
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "created": "2014-10-29T12:43:54.972Z",
                        "lastUpdated": "2014-10-29T12:43:54.972Z",
                        "attribute": {
                            "code": "isNewDataModel"
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

            it("should return the disabled patient origin payload for disabled patient origin", function() {
                var parents = [{
                    "id": "p1",
                    "name": "p1",
                    "openingDate": "2014-02-02"
                }];

                var patientOrigins = [{
                    "name": "Origin1",
                    "latitude": 23.21,
                    "longitude": 32.12,
                    "isDisabled": true
                }];

                var expectedAttributeValues = [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Patient Origin"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": "true"
                }];
                var actualPayload = orgUnitMapper.createPatientOriginPayload(patientOrigins, parents);

                expect(actualPayload[0].attributeValues).toEqual(expectedAttributeValues);
            });
        });
    });
});
