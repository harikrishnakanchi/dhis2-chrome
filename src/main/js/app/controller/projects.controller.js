define([], function() {
    return function($scope, db) {
        var thyself = function(me) {
            return me;
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var transformOrgUnitsToTree = function(orgUnits) {
            var groupedOrgUnits = _.groupBy(orgUnits, 'level');
            var sortedLevels = _.sortBy(_.keys(groupedOrgUnits), _.compose(parseInt, thyself));
            var allOrgUnits = _.reduceRight(sortedLevels, function(everyOne, level) {
                var withChildren = function(u) {
                    var isLegitimateChild = function(item) {
                        return item.parent && item.parent.id === u.id;
                    };
                    u.children = _.filter(everyOne, isLegitimateChild);
                    return u;
                };

                var orgUnitsInThisLevel = groupedOrgUnits[level];
                var completeOrgUnits = _.map(orgUnitsInThisLevel, withChildren);
                return everyOne.concat(completeOrgUnits);
            }, []);

            $scope.organisationUnits = _.filter(allOrgUnits, function(u) {
                return u.level === parseInt(sortedLevels[0]);
            });
        };

        var init = function() {
            getAll("organisationUnits").then(transformOrgUnitsToTree);
        };

        init();
    };
});