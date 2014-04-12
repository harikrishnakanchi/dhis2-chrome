define(["lodash"], function(_) {
    return function($http) {

        var getPayload = function(dataValues, period) {
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
                "period": period,
                "orgUnit": "company_0",
                "dataValues": resultValues
            };
        };

        this.save = function(dataValues, period) {
            return $http({
                url: '/dhis/api/dataValueSets',
                method: "POST",
                data: getPayload(dataValues, period),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        };
    };
});