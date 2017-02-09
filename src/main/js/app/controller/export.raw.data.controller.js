define(['moment', 'lodash', 'dateUtils', 'excelBuilder', 'eventsAggregator', 'dataElementUtils'], function (moment, _, dateUtils, excelBuilder, eventsAggregator, dataElementUtils) {
    return function($scope, $q, datasetRepository, excludedDataElementsRepository, orgUnitRepository, referralLocationsRepository, moduleDataBlockFactory, filesystemService, translationsService, programRepository, programEventRepository, excludedLineListOptionsRepository) {
        var EMPTY_LINE = [];

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

        var loadExcludedDataElementIds = function(module) {
            return excludedDataElementsRepository.get(module.id).then(function(excludedDataElements) {
                $scope.excludedDataElementIds = _.pluck(excludedDataElements && excludedDataElements.dataElements, 'id');
                return $scope.excludedDataElementIds;
            });
        };

        var createSections = function (excludedDataElements) {
            return datasetRepository.includeDataElements([$scope.selectedService], excludedDataElements).then(function (enrichedDatasets) {
                var currentDataset = _.first(enrichedDatasets),
                    translatedDataSet = translationsService.translate(currentDataset);

                $scope.sections = _.filter(translatedDataSet.sections, 'isIncluded');
                _.each($scope.sections, function(section) {
                    section.dataElements = _.filter(section.dataElements, 'isIncluded');
                });
            });
        };

        var filterDataElementsAndRetrieveOriginsForOriginDataSet = function () {
            if(!$scope.selectedService.isOriginDataset) return $q.when();

            return orgUnitRepository.findAllByParent($scope.orgUnit.id).then(function (originOrgUnits) {
                $scope.originOrgUnits = _.sortBy(originOrgUnits, 'name');
            });
        };

        var filterDataElementsAndRetrieveAliasesForReferralDataSet = function () {
            if(!$scope.selectedService.isReferralDataset) return $q.when();

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

        var createDataValuesMap = function () {
            return moduleDataBlockFactory.createForModule($scope.orgUnit.id, $scope.weeks).then(function(moduleDataBlocks) {
                var allDataValues = _.flatten(_.map(moduleDataBlocks, 'dataValues')),
                    submittedDataValues = _.reject(allDataValues, 'isDraft'),
                    selectedDataSetDataElementIds = _.map(_.flatten(_.map($scope.sections, 'dataElements')), 'id');

                $scope.dataValuesMap = _.transform(submittedDataValues, function (map, dataValue) {
                    if(_.contains(selectedDataSetDataElementIds, dataValue.dataElement)) {
                        var dataDimension = $scope.selectedService.isOriginDataset ? dataValue.orgUnit : dataValue.dataElement;
                        map[dataValue.period] = map[dataValue.period] || {};
                        map[dataValue.period][dataDimension] = map[dataValue.period][dataDimension] || 0;
                        map[dataValue.period][dataDimension] += parseInt(dataValue.value);
                    }
                }, {});
            });
        };

        $scope.isDataAvailableForDataElement = function (dataElement) {
            var weeksWithoutData = _.filter($scope.weeks, function (week) {
                return $scope.dataValuesMap[week] && $scope.dataValuesMap[week][dataElement.id];
            });
            return !_.isEmpty(weeksWithoutData);
        };
        
        $scope.isDataAvailableForDataSetSection = function (section) {
            var dataElementsWithoutData = _.filter(section.dataElements, $scope.isDataAvailableForDataElement);
            return !_.isEmpty(dataElementsWithoutData);
        };

        var buildAggregateSpreadSheetContent = function() {
            var buildHeader = function () {
                var columnHeader = $scope.selectedService.isOriginDataset ? $scope.resourceBundle.originLabel : $scope.resourceBundle.dataElement;
                return [columnHeader].concat($scope.weeks);
            };

            var buildDataElement = function (dataElement) {
                return _.flatten([
                    $scope.getDisplayName(dataElement),
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
                if($scope.selectedService.isOriginDataset) {
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

        var buildLineListSpreadSheetContent = function () {
            var buildHeaders = function () {
                var rowHeader = $scope.selectedService.isOriginDataset && $scope.resourceBundle.originLabel ||
                                $scope.selectedService.isReferralDataset && $scope.resourceBundle.referralLocationLabel ||
                                $scope.resourceBundle.optionName;

                return [rowHeader].concat($scope.weeks);
            };

            var buildOption = function (dataElement, option) {
              return _.flatten([
                  option.name,
                  _.map($scope.weeks, function(week) { return _.isUndefined($scope.eventSummary[dataElement.id]) ? undefined : _.chain($scope.eventSummary).get(dataElement.id).get(option.id).get(week).get('length').value(); })
              ]);
            };

            var buildDataElementSection = function (dataElement) {
                return [
                    EMPTY_LINE,
                    [$scope.getDisplayName(dataElement)]
                ].concat(_.map(_.get(dataElement.optionSet, 'options'), _.partial(buildOption, dataElement)));
            };

            var buildProceduresPerformedOption = function (option) {
                return _.flatten([
                    option.name,
                    _.map($scope.weeks, function(week) { return $scope.getProcedureCountForOptionForWeek(option.id, week); })
                ]);
            };

            var buildProceduresPerformedSection = function () {
                var proceduresPerformedOptions = _.first($scope.procedureDataElements).optionSet.options;

                if($scope.getProcedureCountForAllOptions()) {
                    return [
                        EMPTY_LINE,
                        [$scope.resourceBundle.proceduresPerformed]
                    ].concat(_.map(proceduresPerformedOptions, buildProceduresPerformedOption));
                } else {
                    return [];
                }
            };

            var buildOriginData = function () {
                return _.map($scope.originOrgUnits, function (origin) {
                    return _.flatten([
                        origin.name,
                        _.map($scope.weeks, function(week) { return _.chain($scope.originSummary).get(origin.id).get(week).get('length').value(); })
                    ]);
                });
            };

            var buildReferralLocationData = function () {
                var referralLocationOptionsForModule = _.filter($scope.referralLocationDataElement.optionSet.options, function (option) {
                     return $scope.referralLocations[option.genericName] &&
                         (!$scope.referralLocations[option.genericName].isDisabled || $scope.eventSummary[$scope.referralLocationDataElement.id][option.id]);
                });

                return _.map(referralLocationOptionsForModule, function (referralLocationOption) {
                    return _.flatten([
                        $scope.referralLocations[referralLocationOption.genericName].name,
                        _.map($scope.weeks, function(week) { return _.chain($scope.eventSummary).get($scope.referralLocationDataElement.id).get(referralLocationOption.id).get(week).get('length').value(); })
                    ]);
                });
            };

            var spreadSheetContent = [buildHeaders()];
            if($scope.selectedService.isOriginDataset) {
                return spreadSheetContent.concat(buildOriginData());
            } else if($scope.selectedService.isReferralDataset) {
                return spreadSheetContent.concat(buildReferralLocationData());
            } else {
                return spreadSheetContent.concat(_.flatten(_.map($scope.summaryDataElements, buildDataElementSection))).concat(buildProceduresPerformedSection());
            }
        };

        $scope.exportToExcel = function () {
            var fileName = [$scope.orgUnit.name, $scope.selectedService.name, 'export', moment().format('DD-MMM-YYYY')].join('.'),
                spreadSheetContent = [{
                    name: $scope.selectedService.name,
                    data: $scope.orgUnit.lineListService ? buildLineListSpreadSheetContent() : buildAggregateSpreadSheetContent()
                }];

            return filesystemService.promptAndWriteFile(fileName, excelBuilder.createWorkBook(spreadSheetContent), filesystemService.FILE_TYPE_OPTIONS.XLSX);
        };

        var loadAggregateRawData = function () {
            $scope.sections = null;
            $scope.dataValuesMap = {};

            return loadExcludedDataElementIds($scope.orgUnit)
                .then(createSections)
                .then(filterDataElementsAndRetrieveOriginsForOriginDataSet)
                .then(filterDataElementsAndRetrieveAliasesForReferralDataSet)
                .then(createDataValuesMap);
        };

        var fetchOriginOrgUnitsForCurrentModule = function () {
            return orgUnitRepository.findAllByParent($scope.orgUnit.id).then(function (originOrgUnits) {
                $scope.originOrgUnits = originOrgUnits;
            });
        };

        var getProgramForCurrentModule = function () {
            var orgUnit = (_.get($scope.originOrgUnits[0], 'id')) || $scope.orgUnit.id;
            return programRepository.getProgramForOrgUnit(orgUnit).then(function (program) {
                return programRepository.get(program.id, $scope.excludedDataElementIds).then(function (program) {
                    $scope.allDataElements = _.chain(program.programStages)
                        .map('programStageSections').flatten()
                        .map('programStageDataElements').flatten()
                        .map('dataElement')
                        .filter('isIncluded').value();

                    $scope.referralLocationDataElement = _.find($scope.allDataElements, { offlineSummaryType: 'referralLocations' });
                    var referralLocationOptions = _.get($scope.referralLocationDataElement, 'optionSet.options');
                    _.each(referralLocationOptions, function (option) {
                        option.genericName = option.name;
                    });
                    
                    $scope.program = translationsService.translate(program);
                    return program;
                });
            });
        };

        $scope.getProcedureCountForAllOptions = function () {
            return _.any($scope.procedureDataElements, function (dataElement) {
                return $scope.eventSummary[dataElement.id];
            });
        };

        $scope.getProcedureCountForOptionForAllWeeks = function (optionId) {
            var count = _.sum($scope.procedureDataElements, function (dataElement) {
                return _.chain($scope.eventSummary).get(dataElement.id).get(optionId).get('count').value() || 0;
            });

            return count !== 0 ? count : undefined;
        };
        
        $scope.getProcedureCountForOptionForWeek = function (optionId, week) {
            var count = _.sum($scope.procedureDataElements, function (dataElement) {
                return _.chain($scope.eventSummary).get(dataElement.id).get(optionId).get(week).get('length').value() || 0;
            });
            
            return count !== 0 ? count : undefined;
        };

        $scope.isReferralDataAvailable = function () {
            return !_.isEmpty($scope.events) && !!$scope.eventSummary[$scope.referralLocationDataElement.id];
        };

        $scope.getDisplayName = dataElementUtils.getDisplayName;
        
        var fetchEventsForProgram = function (program) {
            var startDate = moment(_.first($scope.weeks), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                endDate = moment(_.last($scope.weeks), 'GGGG[W]W').endOf('isoWeek').format('YYYY-MM-DD');
            var orgUnitIdsAssociatedToEvents = _.map($scope.originOrgUnits, 'id').concat($scope.orgUnit.id);
            return programEventRepository.findEventsByDateRange(program.id, orgUnitIdsAssociatedToEvents, startDate, endDate).then(function (events) {
                return _.filter(events, function (event) {
                    return !event.localStatus || event.localStatus == 'READY_FOR_DHIS';
                });
            });
        };

        var getExcludedLineListOptions = function () {
            return excludedLineListOptionsRepository.get($scope.orgUnit.id).then(function (excludedLineListOptions) {
                $scope.indexedExcludedLineListOptions = _.indexBy(_.get(excludedLineListOptions, 'dataElements'), 'dataElementId');
            });
        };

        var generateViewModel = function (events) {
            $scope.events = events;

            var excludeLineListDataElementsOptions = function () {
                return _.map($scope.summaryDataElements, function (dataElement) {
                    if (dataElement.optionSet && dataElement.optionSet.options) {
                        dataElement.optionSet.options = _.reject(dataElement.optionSet.options, function (option) {
                            return _.contains(_.get($scope.indexedExcludedLineListOptions[dataElement.id], 'excludedOptionIds'), option.id);
                        });
                    }
                    return dataElement;
                });
            };

            if ($scope.selectedService.isOriginDataset) {
                $scope.originSummary = eventsAggregator.nest($scope.events, ['orgUnit', 'period']);
            } else {
                var byPeriod = 'period';
                var dataElementIds = _.map($scope.allDataElements, 'id');
                $scope.eventSummary = eventsAggregator.buildEventsTree($scope.events, [byPeriod], dataElementIds);
                
                $scope.procedureDataElements = _.filter($scope.allDataElements, { offlineSummaryType: 'procedures' });
                $scope.summaryDataElements = _.filter($scope.allDataElements, { offlineSummaryType: 'showInOfflineSummary' });
                $scope.summaryDataElements = excludeLineListDataElementsOptions();
                if($scope.selectedService.isReferralDataset) {
                    referralLocationsRepository.get($scope.orgUnit.parent.id).then(function (referralLocations) {
                        $scope.referralLocations = referralLocations;
                    });
                }
            }
        };
        
        var loadLineListRawData = function () {
            $scope.events = [];
            
            return $q.all([fetchOriginOrgUnitsForCurrentModule(), loadExcludedDataElementIds($scope.orgUnit), getExcludedLineListOptions()])
                .then(getProgramForCurrentModule)
                .then(fetchEventsForProgram)
                .then(generateViewModel);
        };

        var reloadView = function () {
            if(!($scope.orgUnit && $scope.selectedService && $scope.selectedWeeksToExport)) return;
            $scope.weeks = dateUtils.getPeriodRange($scope.selectedWeeksToExport, { excludeCurrentWeek: true });

            var loadRawData = function () {
                return $scope.orgUnit.lineListService ? loadLineListRawData() : loadAggregateRawData();
            };

            $scope.startLoading();
            return loadRawData().finally($scope.stopLoading);
        };

        $scope.$watchGroup(['orgUnit', 'selectedService', 'selectedWeeksToExport'], reloadView);
        $scope.selectedWeeksToExport = _.find($scope.weeksToExportOptions, 'default').value;

        $scope.dataValuesMap = {};
        $scope.events = [];
    };
});
