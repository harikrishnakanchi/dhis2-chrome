define(['lodash'], function(_) {
    var VALUE_HEADER = 'value',
        DATA_DIMENSION_NAME_SEPARATOR = ' - ',
        NOT_SPECIFIED_ORG_UNIT_NAME = 'Not Specified';

    var PivotTableData = function(definition, data) {
        var _this = this;

        this.title = definition.title;
        this.dataSetCode = definition.dataSetCode;
        this.displayPosition = definition.displayPosition;
        this.weeklyReport = definition.weeklyReport;
        this.monthlyReport = definition.monthlyReport;
        this.sortAscending = definition.sortAscending;
        this.sortDescending = definition.sortDescending;
        this.sortable = definition.sortable;

        this.dataValues = mapDataValues(data.headers, data.rows, getExcludedCategoryOptionIds(definition));
        this.isTableDataAvailable = !_.isEmpty(this.dataValues);
        this.rows = mapRows(definition, data, this.dataValues);
        this.columns = mapColumns(definition, data, this.dataValues);
        this.columnConfigurations = transformColumns(this.columns);

        this.getDataValue = function (row, column) {
            var dataValue = _.find(_this.dataValues, _.merge({}, row.dataValuesFilter, column.dataValuesFilter));
            return dataValue && dataValue.value;
        };

        this.getTotalOfDataValues = function (row, column) {
            var dataValues = _.filter(_this.dataValues, _.merge({}, row.dataValuesFilter, column.dataValuesFilter)),
                eligibleDataValues = _.reject(dataValues, { excludedFromTotals: true });
            return _.isEmpty(eligibleDataValues) ? null : _.sum(eligibleDataValues, 'value');
        };

        this.getDisplayName = function (item) {
            if(item.dataDimension) {
                //TODO: Remove this formatting of names after we complete transition to using formName for dataElement and shortName for indicators
                var itemName = item.name && _.first(item.name.split(DATA_DIMENSION_NAME_SEPARATOR)),
                    itemShortName = item.shortName && _.first(item.shortName.split(DATA_DIMENSION_NAME_SEPARATOR));

                return item.formName || itemShortName || itemName;
            } else {
                return item.name;
            }
        };
    };

    var mapDataValues = function (headers, rows, excludedCategoryOptionIds) {
        var dataValueIsExcludedFromTotals = function (row) {
            return _.any(row, function (rowItems) {
                return _.contains(excludedCategoryOptionIds, rowItems);
            });
        };

        return _.map(rows, function (row) {
            var dataValueObject = _.transform(headers, function (dataValueObject, header, index) {
                dataValueObject[header.name] = header.name == VALUE_HEADER ? parseFloat(row[index]) : row[index] ;
            }, {});
            return dataValueIsExcludedFromTotals(row) ? _.merge(dataValueObject, { excludedFromTotals: true }) : dataValueObject;
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
                return item.dataElement || item.indicator || item.programIndicator;
            });
            var mappedItems = _.map(dimensionConfiguration.items, function (item) {
                var dataDimensionItem = _.find(dataDimensionItems, { id: item.id });
                //TODO: Remove item.description once all Praxis instances have re-downloaded all pivotTables (probably after 7.1 release).
                return _.merge(_.pick(item, 'description'),{
                    id: item.id,
                    name: item.name,
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: item.id
                    }
                }, dataDimensionItem);
            });
            return filterItemsWithDataValues(mappedItems, dataValues);
        },
        ou: function (definition, data, dataValues) {
            var isNotSpecifiedOrgUnit = function (orgUnit) {
                return orgUnit.name == NOT_SPECIFIED_ORG_UNIT_NAME;
            };

            var mappedOrgUnits = _.map(data.metaData.ou, function (orgUnitId) {
                return {
                    id: orgUnitId,
                    name: data.metaData.names[orgUnitId],
                    orgUnitDimension: true,
                    dataValuesFilter: {
                        ou: orgUnitId
                    }
                };
            });
            return _.sortByOrder(filterItemsWithDataValues(mappedOrgUnits, dataValues), [isNotSpecifiedOrgUnit, 'name']);
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
                var categoryOption = _.find(categoryOptions, { id: item.id });

                return _.merge(categoryOption, {
                    id: item.id,
                    categoryDimension: true,
                    dataValuesFilter: _.zipObject([dimensionConfiguration.dimension], [item.id])
                });
            });
        }
    };

    var getExcludedCategoryOptionIds = function(definition) {
        var allCategoryOptions = _.flatten(_.map(definition.categoryDimensions, 'categoryOptions'));
        return _.map(_.filter(allCategoryOptions, function (categoryOption) {
            return _.endsWith(categoryOption.code, '_excludeFromTotal');
        }), 'id');
    };

    var isCategoryDimension = function (definition, dimensionId) {
        var categoryIds = _.map(definition.categoryDimensions, 'dataElementCategory.id');
        return _.includes(categoryIds, dimensionId);
    };

    var mapRows = function (definition, data, dataValues) {
        var rowConfiguration = _.first(definition.rows),
            dimensionId = rowConfiguration && rowConfiguration.dimension,
            mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId],
            mappedRows = mappingFunction ? mappingFunction(definition, data, dataValues, rowConfiguration) : [];

        return _.map(mappedRows, function (row, index) { return _.set(row, 'rowNumber', index + 1); });
    };

    var mapColumns = function (definition, data, dataValues) {
        var mappedColumns = _.map(definition.columns, function (columnConfiguration) {
            var dimensionId = columnConfiguration.dimension,
                mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId];

            return mappingFunction ? mappingFunction(definition, data, dataValues, columnConfiguration) : [];
        });

        return _.reject(mappedColumns, function (column) {
           return definition.geographicOriginReport && column.length == 1 && _.first(column).dataDimension;
        });
    };

    var transformColumns = function (columns) {
        return _.transform(columns, function (transformedColumns, thisColumn) {
            var previousColumn = _.last(transformedColumns);
            if(previousColumn) {
                var cartesianProductOfColumns = _.flatten(_.map(previousColumn, function (parentColumnItem) {
                    return _.map(thisColumn, function (columnItem) {
                        return _.merge({}, { dataValuesFilter: parentColumnItem.dataValuesFilter }, columnItem);
                    });
                }));
                transformedColumns.push(cartesianProductOfColumns);
            } else {
                transformedColumns.push(_.cloneDeep(thisColumn));
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