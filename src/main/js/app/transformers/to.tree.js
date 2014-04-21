define(["lodash"], function(_) {
    return function(orgUnits, selectedNodeId) {
        var groupedOrgUnits = _.groupBy(orgUnits, 'level');
        var sortedLevels = _.sortBy(_.keys(groupedOrgUnits), parseInt);
        var selectedNode;
        var allOrgUnits = _.reduceRight(sortedLevels, function(everyOne, level) {
            var withChildren = function(parent) {
                var isLegitimateChild = function(item) {
                    return item.parent && item.parent.id === parent.id;
                };
                parent.children = _.filter(everyOne, isLegitimateChild);
                return parent;
            };

            var setSelectedNode = function(node) {
                if (selectedNodeId && selectedNodeId === node.id) {
                    node.selected = true;
                    selectedNode = node;
                }
                return node;
            };

            var orgUnitsInThisLevel = groupedOrgUnits[level];
            var completeOrgUnits = _.map(orgUnitsInThisLevel, _.compose(setSelectedNode, withChildren));
            return everyOne.concat(completeOrgUnits);
        }, []);

        var rootNodes = _.filter(allOrgUnits, function(u) {
            return u.level === parseInt(sortedLevels[0]);
        });

        return {
            "rootNodes": rootNodes,
            "selectedNode": selectedNode
        };
    };
});