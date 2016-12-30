define(["dhisUrl", "lodash", "moment"], function(dhisUrl, _, moment) {
    return function($http, $q) {
        var ORG_UNIT_DIMENSION = 'ou';

        this.getReportDataForOrgUnit = function(report, orgUnit) {
            var orgUnits = _.isArray(orgUnit) ? orgUnit : [orgUnit];

            var buildDimensions = function (dimensionConfig) {
                return _.map(dimensionConfig, function (config) {
                    var items = config.dimension == ORG_UNIT_DIMENSION ? orgUnits : _.map(config.items, 'id');
                    return config.dimension + ":" + items.join(';');
                });
            };

            var config = {
                params: {
                    dimension: _.flatten([
                        buildDimensions(report.columns),
                        buildDimensions(report.rows)
                    ]),
                    filter: buildDimensions(report.filters),
                    lastUpdatedAt: moment().toISOString() //required for cache-busting purposes
                }
            };

            return $http.get(dhisUrl.analytics, config).then(function(response) {
                return response.data;
            });
        };

        var getResourceIds = function(resourceUrl, resourceCollectionName, lastUpdatedTime) {
            // TODO: [#2144] remove oldConfig with 'FieldApp' filter and retain only 'Praxis' much after 10.0
            var oldConfig = {
                params: {
                    'filter': ['name:like:[FieldApp - '],
                    'paging': false,
                    'fields': 'id'
                }
            };

            var newConfig = {
                params: {
                    'filter': ['name:like:[Praxis - '],
                    'paging': false,
                    'fields': 'id'
                }
            };

            if(lastUpdatedTime) {
                oldConfig.params.filter.push('lastUpdated:gte:' + lastUpdatedTime);
                newConfig.params.filter.push('lastUpdated:gte:' + lastUpdatedTime);
            }

            var resourceIds = [];
            return $http.get(resourceUrl + '.json', oldConfig)
                .then(function (response) {
                    resourceIds.push(_.map(response.data[resourceCollectionName], 'id'));
                    return $http.get(resourceUrl + '.json', newConfig);
                })
                .then(function (response) {
                    resourceIds.push(_.map(response.data[resourceCollectionName], 'id'));
                    return _.chain(resourceIds).flatten().uniq().value();
                });
        };

        var getResourceDetails = function(resourceUrl, requiredFields, resourceIds) {
            var downloadResource = function (id) {
                var config = { params: { fields: requiredFields } };

                return $http.get(resourceUrl + '/' + id + '.json', config).then(function (response) {
                    return response.data;
                });
            };

            var recursivelyLoopThroughResourceIds = function (ids, resources) {
                if(_.isEmpty(ids)) {
                    return $q.when(resources);
                }

                return downloadResource(ids.shift()).then(function (resource) {
                    resources.push(resource);
                    return recursivelyLoopThroughResourceIds(ids, resources);
                });
            };

            return recursivelyLoopThroughResourceIds(resourceIds, []);
        };

        this.getUpdatedCharts = function(lastUpdatedTime) {
            var requiredFields = 'id,name,title,relativePeriods,type,' +
                                 'categoryDimensions[dataElementCategory,categoryOptions[:identifiable]],' +
                                 'dataDimensionItems[dataElement[id,name,formName,description],indicator[id,name,shortName,description],programIndicator[id,name,shortName,description]],' +
                                 'columns[dimension,items[id,name]],' +
                                 'rows[dimension,items[id,name]],' +
                                 'filters[dimension,items[id]]';
            return getResourceIds(dhisUrl.charts, 'charts', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.charts, requiredFields));
        };

        this.getAllChartIds = function() {
            return getResourceIds(dhisUrl.charts, 'charts');
        };

        this.getUpdatedPivotTables = function(lastUpdatedTime) {
            var requiredFields = 'id,name,sortOrder,relativePeriods,' +
                                 'categoryDimensions[dataElementCategory,categoryOptions[:identifiable]],' +
                                 'dataDimensionItems[dataElement,indicator,programIndicator],' +
                                 'columns[dimension,items[id,name]],' +
                                 'rows[dimension,items[id,name]],' +
                                 'filters[dimension,items[id]]';
            return getResourceIds(dhisUrl.pivotTables, 'reportTables', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.pivotTables, requiredFields));
        };

        this.getAllPivotTableIds = function() {
            return getResourceIds(dhisUrl.pivotTables, 'reportTables');
        };
    };
});
