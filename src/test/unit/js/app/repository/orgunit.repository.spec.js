define(["orgUnitRepository", "utils", "angularMocks", "timecop", "datasetRepository", "programRepository", "lodash"], function(OrgUnitRepository, utils, mocks, timecop, DatasetRepository, ProgramRepository, _) {
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
                "orgUnitIds": ["mod1"],
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
                "orgUnitIds": ["mod2"],
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "code": "isNewDataModel"
                    }
                }]
            }];

            scope = $rootScope.$new();
            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, "getAllAggregateDatasets").and.returnValue(utils.getPromise(q, datasets));

            programRepository = new ProgramRepository();
            spyOn(programRepository, "getAll").and.returnValue(utils.getPromise(q, []));

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

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, programRepository, q);
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

        it("should find all orgunits", function() {
            var projectIds = ["proj1", "proj2"];
            var orgUnit = orgUnitRepository.findAll(projectIds);
            scope.$apply();

            expect(mockOrgStore.each).toHaveBeenCalled();
            expect(mockOrgStore.each.calls.argsFor(0)[0].inList).toEqual(projectIds);
        });

        it("should save org hierarchy when data is changed locally and should add clientlastupdated and parentId field", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "parent": {
                    "id": "p1"
                }
            }];

            var expectedUpsertPayload = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "clientLastUpdated": "2014-05-30T12:43:54.972Z",
                "parent": {
                    "id": "p1"
                },
                "parentId": "p1"
            }];

            orgUnitRepository.upsert(orgUnit).then(function(data) {
                expect(data).toEqual(expectedUpsertPayload);
            });

            scope.$apply();

            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedUpsertPayload);
        });

        it("should save org hierarchy when data is changed on dhis and should not add clientlastupdated field", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "parent": {
                    "id": "p1"
                }
            }];

            var expectedUpsertPayload = [{
                "id": "org_0",
                "level": 1,
                "parent": {
                    "id": "p1"
                },
                "parentId": "p1",
                "lastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            orgUnitRepository.upsertDhisDownloadedData(orgUnit).then(function(data) {
                expect(data).toEqual(expectedUpsertPayload);
            });

            scope.$apply();

            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedUpsertPayload);
        });

        it("should get all org units", function() {
            var actualOrgUnits;

            orgUnitRepository.getAll().then(function(results) {
                actualOrgUnits = results;
            });
            scope.$apply();
            expect(mockOrgStore.getAll).toHaveBeenCalled();
            expect(actualOrgUnits).toEqual(orgUnits);
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
            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, programRepository, q);

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

            var orgUnitsByParent = {
                "prj1": [module1],
                "prj2": [opunit1],
                "prj3": [module3, opunit2],
                "opunit1": [module2],
                "opunit2": [module4],
                "mod1": [],
                "mod2": [],
                "mod3": [],
                "mod4": []
            };

            var allOrgUnits = [project1, project2, project3, module1, module2, module3, module4, module5, opunit1, opunit2];
            mockDb = utils.getMockDB(q, {}, allOrgUnits);
            mockDb.objectStore.each.and.callFake(function(query) {
                var children = _.transform(query.inList, function(acc, pid) {
                    acc = acc.push(orgUnitsByParent[pid]);
                }, []);
                return utils.getPromise(q, _.flatten(children));
            });

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, programRepository, q);
            scope.$apply();
            orgUnitRepository.getAllModulesInOrgUnitsExceptCurrentModules(["prj1", "prj2"]).then(function(userModules) {
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
                }]
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
                }]
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
                }]
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
                }]
            };

            var orgUnitsByParent = {
                "prj1": [module1],
                "prj2": [opunit1],
                "prj3": [module3, opunit2],
                "opunit1": [module2],
                "opunit2": [module4],
                "mod1": [],
                "mod2": [],
                "mod3": [],
                "mod4": []
            };

            var allOrgUnits = [project1, project2, project3, module1, module2, module3, module4, opunit1, opunit2];
            mockDb = utils.getMockDB(q, {}, allOrgUnits);
            mockDb.objectStore.each.and.callFake(function(query) {
                var children = _.transform(query.inList, function(acc, pid) {
                    acc = acc.push(orgUnitsByParent[pid]);
                }, []);
                return utils.getPromise(q, _.flatten(children));
            });

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, programRepository, q);

            scope.$apply();
            orgUnitRepository.getAllModulesInOrgUnitsExceptCurrentModules(["prj1", "prj2"], true).then(function(userModules) {
                modules = userModules;
            });

            scope.$apply();

            expect(modules).toEqual([module2]);
        });

        it("should get all org units except current modules", function() {
            var datasets = [{
                "id": "newDs",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "newMod",
                    "name": "m2"
                }],
                "orgUnitIds": ["newMod"],
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "code": "isNewDataModel"
                    }
                }]
            }];

            var programs = [{
                "id": "prg1",
                "name": "Program1",
                "organisationUnits": [{
                    "id": "newLineListMod"
                }],
                "orgUnitIds": ["newLineListMod"],
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "code": "isNewDataModel"
                    }
                }]
            }];

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

            var currentAggregateModule = {
                "id": "currentMod",
                "level": 6,
                "name": "c2",
                "children": [],
                "attributeValues": [{
                    "value": "false",
                    "attribute": {
                        "name": "Is Linelist Service",
                        "code": "isLineListService",
                    }
                }, {
                    "value": "Module",
                    "attribute": {
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

            var newAggregateModule = {
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

            var newLineListModule = {
                "id": "newLineListMod",
                "level": 6,
                "name": "l1",
                "displayName": "l1",
                "dataSets": [],
                "attributeValues": [{
                    "value": "Module",
                    "attribute": {
                        "name": "Type",
                        "code": "Type",
                    }
                }, {
                    "value": "true",
                    "attribute": {
                        "name": "Is Linelist Service",
                        "code": "isLineListService",
                    }
                }]
            };

            var currentLineListModule = {
                "id": "currentLineListMod",
                "level": 6,
                "name": "l2",
                "displayName": "l2",
                "dataSets": [],
                "attributeValues": [{
                    "value": "Module",
                    "attribute": {
                        "name": "Type",
                        "code": "Type",
                    }
                }, {
                    "value": "true",
                    "attribute": {
                        "name": "Is Linelist Service",
                        "code": "isLineListService",
                    }
                }]
            };

            var allOrgUnits = [testCountry, testProject, opUnit1, currentAggregateModule, newAggregateModule, newLineListModule, aggModuleWithoutDataset, currentLineListModule];

            mockDb = utils.getMockDB(q, {}, _.clone(allOrgUnits, true));
            mockOrgStore = mockDb.objectStore;

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, programRepository, q);
            datasetRepository.getAllAggregateDatasets.and.returnValue(utils.getPromise(q, datasets));
            programRepository.getAll.and.returnValue(utils.getPromise(q, programs));

            var actualOrgUnits = [];
            orgUnitRepository.getAll(false).then(function(data) {
                actualOrgUnits = data;
            });

            scope.$apply();

            var expectedOrgUnits = [testCountry, testProject, opUnit1, newAggregateModule, newLineListModule];
            expect(actualOrgUnits).toEqual(expectedOrgUnits);
        });

        it("should find all org units by parent id", function() {
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
                }]
            };

            var module1 = {
                "name": "mod1",
                "displayName": "mod1",
                "id": "mod1",
                "parent": {
                    "id": "prj1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }]
            };

            var orgUnitsByParent = {
                "prj1": [module1]
            };

            var allOrgUnits = [project1, module1];
            mockDb = utils.getMockDB(q, {}, allOrgUnits, [module1]);

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, programRepository, q);

            scope.$apply();

            var actualOrgUnits = [];
            var expectedOrgUnits = [module1];
            orgUnitRepository.findAllByParent(["prj1"]).then(function(orgUnits) {
                actualOrgUnits = orgUnits;
            });

            scope.$apply();
            expect(actualOrgUnits).toEqual(expectedOrgUnits);
        });

        it('should get parent project', function() {
            var project = {
                "id": "1",
                "name": "Prj1",
                "parent": {
                    "id": "countryId"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }]
            };

            var opUnit = {
                "id": "2",
                "name": "Opunit1",
                "parent": {
                    "id": "1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }]
            };

            var module = {
                "id": "3",
                "name": "Mod1",
                "parent": {
                    "id": "1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }]
            };

            var getMockStore = function(q) {
                return {
                    "find": function() {}
                };
            };

            var getMockDB = function(q) {
                var mockStore = getMockStore(q);
                var db = {
                    "objectStore": jasmine.createSpy("objectStore").and.callFake(function() {
                        return mockStore;
                    })
                };

                return {
                    "db": db,
                    "objectStore": mockStore
                };
            };

            var mockDb = getMockDB(q);
            spyOn(mockDb.objectStore, 'find').and.callFake(function(id) {
                if (id === "1")
                    return utils.getPromise(q, project);
                if (id === "2")
                    return utils.getPromise(q, opUnit);
                if (id === "3") {
                    return utils.getPromise(q, module);
                }
                return utils.getPromise(q, {});
            });

            orgUnitRepository = new OrgUnitRepository(mockDb.db, datasetRepository, programRepository, q);

            var result;
            orgUnitRepository.getParentProject("3").then(function(data) {
                result = data;
            });
            scope.$apply();

            expect(result).toBe(project);
        });
    });
});
