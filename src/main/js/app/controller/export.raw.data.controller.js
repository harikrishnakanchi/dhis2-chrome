define(['lodash', 'dateUtils'], function (_, dateUtils) {
    return function($scope, $q, datasetRepository, excludedDataElementsRepository, moduleDataBlockFactory) {

        $scope.weeksToExportOptions = [{
            label: $scope.resourceBundle.lastOneWeek,
            value: 1
        }, {
            label: $scope.resourceBundle.lastFourWeeks,
            value: 4
        }, {
            label: $scope.resourceBundle.lastEightWeeks,
            value: 8
        }, {
            label: $scope.resourceBundle.lastTwelveWeeks,
            value: 12
        }];

        var createDataValuesMap = function (moduleDataBlocks) {
            var allDataValues = _.flatten(_.map(moduleDataBlocks, 'dataValues'));

            $scope.dataValuesMap = _.transform(allDataValues, function (map, dataValue) {
                map[dataValue.period] = map[dataValue.period] || {};
                map[dataValue.period][dataValue.dataElement] = map[dataValue.period][dataValue.dataElement] || 0;
                map[dataValue.period][dataValue.dataElement] += parseInt(dataValue.value);
            }, {});
        };

        var loadExcludedDataElementIds = function(module) {
            return excludedDataElementsRepository.get(module.id).then(function(excludedDataElements) {
                return _.pluck(excludedDataElements && excludedDataElements.dataElements, 'id');
            });
        };

        var createSections = function (excludedDataElements) {
            return datasetRepository.includeDataElements([$scope.selectedDataset], excludedDataElements).then(function (enrichedDatasets) {
                var currentDataset = _.first(enrichedDatasets);
                $scope.sections = _.filter(currentDataset.sections, 'isIncluded');
            });
        };

        var reloadView = function () {
            $scope.sections = null;
            $scope.dataValuesMap = null;

            if(!($scope.orgUnit && $scope.selectedDataset && $scope.selectedWeeksToExport)) return;

            $scope.weeks = dateUtils.getPeriodRange($scope.selectedWeeksToExport, { excludeCurrentWeek: true });

            $scope.loading = true;
            $q.all([
                moduleDataBlockFactory.createForModule($scope.orgUnit.id, $scope.weeks).then(createDataValuesMap),
                loadExcludedDataElementIds($scope.orgUnit).then(createSections)
            ]).finally(function() {
                $scope.loading = false;
            });
        };

        $scope.$watchGroup(['orgUnit', 'selectedDataset', 'selectedWeeksToExport'], reloadView);
    };
});
