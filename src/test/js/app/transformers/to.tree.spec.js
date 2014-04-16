define(["toTree"], function(toTree) {
    describe("to tree", function() {
        it("should convert plain old boring organisation units to more interesting tree structure", function() {
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
                'type': 'Company',
                'children': [{
                    'id': 2,
                    'name': 'ocp',
                    'level': 2,
                    'type': 'Country',
                    'parent': {
                        id: 1
                    },
                    'children': []
                }]
            }];
            var orgUnitLevels = [{
                'name': 'Company',
                'level': 1
            }, {
                'name': 'Country',
                'level': 2
            }];
            var allOrgUnits = [getOrgUnit(1, 'msf', 1, null), getOrgUnit(2, 'ocp', 2, {
                id: 1
            })];

            expect(toTree(allOrgUnits, orgUnitLevels)).toEqual(expectedOrgUnitTree);
        });
    });
});