define([], function() {
    return function(orgUnits) {
        var groupedOrgUnits = _.groupBy(orgUnits, 'level');
        var sortedLevels = _.sortBy(_.keys(groupedOrgUnits), parseInt);
        var allOrgUnits = _.reduceRight(sortedLevels, function(everyOne, level) {
            var withChildren = function(parent) {
                var isLegitimateChild = function(item) {
                    return item.parent && item.parent.id === parent.id;
                };
                parent.children = _.filter(everyOne, isLegitimateChild);
                return parent;
            };

            var orgUnitsInThisLevel = groupedOrgUnits[level];
            var completeOrgUnits = _.map(orgUnitsInThisLevel, withChildren);
            return everyOne.concat(completeOrgUnits);
        }, []);

        return _.filter(allOrgUnits, function(u) {
            return u.level === parseInt(sortedLevels[0]);
        });
    };
});