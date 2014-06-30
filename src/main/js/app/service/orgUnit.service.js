define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {

        var create = function(orgUnitRequest) {
            return $http.post(properties.dhis.url + '/api/metadata', {
                'organisationUnits': orgUnitRequest
            });
        };

        var getAssociatedDatasets = function(orgUnit, datasets) {
            return _.filter(datasets, {
                'organisationUnits': [{
                    'id': orgUnit.id
                }]
            });
        };

        var getSystemSettings = function(parentId) {
            var store = db.objectStore("systemSettings");
            return store.find(parentId);
        };

        var getAll = function(orgUnitType) {
            var store = db.objectStore(orgUnitType);
            return store.getAll();
        };

        return {
            "create": create,
            "getAssociatedDatasets": getAssociatedDatasets,
            "getAll": getAll,
            "getSystemSettings": getSystemSettings
        };
    };
});