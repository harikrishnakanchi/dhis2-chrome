define(["moment"], function(moment) {
    var mapToDomain = function(dataValueSets, period, orgUnit, storedBy) {
        var dataValues = _.map(dataValueSets, function(dataValues, dataSet) {
            return _.map(dataValues, function(values, dataElement) {
                return _.map(values, function(dataValue, categoryOptionComboId) {
                    return {
                        "dataElement": dataElement,
                        "period": period,
                        "dataset": dataSet,
                        "orgUnit": orgUnit,
                        "storedBy": storedBy,
                        "categoryOptionCombo": categoryOptionComboId,
                        "formula": dataValue.formula,
                        "value": dataValue.value,
                        "lastUpdated": new Date().toISOString()
                    };
                });
            });
        });
        var resultValues = _.flatten(dataValues, false);
        var nonEmptyValues = _.filter(resultValues, function(de) {
            return de.value !== "";
        });
        return {
            "dataValues": nonEmptyValues
        };
    };

    var mapToView = function(data) {
        var dataGroupedByDataSet = _.groupBy(data.dataValues, 'dataset');
        return _.mapValues(dataGroupedByDataSet, function(dataValues) {
            var dataValuesGroupedByElement = _.groupBy(dataValues, 'dataElement');
            return _.mapValues(dataValuesGroupedByElement, function(values) {
                return _.transform(values, function(acc, v) {
                    acc[v.categoryOptionCombo] = {
                        formula: v.formula || v.value,
                        value: v.value
                    };
                }, {});
            });
        });
    };

    return {
        "mapToView": mapToView,
        "mapToDomain": mapToDomain
    };
});