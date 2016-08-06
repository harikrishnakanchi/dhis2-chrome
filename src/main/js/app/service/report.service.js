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
            var config = {
                params: {
                    'filter': ['name:like:[FieldApp - '],
                    'paging': false,
                    'fields': 'id'
                }
            };

            if(lastUpdatedTime) {
                config.params.filter.push('lastUpdated:gte:' + lastUpdatedTime);
            }

            return $http.get(resourceUrl + '.json', config).then(function(response) {
                return _.pluck(response.data[resourceCollectionName], 'id');
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
            var requiredFields = 'id,name,title,relativePeriods,type,columns[dimension,filter,items[id,name,description]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]';
            return getResourceIds(dhisUrl.charts, 'charts', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.charts, requiredFields));
        };

        this.getAllChartIds = function() {
            return getResourceIds(dhisUrl.charts, 'charts');
        };

        this.getUpdatedPivotTables = function(lastUpdatedTime) {
            var requiredFields = 'id,name,sortOrder,categoryDimensions[dataElementCategory,categoryOptions[:identifiable]],dataElements,indicators,dataDimensionItems,relativePeriods,columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name,description]],filters[dimension,filter,items[id,name]]';
            return getResourceIds(dhisUrl.pivotTables, 'reportTables', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.pivotTables, requiredFields));
        };

        this.getAllPivotTableIds = function() {
            return getResourceIds(dhisUrl.pivotTables, 'reportTables');
        };
    };
});
