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
                var userOrgUnitIds = _.uniq(_.pluck(_.flatten(_.pluck(userPreferences, "organisationUnits")), "id"));

                if (_.isEmpty(userOrgUnitIds))
                    return [];

                return orgUnitRepository.getAllModulesInOrgUnits(userOrgUnitIds).then(function(userModules) {
                    return _.pluck(userModules, "id");
                });
            });
        };

        var getOriginOrgUnitIds = function() {
            return getUserModuleIds().then(function(moduleIds) {
                return orgUnitRepository.findAllByParent(moduleIds).then(function(originOrgUnits) {
                    return _.pluck(originOrgUnits, "id");
                });
            });
        };

        return {
            "get": get,
            "getAll": getAll,
            "save": save,
            "getUserModuleIds": getUserModuleIds,
            "getOriginOrgUnitIds": getOriginOrgUnitIds
        };
    };
});
