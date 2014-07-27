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
                "a": "b"
            }, {
                "c": "d"
            }];
            scope = $rootScope.$new();
            mockDb = utils.getMockDB(q, {}, orgUnits);
            mockOrgStore = mockDb.objectStore;
            orgUnitRepository = new OrgUnitRepository(mockDb.db, q);
        }));

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
            orgUnitRepository.getAll().then(function(results) {
                expect(results).toEqual(orgUnits);
            });
            expect(mockOrgStore.getAll).toHaveBeenCalled();
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

        it("should get all modules for given org units", function() {
            var modules = [];
            var project1 = {
                'name': 'prj1',
                'displayName': 'prj1',
                'id': 'prj1',
                'parent': {
                    id: "cnt1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Project"
                }]
            };

            var project2 = {
                'name': 'prj2',
                'displayName': 'prj2',
                'id': 'prj2',
                'parent': {
                    id: "cnt1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Project"
                }]
            };

            var project3 = {
                'name': 'prj3',
                'displayName': 'prj3',
                'id': 'prj3',
                'parent': {
                    id: "cnt1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Project"
                }]
            };

            var module1 = {
                'name': 'mod1',
                'displayName': 'mod1',
                'id': 'mod1',
                'parent': {
                    id: "prj1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Module"
                }]
            };

            var opunit1 = {
                'name': 'opunit1',
                'displayName': 'opunit1',
                'id': 'opunit1',
                'parent': {
                    id: "prj2"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Operation Unit"
                }]
            };

            var module2 = {
                'name': 'mod2',
                'displayName': 'mod2',
                'id': 'mod2',
                'parent': {
                    id: "opunit1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Module"
                }]
            };

            var module3 = {
                'name': 'mod3',
                'displayName': 'mod3',
                'id': 'mod3',
                'parent': {
                    id: "prj3"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Module"
                }]
            };
            var allOrgUnits = [project1, project2, project3, module1, module2, module3, opunit1];
            mockDb = utils.getMockDB(q, {}, allOrgUnits);

            orgUnitRepository = new OrgUnitRepository(mockDb.db, q);
            scope.$apply();
            orgUnitRepository.getAllModulesInProjects(["prj1", "prj2"]).then(function(userModules) {
                modules = userModules;
            });

            scope.$apply();

            expect(modules).toEqual([module1, module2]);
        });
    });
});