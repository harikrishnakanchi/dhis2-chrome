define(["moment"], function(moment) {
    var mapToDomain = function(dataValues, period, orgUnit, storedBy) {
        var resultValues = _.flatten(_.map(dataValues, function(values, dataElement) {
            return _.map(values, function(dataValue, categoryOptionComboId) {
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
        }), true);
        var nonEmptyValues = _.filter(resultValues, function(de) {
            return de.value !== "";
        });
        return nonEmptyValues;
    };

    var mapToView = function(dataValues) {
        return _.reduce(dataValues, function(dataValues, v) {
            dataValues[v.dataElement] = dataValues[v.dataElement] || {};
            dataValues[v.dataElement][v.categoryOptionCombo] = {
                formula: v.formula || v.value,
                value: v.value
            };
            return dataValues;
        }, {});
    };

    return {
        "mapToView": mapToView,
        "mapToDomain": mapToDomain
    };
});
