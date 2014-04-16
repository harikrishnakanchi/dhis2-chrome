define(["lodash"], function(_) {
    return function(orgUnits, orgUnitLevels) {
        var groupedOrgUnits = _.groupBy(orgUnits, 'level');
        var sortedLevels = _.sortBy(_.keys(groupedOrgUnits), parseInt);
        var orgUnitLevelMap = _.transform(orgUnitLevels, function(result, orgUnitLevel) {
            result[orgUnitLevel.level] = orgUnitLevel.name;
        });
        var addOrgUnitsOfCurrentLevel = function(everyOne, level) {
            var withChildren = function(parent) {
                var isLegitimateChild = function(item) {
                    return item.parent && item.parent.id === parent.id;
                };
                parent.children = _.filter(everyOne, isLegitimateChild);
                return parent;
            };

            var withType = function(orgUnit) {
                orgUnit.type = orgUnitLevelMap[orgUnit.level];
                return orgUnit;
            };

            var orgUnitsInThisLevel = groupedOrgUnits[level];
            var completeOrgUnits = _.map(orgUnitsInThisLevel, _.compose(withType, withChildren));
            return everyOne.concat(completeOrgUnits);
        };

        var allOrgUnits = _.reduceRight(sortedLevels, addOrgUnitsOfCurrentLevel, []);
        return _.filter(allOrgUnits, function(u) {
            return u.level === parseInt(sortedLevels[0]);
        });
    };
});