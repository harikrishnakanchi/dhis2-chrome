define(['lodash'], function(_) {

    var PivotTableData = function(definition, data) {
        this.title = definition.title;
        this.dataSetCode = definition.dataSetCode;
        this.displayPosition = definition.displayPosition;
        this.weeklyReport = definition.weeklyReport;
        this.monthlyReport = definition.monthlyReport;
        this.sortAscending = definition.sortAscending;
        this.sortDescending = definition.sortDescending;
        this.sortable = definition.sortable;

        this.dataValues = mapDataValues(data.headers, data.rows);
        this.isTableDataAvailable = !_.isEmpty(this.dataValues);
        this.rows = mapRows(definition, data, this.dataValues);
        this.columns = mapColumns(definition, data, this.dataValues);
    };

    var mapDataValues = function (headers, rows) {
        return _.map(rows, function (row) {
            return _.transform(headers, function (dataValueObject, header, index) {
                dataValueObject[header.name] = row[index];
            }, {});
        });
    };

    var filterItemsWithDataValues = function (items, dataValues) {
        return _.filter(items, function (item) {
            return _.any(dataValues, item.dataValuesFilter);
        });
    };

    var DIMENSION_MAPPING_FUNCTIONS = {
        dx: function (definition, data, dataValues, dimensionConfiguration) {
            var dataDimensionItems = _.map(definition.dataDimensionItems, function (item) {
                return item.dataElement || item.indicator;
            });
            var mappedItems = _.map(dimensionConfiguration.items, function (item) {
                var dataDimensionItem = _.find(dataDimensionItems, { id: item.id });
                //ToDo: Remove item.name and item.description once all Praxis instances have re-downloaded all pivotTables (probably after 8.0 release).
                return _.merge({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: item.id
                    }
                }, dataDimensionItem);
            });
            return filterItemsWithDataValues(mappedItems, dataValues);
        },
        ou: function (definition, data, dataValues) {
            var mappedOrgUnits = _.map(data.metaData.ou, function (orgUnitId) {
                return {
                    id: orgUnitId,
                    name: data.metaData.names[orgUnitId],
                    dataValuesFilter: {
                        ou: orgUnitId
                    }
                };
            });
            return filterItemsWithDataValues(mappedOrgUnits, dataValues);
        },
        pe: function (definition, data, dataValues) {
            var mappedPeriods = _.map(data.metaData.pe, function (periodId) {
                return {
                    id: periodId,
                    name: data.metaData.names[periodId],
                    periodDimension: true,
                    dataValuesFilter: {
                        pe: periodId
                    }
                };
            });
            return filterItemsWithDataValues(mappedPeriods, dataValues);
        },
        category: function (definition, data, dataValues, dimensionConfiguration) {
            var categoryOptions = _.flatten(_.map(definition.categoryDimensions, 'categoryOptions'));
            return _.map(dimensionConfiguration.items, function (item) {
                var categoryOption = _.find(categoryOptions, { id: item.id }),
                    dataValuesFilter = {};

                dataValuesFilter[dimensionConfiguration.dimension] = item.id;
                return _.merge(categoryOption, {
                    id: item.id,
                    dataValuesFilter: dataValuesFilter
                });
            });
        }
    };

    var isCategoryDimension = function (definition, dimensionId) {
        var categoryIds = _.map(definition.categoryDimensions, 'dataElementCategory.id');
        return _.includes(categoryIds, dimensionId);
    };

    var mapRows = function (definition, data, dataValues) {
        var rowConfiguration = _.first(definition.rows),
            dimensionId = rowConfiguration && rowConfiguration.dimension,
            mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId];

        return mappingFunction ? mappingFunction(definition, data, dataValues, rowConfiguration) : [];
    };

    var mapColumns = function (definition, data, dataValues) {
        var mappedColumns = _.map(definition.columns, function (columnConfiguration) {
            var dimensionId = columnConfiguration.dimension,
                mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId];

            return mappingFunction ? mappingFunction(definition, data, dataValues, columnConfiguration) : [];
        });

        return _.transform(mappedColumns, function (transformedColumns, thisColumn) {
            var previousColumn = _.last(transformedColumns);
            if(previousColumn) {
                var cartesianProductOfColumns = _.flatten(_.map(previousColumn, function (parentColumnItem) {
                    return _.map(thisColumn, function (columnItem) {
                        return _.merge({}, { dataValuesFilter: parentColumnItem.dataValuesFilter }, columnItem);
                    });
                }));
                transformedColumns.push(cartesianProductOfColumns);
            } else {
                transformedColumns.push(thisColumn);
            }
        }, []);
    };

    PivotTableData.create = function () {
        var pivotTableData = Object.create(PivotTableData.prototype);
        PivotTableData.apply(pivotTableData, arguments);
        return pivotTableData;
    };

    return PivotTableData;
});