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

        return {
            "create": create,
            "getAssociatedDatasets": getAssociatedDatasets
        };
    };
});