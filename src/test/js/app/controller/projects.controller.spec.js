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
        }));

        it("should fetch and display all organisation units", function() {
            spyOn(mockStore, 'getAll').and.returnValue(utils.getPromise(q, allOrgUnits));

            var projectsController = new ProjectsController(scope, db);
            scope.$apply();

            expect(scope.organisationUnits).toEqual([{
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
            }]);
        });
    });
});