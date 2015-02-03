define(["orgUnitRepository", "utils", "angularMocks", "timecop", "datasetRepository"], function(OrgUnitRepository, utils, mocks, timecop, DatasetRepository) {
    describe("Org Unit Repository specs", function() {
        var mockOrgStore, mockDb, orgUnitRepository, q, orgUnits, scope, datasetRepository;
        var getAttr = function(key, value) {
            return {
                "attribute": {
                    "code": key
                },
                "value": value
            };
        };

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            orgUnits = [{
                "id": "0",
                "name": "MSF",
                "attributeValues": []
            }, {
                "id": "c1",
                "name": "country1",
                "attributeValues": [],
                "parent": {
                    "id": "0",
                    "name": "MSF"
                }
            }, {
                "id": "p1",
                "name": "project1",
                "attributeValues": [],
                "parent": {
                    "id": "c1",
                    "name": "country1"
                }
            }, {
                "id": "m1",
                "name": "module1",
                "attributeValues": [],
                "parent": {
                    "id": "p1",
                    "name": "project1"
                }
            }, {
                "id": "op1",
                "name": "opUnit1",
                "attributeValues": [{
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Operation Unit"
                }],
                "parent": {
                    "id": "p1",
                    "name": "project"
                }
            }, {
                "id": "m2",
                "name": "module2",
                "attributeValues": [],
                "parent": {
                    "id": "op1",
                    "name": "opUnit1"
                }
            }];

            var datasets = [{
                "id": "ds1",
                "organisationUnits": [{
                    "id": "mod1",
                    "name": "mod1"
                }],
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "code": "isNewDataModel"
                    }
                }]
            }, {
                "id": "ds2",
                "organisationUnits": [{
                    "id": "mod2",
                    "name": "mod2"
                }],
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "code": "isNewDataModel"
                    }
                }]
            }];

            scope = $rootScope.$new();
            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, "getAllForOrgUnit").and.callFake(function(orgUnitId) {
                if (orgUnitId === "currentMod") {
                    return utils.getPromise(q, [{
                        "id": "ds5",
                        "organisationUnits": [{
                            "id": "currentMod",
                            "name": "currentMod"
                        }],
                        "attributeValues": [{
                            "value": "false",
                            "attribute": {
                                "code": "isNewDataModel"
                            }
                        }]
                    }]);
                } else {
                    return utils.getPromise(q, datasets);
                }
            });

            var currentDataSet = {
                "id": "currentDs",
                "name": "OBGY_OPD - V1",
                "attributeValues": [{
                    "value": "false",
                    "attribute": {
                        "id": "wFC6joy3I8Q",
                        "name": "Is New Data Model",
                        "code": "isNewDataModel",
                    }
                }]
            };

            var newDataSet = {
                "id": "newDs",
                "name": "NeoNat",
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "id": "wFC6joy3I8Q",
                        "name": "Is New Data Model",
                        "code": "isNewDataModel",
                    }
                }]
            };

            mockDb = utils.getMockDB(q, {}, _.clone(orgUnits, true));
            mockOrgStore = mockDb.objectStore;

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, q);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should get orgUnit", function() {
            var projectId = "proj1";
            var orgUnit = orgUnitRepository.get(projectId);
            scope.$apply();

            expect(mockOrgStore.find).toHaveBeenCalledWith(projectId);
        });

        it("should save org hierarchy", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }];

            var expectedUpsertPayload = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            orgUnitRepository.upsert(orgUnit).then(function(data) {
                expect(data).toEqual(expectedUpsertPayload);
            });

            scope.$apply();

            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedUpsertPayload);
        });

        it("should update lastupdated time", function() {
            var orgUnit = {
                "id": "org_0",
                "level": 1
            };

            var expectedUpsertPayload = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            orgUnitRepository.upsert(orgUnit);
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedUpsertPayload);
        });

        it("should get all org units", function() {
            var allOrgUnits;

            orgUnitRepository.getAll().then(function(results) {
                allOrgUnits = results;
            });
            scope.$apply();
            expect(mockOrgStore.getAll).toHaveBeenCalled();

            expect(allOrgUnits[0]).toEqual(_.merge(orgUnits[0], {
                "displayName": "MSF"
            }));
            expect(allOrgUnits[1]).toEqual(_.merge(orgUnits[1], {
                "displayName": "country1"
            }));
            expect(allOrgUnits[2]).toEqual(_.merge(orgUnits[2], {
                "displayName": "project1"
            }));
            expect(allOrgUnits[3]).toEqual(_.merge(orgUnits[3], {
                "displayName": "module1"
            }));
            expect(allOrgUnits[4]).toEqual(_.merge(orgUnits[4], {
                "displayName": "opUnit1"
            }));
            expect(_.merge(allOrgUnits[5], {
                "displayName": "opUnit1 - module2"
            })).toEqual(_.merge(orgUnits[5], {
                "displayName": "opUnit1 - module2"
            }));
        });

        it("should get all projects", function() {
            var project = {
                "id": "prj",
                "attributeValues": [getAttr("projCode", "123"), getAttr("Type", "Project")]
            };
            var country = {
                "id": "con",
                "attributeValues": [getAttr("projCode", "421"), getAttr("Type", "Country")]
            };
            orgUnits = [project, country];
            mockDb = utils.getMockDB(q, {}, orgUnits);
            mockOrgStore = mockDb.objectStore;
            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, q);

            orgUnitRepository.getAllProjects().then(function(data) {
                expect(data.length).toEqual(1);
                expect(data[0]).toEqual(project);
                expect(project.code).toEqual("123");
            });

            scope.$apply();
        });

        it("should get all modules except current modules for given org units if disabled flag is not given", function() {
            var modules = [];
            var project1 = {
                "name": "prj1",
                "displayName": "prj1",
                "id": "prj1",
                "parent": {
                    "id": "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }],
                "children": [{
                    "id": "mod1",
                    "name": "mod1"
                }]
            };

            var project2 = {
                "name": "prj2",
                "displayName": "prj2",
                "id": "prj2",
                "parent": {
                    "id": "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }],
                "children": [{
                    "id": "opunit1",
                    "name": "opunit1"
                }]
            };

            var project3 = {
                "name": "prj3",
                "displayName": "prj3",
                "id": "prj3",
                "parent": {
                    "id": "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }],
                "children": [{
                    "id": "mod3",
                    "name": "mod3"
                }, {
                    "id": "opunit2",
                    "name": "opunit2"
                }]
            };

            var module1 = {
                "name": "mod1",
                "displayName": "mod1",
                "id": "mod1",
                "parent": {
                    "id": "prj1"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var opunit1 = {
                "name": "opunit1",
                "displayName": "opunit1",
                "id": "opunit1",
                "parent": {
                    "id": "prj2"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }],
                "children": [{
                    "id": "mod2",
                    "name": "mod2"
                }]
            };

            var module2 = {
                "name": "mod2",
                "displayName": "mod2",
                "id": "mod2",
                "parent": {
                    "id": "opunit1"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var module5 = {
                "name": "mod5",
                "displayName": "mod5",
                "id": "mod5",
                "parent": {
                    "id": "opunit1"
                },
                "dataSets": [{
                    "id": "currentDs",
                    "name": "OBGY_OPD - V1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var module3 = {
                "name": "mod3",
                "displayName": "mod3",
                "id": "mod3",
                "parent": {
                    "id": "prj3"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var opunit2 = {
                "name": "opunit2",
                "displayName": "opunit2",
                "id": "opunit2",
                "parent": {
                    "id": "prj3"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }],
                "children": [{
                    "id": "mod4",
                    "name": "mod4"
                }]
            };

            var module4 = {
                "name": "mod4",
                "displayName": "mod4",
                "id": "mod4",
                "parent": {
                    "id": "opunit2"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var allOrgUnits = [project1, project2, project3, module1, module2, module3, module4, module5, opunit1, opunit2];
            mockDb = utils.getMockDB(q, {}, allOrgUnits);

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, q);
            scope.$apply();
            orgUnitRepository.getAllModulesInOrgUnits(["prj1", "prj2"]).then(function(userModules) {
                modules = userModules;
            });

            scope.$apply();

            expect(modules).toEqual([module1, module2]);
        });

        it("should get all enabled modules for given org units", function() {
            var modules = [];
            var project1 = {
                "name": "prj1",
                "displayName": "prj1",
                "id": "prj1",
                "parent": {
                    "id": "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }],
                "children": [{
                    "id": "mod1",
                    "name": "mod1"
                }]
            };

            var project2 = {
                "name": "prj2",
                "displayName": "prj2",
                "id": "prj2",
                "parent": {
                    "id": "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }],
                "children": [{
                    "id": "opunit1",
                    "name": "opunit1"
                }]
            };

            var project3 = {
                "name": "prj3",
                "displayName": "prj3",
                "id": "prj3",
                "parent": {
                    "id": "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }],
                "children": [{
                    "id": "mod3",
                    "name": "mod3"
                }, {
                    "id": "opunit2",
                    "name": "opunit2"
                }]
            };

            var module1 = {
                "name": "mod1",
                "displayName": "mod1",
                "id": "mod1",
                "parent": {
                    "id": "prj1"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }, {
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": "true"
                }],
                "children": []
            };

            var opunit1 = {
                "name": "opunit1",
                "displayName": "opunit1",
                "id": "opunit1",
                "parent": {
                    "id": "prj2"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }],
                "children": [{
                    "id": "mod2",
                    "name": "mod2"
                }]
            };

            var module2 = {
                "name": "mod2",
                "displayName": "mod2",
                "id": "mod2",
                "parent": {
                    "id": "opunit1"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var module3 = {
                "name": "mod3",
                "displayName": "mod3",
                "id": "mod3",
                "parent": {
                    "id": "prj3"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var opunit2 = {
                "name": "opunit2",
                "displayName": "opunit2",
                "id": "opunit2",
                "parent": {
                    "id": "prj3"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }],
                "children": [{
                    "id": "mod4",
                    "name": "mod4"
                }]
            };

            var module4 = {
                "name": "mod4",
                "displayName": "mod4",
                "id": "mod4",
                "parent": {
                    "id": "opunit2"
                },
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "children": []
            };

            var allOrgUnits = [project1, project2, project3, module1, module2, module3, module4, opunit1, opunit2];
            mockDb = utils.getMockDB(q, {}, allOrgUnits);

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, q);
            scope.$apply();
            orgUnitRepository.getAllModulesInOrgUnits(["prj1", "prj2"], true).then(function(userModules) {
                modules = userModules;
            });

            scope.$apply();

            expect(modules).toEqual([module2]);
        });

        it("should get all org units except current modules", function() {
            var testCountry = {
                "id": "testCountry",
                "level": 3,
                "name": "A Test Country",
                "displayName": "A Test Country",
                "dataSets": [],
                "attributeValues": [{
                    "value": "Country",
                    "attribute": {
                        "id": "a1fa2777924",
                        "name": "Type",
                        "code": "Type",
                    }
                }]
            };

            var testProject = {
                "id": "testProject",
                "level": 4,
                "name": "A Test Proj",
                "displayName": "A Test Proj",
                "dataSets": [],
                "attributeValues": [{
                    "value": "Project",
                    "attribute": {
                        "id": "a1fa2777924",
                        "name": "Type",
                        "code": "Type",
                    }
                }]
            };

            var opUnit1 = {
                "id": "opUnit1",
                "level": 5,
                "name": "OpUnit1",
                "displayName": "OpUnit1",
                "dataSets": [],
                "attributeValues": [{
                    "value": "Operation Unit",
                    "attribute": {
                        "id": "a1fa2777924",
                        "name": "Type",
                        "code": "Type",
                    }
                }]
            };

            var currentModule = {
                "id": "currentMod",
                "level": 6,
                "name": "c2",
                "children": [],
                "dataSets": [{
                    "id": "currentDs",
                    "name": "OBGY_OPD - V1"
                }],
                "attributeValues": [{
                    "value": "false",
                    "attribute": {
                        "id": "ca6958d702e",
                        "name": "Is Linelist Service",
                        "code": "isLineListService",
                    }
                }, {
                    "value": "Module",
                    "attribute": {
                        "id": "a1fa2777924",
                        "name": "Type",
                        "code": "Type",
                    }
                }]
            };

            var aggModuleWithoutDataset = {
                "id": "aggModuleWithoutDataset",
                "level": 6,
                "name": "Operating Theatre",
                "displayName": "Operating Theatre",
                "children": [],
                "dataSets": [],
                "attributeValues": [{
                    "value": "Module",
                    "attribute": {
                        "id": "a1fa2777924",
                        "name": "Type",
                        "code": "Type",
                    }
                }]
            };

            var newModule = {
                "id": "newMod",
                "level": 6,
                "name": "m2",
                "displayName": "m2",
                "dataSets": [{
                    "id": "newDs",
                    "name": "NeoNat"
                }],
                "attributeValues": [{
                    "value": "Module",
                    "attribute": {
                        "id": "a1fa2777924",
                        "name": "Type",
                        "code": "Type",
                    }
                }, {
                    "value": "false",
                    "attribute": {
                        "id": "ca6958d702e",
                        "name": "Is Linelist Service",
                        "code": "isLineListService",
                    }
                }]
            };

            var lineListModule = {
                "id": "lineListMod",
                "level": 6,
                "name": "l1",
                "displayName": "l1",
                "dataSets": [],
                "attributeValues": [{
                    "value": "Module",
                    "attribute": {
                        "id": "a1fa2777924",
                        "name": "Type",
                        "code": "Type",
                    }
                }, {
                    "value": "true",
                    "attribute": {
                        "id": "ca6958d702e",
                        "name": "Is Linelist Service",
                        "code": "isLineListService",
                    }
                }]
            };

            var allOrgUnits = [testCountry, testProject, opUnit1, currentModule, newModule, lineListModule, aggModuleWithoutDataset];

            mockDb = utils.getMockDB(q, {}, _.clone(allOrgUnits, true));
            mockOrgStore = mockDb.objectStore;

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, q);

            var actualOrgUnits = [];
            orgUnitRepository.getAll(false).then(function(data) {
                actualOrgUnits = data;
            });

            scope.$apply();

            var expectedOrgUnits = [testCountry, testProject, opUnit1, lineListModule, newModule, aggModuleWithoutDataset];
            expect(actualOrgUnits).toEqual(expectedOrgUnits);
        });
    });
});
