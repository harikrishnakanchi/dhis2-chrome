define(['lodash', 'moment'], function (_, moment) {
    return function($scope, $q, datasetRepository, excludedDataElementsRepository, moduleDataBlockFactory) {

        $scope.weekRanges = [{
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

        var generateWeeksToDisplay = function (noOfWeeksToDisplay) {
            var weeksToDisplay = [];
            for(var i = noOfWeeksToDisplay; i > 0; i--) {
                weeksToDisplay.push(moment().subtract(i, 'weeks').format('GGGG[W]WW'));
            }
            return weeksToDisplay;
        };

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

        var fetchCurrentDataset = function (datasetId) {
            return datasetRepository.get(datasetId);
        };

        var loadExcludedDataElements = function(module) {
            return excludedDataElementsRepository.get(module.id).then(function(excludedDataElements) {
                return excludedDataElements ? _.pluck(excludedDataElements.dataElements, 'id') : [];
            });
        };

        var createSections = function (data) {
            var dataset = data.dataset,
                excludedDataElements = data.excludedDataElements;

            return datasetRepository.includeDataElements([dataset], excludedDataElements).then(function (enrichedDatasets) {
                var currentDataset = _.first(enrichedDatasets);
                $scope.sections = _.filter(currentDataset.sections, 'isIncluded');
            });
        };

        var reloadView = function (data) {
            if(!(data[0] && data[1] && data[2])) return;

            var module = data[0];
            var selectedDataset = data[1];
            var selectedWeekRange = data[2];

            $scope.weeks = generateWeeksToDisplay(selectedWeekRange);

            moduleDataBlockFactory.createForModule(module.id, $scope.weeks).then(createDataValuesMap);

            $q.all({
                dataset: fetchCurrentDataset(selectedDataset.id),
                excludedDataElements: loadExcludedDataElements(module)
            }).then(createSections);
        };

        $scope.$watchGroup(['orgUnit', 'selectedDataset', 'weekRange'], reloadView);
    };
});
