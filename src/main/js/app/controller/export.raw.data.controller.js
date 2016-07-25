define(['moment', 'lodash', 'dateUtils'], function (moment, _, dateUtils) {
    return function($scope, $q, datasetRepository, excludedDataElementsRepository, moduleDataBlockFactory, filesystemService, translationsService) {

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

        var createDataValuesMap = function () {
            return moduleDataBlockFactory.createForModule($scope.orgUnit.id, $scope.weeks).then(function(moduleDataBlocks) {
                var allDataValues = _.flatten(_.map(moduleDataBlocks, 'dataValues')),
                    selectedDataSetDataElementIds = _.map(_.flatten(_.map($scope.sections, 'dataElements')), 'id');

                $scope.dataValuesMap = _.transform(allDataValues, function (map, dataValue) {
                    if(_.contains(selectedDataSetDataElementIds, dataValue.dataElement)) {
                        map[dataValue.period] = map[dataValue.period] || {};
                        map[dataValue.period][dataValue.dataElement] = map[dataValue.period][dataValue.dataElement] || 0;
                        map[dataValue.period][dataValue.dataElement] += parseInt(dataValue.value);
                    }
                }, {});
            });
        };

        var loadExcludedDataElementIds = function(module) {
            return excludedDataElementsRepository.get(module.id).then(function(excludedDataElements) {
                return _.pluck(excludedDataElements && excludedDataElements.dataElements, 'id');
            });
        };

        var createSections = function (excludedDataElements) {
            return datasetRepository.includeDataElements([$scope.selectedDataset], excludedDataElements).then(function (enrichedDatasets) {
                var currentDataset = _.first(enrichedDatasets),
                    translatedDataSet = translationsService.translate(currentDataset);

                $scope.sections = _.filter(translatedDataSet.sections, 'isIncluded');
                _.each($scope.sections, function(section) {
                    section.dataElements = _.filter(section.dataElements, 'isIncluded');
                });
            });
        };

        var reloadView = function () {
            $scope.sections = null;
            $scope.dataValuesMap = {};

            if(!($scope.orgUnit && $scope.selectedDataset && $scope.selectedWeeksToExport)) return;

            $scope.weeks = dateUtils.getPeriodRange($scope.selectedWeeksToExport, { excludeCurrentWeek: true });

            $scope.loading = true;
            loadExcludedDataElementIds($scope.orgUnit)
                .then(createSections)
                .then(createDataValuesMap)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        var buildCsvContent = function() {
            var DELIMITER = ',',
                NEW_LINE = '\n',
                EMPTY_LINE = '';

            var escapeString = function (string) {
                return '"' + string + '"';
            };

            var buildHeader = function () {
                return [$scope.resourceBundle.dataElement].concat($scope.weeks).join(DELIMITER);
            };

            var buildDataElement = function (dataElement) {
                return [
                    escapeString(dataElement.formName),
                    _.map($scope.weeks, function(week) { return $scope.dataValuesMap[week] && $scope.dataValuesMap[week][dataElement.id]; })
                ].join(DELIMITER);
            };

            var buildSection = function (section) {
                return [
                    EMPTY_LINE,
                    escapeString(section.name),
                    _.map(section.dataElements, buildDataElement)
                ];
            };

            return _.flattenDeep([buildHeader(), _.map($scope.sections, buildSection)]).join(NEW_LINE);
        };

        $scope.exportToCSV = function () {
            var fileName = [$scope.orgUnit.name, $scope.selectedDataset.name, 'export', moment().format('YYYYMMDD'), 'csv'].join('.'),
                csvContent = buildCsvContent();

            return filesystemService.promptAndWriteFile(fileName, new Blob([csvContent], { type: 'text/csv' }), filesystemService.FILE_TYPE_OPTIONS.CSV);
        };

        $scope.$watchGroup(['orgUnit', 'selectedDataset', 'selectedWeeksToExport'], reloadView);
        $scope.selectedWeeksToExport = _.first($scope.weeksToExportOptions).value;
        $scope.dataValuesMap = {};
    };
});
