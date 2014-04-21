define(["toTree"], function(toTree) {
    describe("to tree", function() {
        var getOrgUnit, expectedOrgUnitTree, allOrgUnits, child;

        beforeEach(function() {
            getOrgUnit = function(id, name, level, parent) {
                return {
                    'id': id,
                    'name': name,
                    'level': level,
                    'parent': parent
                };
            };
            child = {
                'id': 2,
                'name': 'ocp',
                'level': 2,
                'parent': {
                    id: 1
                },
                'children': []
            };
            expectedOrgUnitTree = [{
                'id': 1,
                'name': 'msf',
                'level': 1,
                'parent': null,
                'children': [child]
            }];
            allOrgUnits = [getOrgUnit(1, 'msf', 1, null), getOrgUnit(2, 'ocp', 2, {
                id: 1
            })];
        });

        it("should convert plain old boring organisation units to more interesting tree structure", function() {
            var tree = toTree(allOrgUnits, undefined);
            expect(tree.rootNodes).toEqual(expectedOrgUnitTree);
            expect(tree.selectedNode).toEqual(undefined);
        });

        it("should select node with the given id", function() {
            var tree = toTree(allOrgUnits, 2);

            child.selected = true;
            expect(tree.selectedNode).toEqual(child);
        });
    });
});