define(["lodash"], function(_) {
    return function(db) {
        var upsert = function(systemSettings) {
            var store = db.objectStore("systemSettings");
            var payload = {
                "key": systemSettings.projectId,
                "value": systemSettings.settings
            };
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var getAllWithProjectId = function(parentId) {
            var store = db.objectStore("systemSettings");
            return store.find(parentId);
        };

        var get = function(moduleId) {
            var store = db.objectStore("systemSettings");
            return store.find(parentId);
        };

        var upsertDhisDownloadedData = function(settings) {
            var result = [];
            _.map(settings, function(value, key) {
                result.push({
                    "key": key,
                    "value": value
                });
            });
            var store = db.objectStore("systemSettings");
            return store.upsert(result).then(function() {
                return result;
            });
        };

        var findAll = function(orgUnitIds) {
            var store = db.objectStore("systemSettings");
            var query = db.queryBuilder().$in(orgUnitIds).compile();
            return store.each(query);
        };

        return {
            "upsert": upsert,
            "get": get,
            "findAll": findAll,
            "getAllWithProjectId": getAllWithProjectId,
            "upsertDhisDownloadedData": upsertDhisDownloadedData
        };
    };
});