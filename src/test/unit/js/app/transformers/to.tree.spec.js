define(["toTree", "lodash"], function (toTree, _) {
    describe("to tree", function () {
        var rootOrgUnit, opCenterOrgUnit, countryOrgUnit, projectOrgUnit, opunit1OrgUnit, opunit2OrgUnit;

        beforeEach(function () {
            var getOrgUnit = function (id, name, level, parent) {
                return {
                    'id': id,
                    'name': name,
                    'level': level,
                    'parent': parent
                };
            };
            rootOrgUnit = getOrgUnit(1, 'msf', 1, null);
            opCenterOrgUnit = getOrgUnit(2, 'ocp', 2, {id: 1});
            countryOrgUnit = getOrgUnit(3, 'ctry1', 3, {id: 2});
            projectOrgUnit = getOrgUnit(4, 'prj1', 4, {id: 3});
            opunit1OrgUnit = getOrgUnit(5, 'opUnit1', 5, {id: 4});
            opunit2OrgUnit = getOrgUnit(6, 'opUnit2', 5, {id: 4});
        });

        it("should convert plain old boring organisation units to more interesting tree structure", function () {
            var orgUnits = [rootOrgUnit, opCenterOrgUnit, countryOrgUnit];
            var tree = toTree(orgUnits, rootOrgUnit.id);

            var expectedOrgUnitTree = [{
                "id": 1,
                "name": "msf",
                "level": 1,
                "parent": null,
                "children": [{
                    "id": 2,
                    "name": "ocp",
                    "level": 2,
                    "parent": {"id": 1},
                    "children": [{
                        "id": 3,
                        "name": "ctry1",
                        "level": 3,
                        "parent": {"id": 2},
                        "children": [],
                        "selected": false,
                        "collapsed": true
                    }],
                    "selected": false,
                    "collapsed": true
                }],
                "selected": true,
                "collapsed": false
            }];
            expect(tree.rootNodes).toEqual(expectedOrgUnitTree);
            expect(tree.selectedNode).toEqual(rootOrgUnit);
        });

        it("should handle orgUnits with missing parent node", function () {
            var projectAndDescendantOrgUnits = [projectOrgUnit, opunit1OrgUnit, opunit2OrgUnit];
            var tree = toTree(projectAndDescendantOrgUnits, opunit1OrgUnit.id);

            var expectedOrgUnitTree = [{
                "id": 4,
                "name": "prj1",
                "level": 4,
                "parent": {"id": 3},
                "children": [{
                    "id": 5,
                    "name": "opUnit1",
                    "level": 5,
                    "parent": {"id": 4},
                    "children": [],
                    "selected": true,
                    "collapsed": false
                }, {
                    "id": 6,
                    "name": "opUnit2",
                    "level": 5,
                    "parent": {"id": 4},
                    "children": [],
                    "selected": false,
                    "collapsed": true
                }],
                "selected": false,
                "collapsed": false
            }];
            expect(tree.rootNodes).toEqual(expectedOrgUnitTree);
            expect(tree.selectedNode).toEqual(opunit1OrgUnit);
        });


        it("should select and expand node with the given id", function () {
            var orgUnits = [rootOrgUnit, opCenterOrgUnit, countryOrgUnit];
            var tree = toTree(orgUnits, opCenterOrgUnit.id);
            var expectedOrgUnit = {
                id: 2,
                name: 'ocp',
                level: 2,
                parent: {
                    id: 1
                },
                children: [countryOrgUnit],
                selected: true,
                collapsed: false
            };
            expect(tree.selectedNode).toEqual(expectedOrgUnit);
        });

        it("should expand parents of selected node", function () {
            var orgUnits = [rootOrgUnit, opCenterOrgUnit, countryOrgUnit];
            var tree = toTree(orgUnits, opCenterOrgUnit.id);

            var msfNode = tree.rootNodes[0];
            var ocpNode = tree.rootNodes[0].children[0];
            var countryNode = tree.rootNodes[0].children[0].children[0];

            expect(msfNode.collapsed).toEqual(false);
            expect(ocpNode.collapsed).toEqual(false);
            expect(countryNode.collapsed).toEqual(true);
        });

    });
});