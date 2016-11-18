define(['lodash'], function (_) {
    var VALUE_HEADER = 'value',
        DATA_DIMENSION_NAME_SEPARATOR = ' - ',
        NOT_SPECIFIED_ORG_UNIT_NAME = 'Not Specified';

    var AnalyticsData = function (definition, data) {
        var _this = this;

        this.dataValues = mapDataValues(data.headers, data.rows, getExcludedCategoryOptionIds(definition));
        this.isDataAvailable = !_.isEmpty(this.dataValues);
        this.rows = mapRows(definition, data, this.dataValues);
        this.columns = mapColumns(definition, data, this.dataValues);

        this.getDataValue = function (row, column) {
            var dataValue = _.find(_this.dataValues, _.merge({}, row.dataValuesFilter, column.dataValuesFilter));
            return dataValue && dataValue.value;
        };

        this.dataValuesExist = function (dimensionItem) {
            return _.any(_this.dataValues, dimensionItem.dataValuesFilter);
        };

        this.getTotalOfDataValues = function (row, column) {
            var dataValues = _.filter(_this.dataValues, _.merge({}, row.dataValuesFilter, column.dataValuesFilter)),
                eligibleDataValues = _.reject(dataValues, { excludedFromTotals: true });
            return _.isEmpty(eligibleDataValues) ? null : _.sum(eligibleDataValues, 'value');
        };

        this.getDisplayName = function (item) {
            if(item.dataDimension) {
                var itemName = item.name;
                // In case of DataElement displayName should be formName if not there, fallback on name. So, we download only formName and name for dataelement
                // In case of Indicator displayName should be shortName if not there, fallback on name. So, we download only shortName and name for Indicator.
                return item.formName || item.shortName || itemName;
            } else {
                return item.name;
            }
        };
    };

    var getExcludedCategoryOptionIds = function(definition) {
        var allCategoryOptions = _.flatten(_.map(definition.categoryDimensions, 'categoryOptions'));
        return _.map(_.filter(allCategoryOptions, 'excludeFromTotal'), 'id');
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
            return dataValueIsExcludedFromTotals(row) ? _.set(dataValueObject, 'excludedFromTotals', true) : dataValueObject;
        });
    };


    var DIMENSION_MAPPING_FUNCTIONS = {
        dx: function (definition, data, dimensionConfiguration) {
            var dataDimensionItems = _.map(definition.dataDimensionItems, function (item) {
                return item.dataElement || item.indicator || item.programIndicator;
            });
            return _.map(dimensionConfiguration.items, function (item) {
                var dataDimensionItem = _.find(dataDimensionItems, { id: item.id });
                return _.merge({
                    id: item.id,
                    name: item.name,
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: item.id
                    }
                }, dataDimensionItem);
            });
        },
        ou: function (definition, data) {
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
            return _.sortByOrder(mappedOrgUnits, [isNotSpecifiedOrgUnit, 'name']);
        },
        pe: function (definition, data) {
            return _.map(data.metaData.pe, function (periodId) {
                return {
                    id: periodId,
                    name: data.metaData.names[periodId],
                    periodDimension: true,
                    dataValuesFilter: {
                        pe: periodId
                    }
                };
            });
        },
        category: function (definition, data, dimensionConfiguration) {
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

    var isCategoryDimension = function (definition, dimensionId) {
        var categoryIds = _.map(definition.categoryDimensions, 'dataElementCategory.id');
        return _.includes(categoryIds, dimensionId);
    };

    var mapRows = function (definition, data) {
        return _.map(definition.rows, function (rowConfiguration) {
            var dimensionId = rowConfiguration.dimension,
                mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId];

            return mappingFunction ? mappingFunction(definition, data, rowConfiguration) : [];
        });
    };

    var mapColumns = function (definition, data) {
        return _.map(definition.columns, function (columnConfiguration) {
            var dimensionId = columnConfiguration.dimension,
                mappingFunction = isCategoryDimension(definition, dimensionId) ? DIMENSION_MAPPING_FUNCTIONS.category : DIMENSION_MAPPING_FUNCTIONS[dimensionId];

            return mappingFunction ? mappingFunction(definition, data, columnConfiguration) : [];
        });
    };

    AnalyticsData.create = function () {
        var analyticsData = Object.create(AnalyticsData.prototype);
        AnalyticsData.apply(analyticsData, arguments);
        return analyticsData;
    };

    return AnalyticsData;

});