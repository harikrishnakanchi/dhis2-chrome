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

        return {
            'get': get,
            'save': save,
            'getCurrentUsersUsername': getCurrentUsersUsername,
            'getCurrentUsersProjectIds': getCurrentUsersProjectIds,
            'getCurrentUsersModules': getCurrentUsersModules,
            'getCurrentUsersPreferences': getCurrentUsersPreferences
        };
    };
});
