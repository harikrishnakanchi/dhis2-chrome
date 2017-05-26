define(["dhisUrl", "lodash", "moment", "dateUtils", "properties"], function(dhisUrl, _, moment, dateUtils, properties) {
    return function($http, $q) {
        var ORG_UNIT_DIMENSION = 'ou',
            PERIOD_DIMENSION = 'pe';

        this.getReportDataForOrgUnit = function(report, orgUnit) {
            var orgUnits = _.isArray(orgUnit) ? orgUnit : [orgUnit];

            var generatePeriodForYearlyReport = function () {
                var numberOfMonthsInCurrentYear = parseInt(moment().format('M'));
                var numberOfMonthsForYearlyReport = (properties.projectDataSync.numYearsToSyncYearlyReports * 12) + numberOfMonthsInCurrentYear;
                return dateUtils.getPeriodRangeInMonths(numberOfMonthsForYearlyReport, { excludeCurrent: false });
            };

            var buildDimensions = function (dimensionConfig, yearlyReport) {
                return _.map(dimensionConfig, function (config) {
                    var items;
                    switch (config.dimension) {
                        case ORG_UNIT_DIMENSION:
                            items = orgUnits;
                            break;
                        case PERIOD_DIMENSION:
                            items = yearlyReport ? generatePeriodForYearlyReport() : _.map(config.items, 'id');
                            break;
                        default:
                            items = _.map(config.items, 'id');
                    }
                    return config.dimension + ":" + items.join(';');
                });
            };

            var config = {
                params: {
                    dimension: _.flatten([
                        buildDimensions(report.columns, report.yearlyReport || report.yearlyChart),
                        buildDimensions(report.rows, report.yearlyReport || report.yearlyChart)
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
                    'filter': ['name:like:[Praxis - '],
                    'paging': false,
                    'fields': 'id'
                }
            };
            if (lastUpdatedTime) {
                config.params.filter.push('lastUpdated:gte:' + lastUpdatedTime);
            }

            return $http.get(resourceUrl + '.json', config)
                .then(function (response) {
                    return _.map(response.data[resourceCollectionName], 'id');
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
            var requiredFields = 'id,name,title,translations,relativePeriods,type,' +
                                 'categoryDimensions[dataElementCategory,categoryOptions[:identifiable]],' +
                                 'dataDimensionItems[dataElement[id,name,shortName,description],indicator[id,name,shortName,description],programIndicator[id,name,shortName,description]],' +
                                 'columns[dimension,items[id,name]],' +
                                 'rows[dimension,items[id,name]],' +
                                 'filters[dimension,items[id]]';
            return getResourceIds(dhisUrl.charts, 'charts', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.charts, requiredFields));
        };

        this.getAllChartIds = function() {
            return getResourceIds(dhisUrl.charts, 'charts');
        };

        this.getUpdatedPivotTables = function(lastUpdatedTime) {
            var requiredFields = 'id,name,title,translations,sortOrder,relativePeriods,' +
                                 'categoryDimensions[dataElementCategory,categoryOptions[:identifiable]],' +
                                 'dataDimensionItems[dataElement[id,name,shortName,description],indicator[id,name,shortName,description],programIndicator[id,name,shortName,description]],' +
                                 'columns[dimension,items[id,name]],' +
                                 'rows[dimension,items[id,name]],' +
                                 'filters[dimension,items[id]]';
            return getResourceIds(dhisUrl.pivotTables, 'reportTables', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.pivotTables, requiredFields));
        };

        this.getAllPivotTableIds = function() {
            return getResourceIds(dhisUrl.pivotTables, 'reportTables');
        };

        this.getUpdatedEventReports = function (lastUpdatedTime) {
            var requiredFields = 'id,name,translations,sortOrder,relativePeriods,program,programStage,' +
                'dataElementDimensions[filter,legendSet[id],dataElement[id,optionSet[id],legendSet[id]]],' +
                'columns[dimension,items[id,name]],rows[dimension,items[id,name]],filters[dimension,items[id,name]]';
            return getResourceIds(dhisUrl.eventReports, 'eventReports', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.eventReports, requiredFields));
        };

        this.getAllEventReportIds = function () {
            return getResourceIds(dhisUrl.eventReports, 'eventReports');
        };
    };
});
