define(["projectsController", "angularMocks", "utils"], function(ProjectsController, mocks, utils) {
    describe("projects controller", function() {
        var q, db, scope, mockStore, allOrgUnits;
        var getOrgUnit = function(id, name, level, parent) {
            return {
                'id': id,
                'name': name,
                'level': level,
                'parent': parent
            };
        };
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
            db = {
                objectStore: function() {}
            };
            allOrgUnits = [getOrgUnit(1, 'msf', 1, null), getOrgUnit(2, 'ocp', 2, {
                id: 1
            })];
            scope = $rootScope.$new();

            mockStore = {
                getAll: function() {}
            };

            spyOn(db, 'objectStore').and.returnValue(mockStore);
            spyOn(mockStore, 'getAll').and.returnValue(utils.getPromise(q, allOrgUnits));
        }));

        it("should fetch and display all organisation units", function() {
            var projectsController = new ProjectsController(scope, db);
            scope.$apply();

            expect(scope.organisationUnits).toEqual(expectedOrgUnitTree);
        });


        it("should show the selected organisation unit details", function() {
            var orgUnit = {
                'id': 1
            };
            var projectsController = new ProjectsController(scope, db);

            scope.onOrgUnitSelect(orgUnit);
            scope.$apply();

            expect(scope.orgUnit).toEqual(orgUnit);
        });
    });
});