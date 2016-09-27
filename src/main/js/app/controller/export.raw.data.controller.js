define(['moment', 'lodash', 'dateUtils', 'excelBuilder'], function (moment, _, dateUtils, excelBuilder) {
    return function($scope, $q, datasetRepository, excludedDataElementsRepository, orgUnitRepository, referralLocationsRepository, moduleDataBlockFactory, filesystemService, translationsService) {

        $scope.weeksToExportOptions = [{
            label: $scope.resourceBundle.lastOneWeek,
            value: 1
        }, {
            label: $scope.resourceBundle.lastFourWeeks,
            value: 4,
            default: true
        }, {
            label: $scope.resourceBundle.lastEightWeeks,
            value: 8
        }, {
            label: $scope.resourceBundle.lastTwelveWeeks,
            value: 12
        }, {
            label: $scope.resourceBundle.lastFiftyTwoWeeks,
            value: 52
        }];

        var createDataValuesMap = function () {
            return moduleDataBlockFactory.createForModule($scope.orgUnit.id, $scope.weeks).then(function(moduleDataBlocks) {
                var allDataValues = _.flatten(_.map(moduleDataBlocks, 'dataValues')),
                    submittedDataValues = _.reject(allDataValues, 'isDraft'),
                    selectedDataSetDataElementIds = _.map(_.flatten(_.map($scope.sections, 'dataElements')), 'id');

                $scope.dataValuesMap = _.transform(submittedDataValues, function (map, dataValue) {
                    if(_.contains(selectedDataSetDataElementIds, dataValue.dataElement)) {
                        var dataDimension = $scope.selectedDataset.isOriginDataset ? dataValue.orgUnit : dataValue.dataElement;
                        map[dataValue.period] = map[dataValue.period] || {};
                        map[dataValue.period][dataDimension] = map[dataValue.period][dataDimension] || 0;
                        map[dataValue.period][dataDimension] += parseInt(dataValue.value);
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

        var filterDataElementsAndRetrieveOriginsForOriginDataSet = function () {
            if(!$scope.selectedDataset.isOriginDataset) return $q.when();

            _.each($scope.sections, function(section) {
                section.dataElements = _.reject(section.dataElements, 'associatedProgramId');
            });

            return orgUnitRepository.findAllByParent($scope.orgUnit.id).then(function (originOrgUnits) {
                $scope.originOrgUnits = _.sortBy(originOrgUnits, 'name');
            });
        };

        var filterDataElementsAndRetrieveAliasesForReferralDataSet = function () {
            if(!$scope.selectedDataset.isReferralDataset) return $q.when();

            return referralLocationsRepository.getWithId($scope.orgUnit.parent.id).then(function (referralLocations) {
                _.each($scope.sections, function (section) {
                    section.dataElements = _.transform(section.dataElements, function (dataElements, dataElement) {
                        var referralLocation = _.find(referralLocations.referralLocations, {id: dataElement.id});
                        if(referralLocation && !referralLocation.isDisabled) {
                            dataElement.formName = referralLocation.name;
                            dataElements.push(dataElement);
                        }
                    }, []);
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
                .then(filterDataElementsAndRetrieveOriginsForOriginDataSet)
                .then(filterDataElementsAndRetrieveAliasesForReferralDataSet)
                .then(createDataValuesMap)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        var buildSpreadSheetContent = function() {
            var EMPTY_LINE = [];

            var buildHeader = function () {
                var columnHeader = $scope.selectedDataset.isOriginDataset ? $scope.resourceBundle.originLabel : $scope.resourceBundle.dataElement;
                return [columnHeader].concat($scope.weeks);
            };

            var buildDataElement = function (dataElement) {
                return _.flatten([
                    dataElement.formName,
                    _.map($scope.weeks, function(week) { return $scope.dataValuesMap[week] && $scope.dataValuesMap[week][dataElement.id]; })
                ]);
            };

            var buildOriginData = function (originOrgUnit) {
                return _.flatten([
                    originOrgUnit.name,
                    _.map($scope.weeks, function(week) { return $scope.dataValuesMap[week] && $scope.dataValuesMap[week][originOrgUnit.id]; })
                ]);
            };

            var buildSection = function (section) {
                if($scope.selectedDataset.isOriginDataset) {
                    return _.map($scope.originOrgUnits, buildOriginData);
                } else {
                    return [
                        EMPTY_LINE,
                        [section.name]
                    ].concat(_.map(section.dataElements, buildDataElement));
                }
            };

            return [buildHeader()].concat(_.flatten(_.map($scope.sections, buildSection)));
        };

        $scope.exportToExcel = function () {
            var fileName = [$scope.orgUnit.name, $scope.selectedDataset.name, 'export', moment().format('DD-MMM-YYYY')].join('.'),
                spreadSheetContent = [{
                    name: $scope.selectedDataset.name,
                    data: buildSpreadSheetContent()
                }];

            return filesystemService.promptAndWriteFile(fileName, excelBuilder.createWorkBook(spreadSheetContent), filesystemService.FILE_TYPE_OPTIONS.XLSX);
        };

        $scope.$watchGroup(['orgUnit', 'selectedDataset', 'selectedWeeksToExport'], reloadView);
        $scope.selectedWeeksToExport = _.find($scope.weeksToExportOptions, 'default').value;
        $scope.dataValuesMap = {};
    };
});
