define(['lodash'], function(_) {

    var PivotTableData = function(definition, data) {
        this.title = definition.title;
        this.dataSetCode = definition.dataSetCode;
        this.displayPosition = definition.displayPosition;
        this.dataValues = mapDataValues(data.headers, data.rows);
        this.rows = mapRows(definition, data);
        this.columns = mapColumns(definition, data);
    };

    var mapDataValues = function (headers, rows) {
        return _.map(rows, function (row) {
            return _.transform(headers, function (dataValueObject, header, index) {
                dataValueObject[header.name] = row[index];
            }, {});
        });
    };

    var DIMENSION_MAPPING_FUNCTIONS = {
        dx: function (definition, data, dimensionConfiguration) {
            var dataDimensionItems = _.map(definition.dataDimensionItems, function (item) {
                return item.dataElement || item.indicator;
            });
            return _.map(dimensionConfiguration.items, function (item) {
                var dataDimensionItem = _.find(dataDimensionItems, { id: item.id });
                return _.merge(dataDimensionItem, {
                    id: item.id,
                    dimension: 'dx'
                });
            });
        },
        ou: function (definition, data) {
            return _.map(data.metaData.ou, function (orgUnitId) {
                return {
                    id: orgUnitId,
                    name: data.metaData.names[orgUnitId],
                    dimension: 'ou'
                };
            });
        },
        pe: function (definition, data) {
            return _.map(data.metaData.pe, function (periodId) {
                return {
                    id: periodId,
                    name: data.metaData.names[periodId],
                    dimension: 'pe'
                };
            });
        },
        category: function (definition, data, dimensionConfiguration) {
            var categoryOptions = _.flatten(_.map(definition.categoryDimensions, 'categoryOptions'));
            return _.map(dimensionConfiguration.items, function (item) {
                var categoryOption = _.find(categoryOptions, { id: item.id });
                return _.merge(categoryOption, {
                    id: item.id,
                    dimension: dimensionConfiguration.dimension
                });
            });
        }
    };

    var isCategoryDimension = function (definition, dimensionId) {
        var categoryIds = _.map(definition.categoryDimensions, 'dataElementCategory.id');
        return _.includes(categoryIds, dimensionId);
    };

    var mapRows = function (definition, data) {
        var rowConfiguration = _.first(definition.rows),
            dimensionId = rowConfiguration && rowConfiguration.dimension,
            mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId];

        return mappingFunction ? mappingFunction(definition, data, rowConfiguration) : [];
    };

    var mapColumns = function (definition, data) {
        return _.map(definition.columns, function (columnConfiguration) {
            var dimensionId = columnConfiguration.dimension,
                mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId];

            return mappingFunction ? mappingFunction(definition, data, columnConfiguration) : [];
        });
    };

    PivotTableData.create = function () {
        var pivotTableData = Object.create(PivotTableData.prototype);
        PivotTableData.apply(pivotTableData, arguments);
        return pivotTableData;
    };

    return PivotTableData;
});