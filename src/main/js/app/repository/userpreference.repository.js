define(["lodash"], function(_) {
    return function(db, orgUnitRepository) {
        var get = function(username) {
            var store = db.objectStore('userPreferences');
            return store.find(username);
        };

        var getAll = function() {
            var store = db.objectStore('userPreferences');
            return store.getAll();
        };

        var save = function(userPreferences) {
            var store = db.objectStore('userPreferences');
            return store.upsert(userPreferences);
        };

        var getUserModuleIds = function() {
            return getAll().then(function(userPreferences) {
                userPreferences = userPreferences || [];
                var userProjectIds = _.uniq(_.pluck(_.flatten(_.pluck(userPreferences, "orgUnits")), "id"));

                if (_.isEmpty(userProjectIds))
                    return [];

                return orgUnitRepository.getAllModulesInOrgUnits(userProjectIds).then(function(userModules) {
                    return _.pluck(userModules, "id");
                });
            });
        };

        return {
            "get": get,
            "getAll": getAll,
            "save": save,
            "getUserModuleIds": getUserModuleIds
        };
    };
});
