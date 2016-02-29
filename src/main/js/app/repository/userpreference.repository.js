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

        var getCurrentUsersProjectIds = function() {
            return getAll().then(function(userPreferences) {
                var currentUserPreferences = _.last(_.sortBy(userPreferences, "lastUpdated")) || {};
                return _.pluck(currentUserPreferences.organisationUnits, "id");
            });
        };

        var getCurrentUsersModules = function() {
            return getCurrentUsersProjectIds().then(function(currentProjectIds) {
                return orgUnitRepository.getAllModulesInOrgUnits(currentProjectIds).then(function(userModules) {
                    return userModules;
                });
            });
        };

        var getOriginOrgUnitIds = function() {
            return getCurrentUsersModules().then(function(modules) {
                var moduleIds = _.pluck(modules, "id");
                return orgUnitRepository.findAllByParent(moduleIds).then(function(originOrgUnits) {
                    return _.pluck(originOrgUnits, "id");
                });
            });
        };

        return {
            "get": get,
            "save": save,
            "getCurrentUsersProjectIds": getCurrentUsersProjectIds,
            "getCurrentUsersModules": getCurrentUsersModules,
            "getOriginOrgUnitIds": getOriginOrgUnitIds
        };
    };
});
