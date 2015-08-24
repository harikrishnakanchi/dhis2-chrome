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

        var getUserModules = function() {
            return getAll().then(function(userPreferences) {
                userPreferences = userPreferences || [];
                var userOrgUnitIds = _.uniq(_.pluck(_.flatten(_.pluck(userPreferences, "organisationUnits")), "id"));

                if (_.isEmpty(userOrgUnitIds))
                    return [];

                return orgUnitRepository.getAllModulesInOrgUnits(userOrgUnitIds).then(function(userModules) {
                    return userModules;
                });
            });
        };

        var getCurrentUserOperationalUnits = function() {
            return getAll().then(function(userPreferences) {
                var currentUserPreferences = _.last(_.sortBy(userPreferences, "lastUpdated"));
                var orgUnitIds = _.pluck(currentUserPreferences.organisationUnits, "id");

                if (_.isEmpty(orgUnitIds))
                    return [];

                return orgUnitRepository.getAllOpUnitsInOrgUnits(orgUnitIds);
            });
        };

        var getOriginOrgUnitIds = function() {
            return getUserModules().then(function(modules) {
                var moduleIds = _.pluck(modules, "id");
                return orgUnitRepository.findAllByParent(moduleIds).then(function(originOrgUnits) {
                    return _.pluck(originOrgUnits, "id");
                });
            });
        };

        return {
            "get": get,
            "getAll": getAll,
            "save": save,
            "getUserModules": getUserModules,
            "getOriginOrgUnitIds": getOriginOrgUnitIds,
            "getCurrentUserOperationalUnits": getCurrentUserOperationalUnits
        };
    };
});
