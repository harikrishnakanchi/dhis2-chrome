define(["projectsController", "angularMocks", "utils", "lodash"], function(ProjectsController, mocks, utils, _) {
    describe("projects controller", function() {
        var q, db, scope, mockOrgStore, mockOrgUnitLevelStore, allOrgUnits, projectsService, projectsController, parent;
        var getOrgUnit = function(id, name, level, parent) {
            return {
                'id': id,
                'name': name,
                'level': level,
                'parent': parent
            };
        };

        var orgUnitLevels = [{
            'level': 1,
            'name': 'Company'
        }, {
            'level': 2,
            'name': 'Operational Center'
        }, {
            'level': 3,
            'name': 'Country'
        }, {
            'level': 4,
            'name': 'Project'
        }];

        var expectedOrgUnitTree = [{
            'id': 1,
            'name': 'msf',
            'level': 1,
            'parent': null,
            'children': [{
                'id': 2,
                'name': 'ocp',
                'level': 2,
                'parent': {
                    id: 1
                },
                'children': []
            }]
        }];

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            allOrgUnits = [getOrgUnit(1, 'msf', 1, null), getOrgUnit(2, 'ocp', 2, {
                id: 1
            })];
            scope = $rootScope.$new();
            mockOrgStore = {
                getAll: function() {}
            };
            mockOrgUnitLevelStore = {
                getAll: function() {}
            };
            var stores = {
                "organisationUnits": mockOrgStore,
                "organisationUnitLevels": mockOrgUnitLevelStore
            };
            db = {
                objectStore: function(store) {
                    return stores[store];
                }
            };
            projectsService = {
                "create": function() {}
            };
            spyOn(mockOrgStore, 'getAll').and.returnValue(utils.getPromise(q, allOrgUnits));
            spyOn(mockOrgUnitLevelStore, 'getAll').and.returnValue(utils.getPromise(q, orgUnitLevels));
            projectsController = new ProjectsController(scope, db, projectsService, q);

            parent = {
                'level': 1,
                'name': 'Name1',
                'id': 'Id1'
            };
        }));

        it("should fetch and display all organisation units", function() {
            scope.$apply();

            expect(mockOrgStore.getAll).toHaveBeenCalled();
            expect(scope.organisationUnits).toEqual(expectedOrgUnitTree);
            expect(scope.openCreateForm).toEqual(false);
        });

        it("should get organization unit level mapping", function() {
            scope.$apply();

            expect(mockOrgUnitLevelStore.getAll).toHaveBeenCalled();
            expect(scope.orgUnitLevelsMap).toEqual({
                1: 'Company',
                2: 'Operational Center',
                3: 'Country',
                4: 'Project'
            });
        });

        it("should show the selected organisation unit details", function() {
            var orgUnit = {
                'id': 1
            };
            scope.openCreateForm = true;
            scope.onOrgUnitSelect(orgUnit);

            scope.$apply();

            expect(scope.orgUnit).toEqual(orgUnit);
            expect(scope.openCreateForm).toEqual(false);
        });

        it("should save organization unit in dhis", function() {
            var orgUnit = {
                'id': 2,
                'name': 'Org1'
            };

            spyOn(projectsService, 'create').and.returnValue(utils.getPromise(q, {}));

            scope.save(orgUnit, parent);
            scope.$apply();

            expect(projectsService.create).toHaveBeenCalledWith(orgUnit);
            expect(orgUnit.level).toEqual(2);
            expect(orgUnit.shortName).toBe('Org1');
            expect(orgUnit.parent).toEqual(_.pick(parent, "name", "id"));
            expect(scope.saveSuccess).toEqual(true);
        });

        it("should display error if saving organization unit fails", function() {
            var orgUnit = {
                'id': 1
            };
            spyOn(projectsService, 'create').and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save(orgUnit, parent);
            scope.$apply();

            expect(projectsService.create).toHaveBeenCalledWith(orgUnit);
            expect(scope.saveSuccess).toEqual(false);
        });

        it("should get child level", function() {
            scope.$apply();

            expect(scope.getNextLevel({
                'level': 1
            })).toEqual("Operational Center");
            expect(scope.getNextLevel({
                'level': 0
            })).toEqual("Company");
            expect(scope.getNextLevel({
                'level': 4
            })).toEqual(undefined);
            expect(scope.getNextLevel()).toEqual(undefined);
        });

        it("should allow user to only create new country or project", function() {
            scope.$apply();

            expect(scope.canCreateChild({
                'level': 1
            })).toEqual(false);
            expect(scope.canCreateChild({
                'level': 2
            })).toEqual(true);
            expect(scope.canCreateChild({
                'level': 3
            })).toEqual(true);
            expect(scope.canCreateChild({
                'level': 4
            })).toEqual(false);
        });
    });
});