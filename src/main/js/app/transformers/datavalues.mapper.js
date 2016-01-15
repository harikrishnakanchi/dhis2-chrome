define(["moment"], function(moment) {
    var mapToDomain = function(dataValues, period, storedBy) {
        var resultValues = _.flatten(_.map(dataValues, function(l1values, orgUnit) {
            return _.map(l1values, function(l2values, dataElement) {
                return _.map(l2values, function(dataValue, categoryOptionComboId) {
                    return {
                        "dataElement": dataElement,
                        "period": moment(period, "GGGG[W]W").format("GGGG[W]WW"),
                        "orgUnit": orgUnit,
                        "storedBy": storedBy,
                        "categoryOptionCombo": categoryOptionComboId,
                        "formula": dataValue.formula,
                        "value": dataValue.value
                    };
                });
            });
        }), true);
        var nonEmptyValues = _.filter(resultValues, function(de) {
            return de.value !== "";
        });
        return nonEmptyValues;
    };

    var mapToView = function(dataValues) {
        return _.reduce(dataValues, function(dataValues, v) {
            dataValues[v.orgUnit] = dataValues[v.orgUnit] || {};
            dataValues[v.orgUnit][v.dataElement] = dataValues[v.orgUnit][v.dataElement] || {};
            dataValues[v.orgUnit][v.dataElement][v.categoryOptionCombo] = {
                formula: v.formula || v.value,
                value: v.value,
                existingValue: true
            };
            return dataValues;
        }, {});
    };

    return {
        "mapToView": mapToView,
        "mapToDomain": mapToDomain
    };
});
