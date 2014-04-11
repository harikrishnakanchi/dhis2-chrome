define(["lodash"], function(_) {
    return function($http) {

        var getPayload = function(dataValues) {
            var resultValues = _.flatten(_.map(dataValues, function(values, dataElement) {
                return _.map(values, function(dataValue, categoryOptionComboId) {
                    return {
                        "dataElement": dataElement,
                        "categoryOptionCombo": categoryOptionComboId,
                        "value": dataValue
                    };
                });
            }), true);
            return {
                "completeDate": "2014-04-11",
                "period": "2014W14",
                "orgUnit": "company_0",
                "dataValues": resultValues
            };
        };

        this.save = function(dataValues) {
            return $http({
                url: '/api/dataValueSets',
                method: "POST",
                data: getPayload(dataValues),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        };
    };
});