define(['lodash'], function (_) {
    return function (mergeBy) {

        var dataValuesEquals = function (dataValueA, dataValueB) {
            return dataValueA.dataElement === dataValueB.dataElement &&
                dataValueA.period === dataValueB.period &&
                dataValueA.orgUnit === dataValueB.orgUnit &&
                dataValueA.categoryOptionCombo === dataValueB.categoryOptionCombo;
        };

        var dataValuesAreEqual = function (dataValuesA, dataValuesB) {
            return dataValuesA.length === dataValuesB.length && _.all(dataValuesA, function (dataValueA) {
                    return _.any(dataValuesB, function (dataValueB) {
                        return dataValuesEquals(dataValueA, dataValueB) && dataValueA.value === dataValueB.value;
                    });
                });
        };

        var downloadedFromDhis = function(dataValue) {
            return !dataValue.clientLastUpdated;
        };

        this.create = function (praxisDataValues, updatedDhisDataValues) {
            updatedDhisDataValues = updatedDhisDataValues || [];
            praxisDataValues = praxisDataValues || [];

            var updatedDhisDataValuesExist = updatedDhisDataValues && updatedDhisDataValues.length > 0,
                mergedData = mergeBy.lastUpdated({eq: dataValuesEquals}, updatedDhisDataValues, praxisDataValues),
                praxisDataValuesAreUpToDate = updatedDhisDataValuesExist ? dataValuesAreEqual(praxisDataValues, mergedData) : true,
                dhisDataValuesAreUptoDate = _.all(mergedData, downloadedFromDhis);

            return {
                mergedData: mergedData,
                praxisAndDhisAreBothUpToDate: praxisDataValuesAreUpToDate && dhisDataValuesAreUptoDate,
                dhisIsUpToDateAndPraxisIsOutOfDate: dhisDataValuesAreUptoDate && !praxisDataValuesAreUpToDate,
                praxisAndDhisAreBothOutOfDate: !praxisDataValuesAreUpToDate && !dhisDataValuesAreUptoDate,
                updatedDhisDataValuesExist: !_.isEmpty(updatedDhisDataValues)
            };
        };
    };
});