define(['lodash'], function(_) {

    var PivotTableData = function(definition, data) {
        this.title = definition.title;
        this.dataSetCode = definition.dataSetCode;
        this.displayPosition = definition.displayPosition;
        this.dataValues = mapDataValues(data.headers, data.rows);
        this.rows = mapRows(definition, data);
    };

    var mapDataValues = function (headers, rows) {
        return _.map(rows, function (row) {
            return _.transform(headers, function (dataValueObject, header, index) {
                dataValueObject[header.name] = row[index];
            }, {});
        });
    };

    var mapRows = function (definition, data) {
        var mappingFunctions = {
            dx: function (rowConfiguration) {
                var dataDimensionItems = _.map(definition.dataDimensionItems, function (item) {
                    return item.dataElement || item.indicator;
                });
                return _.map(rowConfiguration.items, function (item) {
                    var dataDimensionItem = _.find(dataDimensionItems, { id: item.id });
                    return _.merge(dataDimensionItem, {
                        id: item.id,
                        dimension: 'dx'
                    });
                });
            },
            ou: function () {
                return _.map(data.metaData.ou, function (orgUnitId) {
                    return {
                        id: orgUnitId,
                        name: data.metaData.names[orgUnitId],
                        dimension: 'ou'
                    };
                });
            },
            pe: function () {
                return _.map(data.metaData.pe, function (periodId) {
                    return {
                        id: periodId,
                        name: data.metaData.names[periodId],
                        dimension: 'pe'
                    };
                });
            }
        };

        var rowConfiguration = _.first(definition.rows),
            dimensionId = rowConfiguration && rowConfiguration.dimension,
            mappingFunction = mappingFunctions[dimensionId];

        return mappingFunction ? mappingFunction(rowConfiguration) : [];
    };

    PivotTableData.create = function () {
        var pivotTableData = Object.create(PivotTableData.prototype);
        PivotTableData.apply(pivotTableData, arguments);
        return pivotTableData;
    };

    return PivotTableData;
});