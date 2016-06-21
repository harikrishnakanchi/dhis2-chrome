define(["lodash", "customAttributes"], function(_, CustomAttributes) {
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

        var getCurrentUsersPreferences = function() {
            return getAll().then(function(userPreferences) {
                var userPreferencesWithLastUpdated = _.filter(userPreferences, 'lastUpdated'),
                    mostRecentlyUpdatedUserPreference = _.last(_.sortBy(userPreferencesWithLastUpdated, 'lastUpdated'));
                return mostRecentlyUpdatedUserPreference || null;
            });
        };

        var getCurrentUsersUsername = function() {
            return getCurrentUsersPreferences().then(function(userPreference) {
                return (userPreference && userPreference.username) || null;
            });
        };

        var getCurrentUsersProjectIds = function() {
            return getCurrentUsersPreferences().then(function(userPreference) {
                return (userPreference && _.pluck(userPreference.organisationUnits, 'id')) || [];
            });
        };

        var getCurrentUsersModules = function() {
            return getCurrentUsersProjectIds().then(function(currentProjectIds) {
                return orgUnitRepository.getAllModulesInOrgUnits(currentProjectIds).then(function(userModules) {
                    return userModules;
                });
            });
        };

        var getCurrentUsersOriginOrgUnitIds = function() {
            return getFilteredCurrentUsersOriginOrgUnitIds();
        };

        var getCurrentUsersLineListOriginOrgUnitIds = function() {
            return getFilteredCurrentUsersOriginOrgUnitIds(function (module) {
                return CustomAttributes.parseAttribute(module.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
            });
        };

        var getFilteredCurrentUsersOriginOrgUnitIds = function(filterModules) {
            var getFilteredModules = function (modules) {
                if (filterModules) {
                    return _.filter(modules, filterModules);
                }
                return modules;
            };
            return getCurrentUsersModules()
                .then(getFilteredModules)
                .then(function (modules) {
                    var moduleIds = _.pluck(modules, "id");
                    return orgUnitRepository.findAllByParent(moduleIds).then(function (originOrgUnits) {
                        return _.pluck(originOrgUnits, "id");
                    });
                });
        };

        return {
            'get': get,
            'save': save,
            'getCurrentUsersUsername': getCurrentUsersUsername,
            'getCurrentUsersProjectIds': getCurrentUsersProjectIds,
            'getCurrentUsersModules': getCurrentUsersModules,
            'getCurrentUsersOriginOrgUnitIds': getCurrentUsersOriginOrgUnitIds,
            'getCurrentUsersLineListOriginOrgUnitIds': getCurrentUsersLineListOriginOrgUnitIds,
            'getCurrentUsersPreferences': getCurrentUsersPreferences
        };
    };
});
