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
            var map = {};

            _.each(moduleDataBlocks, function (moduleDataBlock) {
                map[moduleDataBlock.period] = {};
                var dataValueMapByDataElementId = _.groupBy(moduleDataBlock.dataValues, 'dataElement');

                _.each(dataValueMapByDataElementId, function (dataValues, dataElementId) {
                    map[moduleDataBlock.period][dataElementId] = _.reduce(dataValues, function (acc, dataValue) {
                        return acc + parseInt(dataValue.value);
                    }, 0);
                });
            });

            $scope.dataValuesMap = map;
        };

        var loadExcludedDataElements = function(module) {
            return excludedDataElementsRepository.get(module.id).then(function(excludedDataElements) {
                return excludedDataElements ? _.pluck(excludedDataElements.dataElements, 'id') : [];
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

            moduleDataBlockFactory.createForModule($scope.orgUnit.id, $scope.weeks).then(createDataValuesMap);
            loadExcludedDataElements($scope.orgUnit).then(createSections);
        };

        $scope.$watchGroup(['orgUnit', 'selectedDataset', 'selectedWeeksToExport'], reloadView);
    };
});
