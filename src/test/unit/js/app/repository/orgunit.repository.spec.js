define(["orgUnitRepository", "utils", "angularMocks"], function(OrgUnitRepository, utils, mocks) {
    describe("Org Unit Repository specs", function() {
        var mockOrgStore, mockDb, orgUnitRepository, q, orgUnits, scope;
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
                "name": "MSF"
            }, {
                "id": "c1",
                "name": "country1",
                "parent": {
                    "id": "0",
                    "name": "MSF"
                }
            }, {
                "id": "p1",
                "name": "project1",
                "parent": {
                    "id": "c1",
                    "name": "country1"
                }
            }, {
                "id": "m1",
                "name": "module1",
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
                "parent": {
                    "id": "op1",
                    "name": "opUnit1"
                }
            }];
            scope = $rootScope.$new();

            mockDb = utils.getMockDB(q, {}, _.clone(orgUnits, true));
            mockOrgStore = mockDb.objectStore;
            orgUnitRepository = new OrgUnitRepository(mockDb.db, q);
        }));

        it("should get orgUnit", function() {
            var projectId = "proj1";
            var orgUnit = orgUnitRepository.getOrgUnit(projectId);
            scope.$apply();

            expect(mockOrgStore.find).toHaveBeenCalledWith(projectId);
        });

        it("should save org hierarchy", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }];

            orgUnitRepository.upsert(orgUnit).then(function(data) {
                expect(data).toEqual(orgUnit);
            });
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(orgUnit);
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
            orgUnitRepository = new OrgUnitRepository(mockDb.db, q);

            orgUnitRepository.getAllProjects().then(function(data) {
                expect(data.length).toEqual(1);
                expect(data[0]).toEqual(project);
                expect(project.code).toEqual("123");
            });

            scope.$apply();
        });

        it("should get all modules for given org units if disabled flag is not given", function() {
            var modules = [];
            var project1 = {
                "name": "prj1",
                "displayName": "prj1",
                "id": "prj1",
                "parent": {
                    id: "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Project"
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
                    id: "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Project"
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
                    id: "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Project"
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
                    id: "prj1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }],
                "children": []
            };

            var opunit1 = {
                "name": "opunit1",
                "displayName": "opunit1",
                "id": "opunit1",
                "parent": {
                    id: "prj2"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Operation Unit"
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
                    id: "opunit1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }],
                "children": []
            };

            var module3 = {
                "name": "mod3",
                "displayName": "mod3",
                "id": "mod3",
                "parent": {
                    id: "prj3"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }],
                "children": []
            };


            var opunit2 = {
                "name": "opunit2",
                "displayName": "opunit2",
                "id": "opunit2",
                "parent": {
                    id: "prj3"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Operation Unit"
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
                    id: "opunit2"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }],
                "children": []
            };

            var allOrgUnits = [project1, project2, project3, module1, module2, module3, module4, opunit1, opunit2];
            mockDb = utils.getMockDB(q, {}, allOrgUnits);

            orgUnitRepository = new OrgUnitRepository(mockDb.db, q);
            scope.$apply();
            orgUnitRepository.getAllModulesInProjects(["prj1", "prj2"]).then(function(userModules) {
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
                    id: "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Project"
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
                    id: "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Project"
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
                    id: "cnt1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Project"
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
                    id: "prj1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }, {
                    "attribute": {
                        "code": "isDisabled"
                    },
                    value: true
                }],
                "children": []
            };

            var opunit1 = {
                "name": "opunit1",
                "displayName": "opunit1",
                "id": "opunit1",
                "parent": {
                    id: "prj2"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Operation Unit"
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
                    id: "opunit1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }],
                "children": []
            };

            var module3 = {
                "name": "mod3",
                "displayName": "mod3",
                "id": "mod3",
                "parent": {
                    id: "prj3"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }],
                "children": []
            };


            var opunit2 = {
                "name": "opunit2",
                "displayName": "opunit2",
                "id": "opunit2",
                "parent": {
                    id: "prj3"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Operation Unit"
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
                    id: "opunit2"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    value: "Module"
                }],
                "children": []
            };

            var allOrgUnits = [project1, project2, project3, module1, module2, module3, module4, opunit1, opunit2];
            mockDb = utils.getMockDB(q, {}, allOrgUnits);

            orgUnitRepository = new OrgUnitRepository(mockDb.db, q);
            scope.$apply();
            orgUnitRepository.getAllModulesInProjects(["prj1", "prj2"], true).then(function(userModules) {
                modules = userModules;
            });

            scope.$apply();

            expect(modules).toEqual([module2]);
        });
    });
});