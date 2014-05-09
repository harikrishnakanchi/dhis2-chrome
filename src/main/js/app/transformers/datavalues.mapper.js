define(["moment"], function(moment) {
    var mapToDomain = function(dataValues, period, orgUnit) {
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
            "completeDate": moment().format("YYYY-MM-DD"),
            "period": period,
            "orgUnit": orgUnit,
            "dataValues": resultValues
        };
    };

    var mapToView = function(data) {
        return _.reduce(data.dataValues, function(dataValues, v) {
            dataValues[v.dataElement] = dataValues[v.dataElement] || {};
            dataValues[v.dataElement][v.categoryOptionCombo] = v.value;
            return dataValues;
        }, {});
    };

    return {
        "mapToView": mapToView,
        "mapToDomain": mapToDomain
    };
});