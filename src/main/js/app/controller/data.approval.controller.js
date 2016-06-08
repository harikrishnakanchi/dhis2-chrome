define(["lodash", "dataValuesMapper", "orgUnitMapper", "moment", "datasetTransformer", "properties"], function(_, dataValuesMapper, orgUnitMapper, moment, datasetTransformer, properties) {
    return function($scope, $routeParams, $q, $hustle, dataRepository, excludedDataElementsRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository,
        $timeout, orgUnitRepository, datasetRepository, programRepository, referralLocationsRepository, translationsService, moduleDataBlockFactory) {

        $scope.rowTotal = {};
        var currentPeriod, currentPeriodAndOrgUnit;
        var removeReferral = false;

        var resetForm = function() {
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isSubmitted = false;
            $scope.firstLevelApproveSuccess = false;
            $scope.secondLevelApproveSuccess = false;
            $scope.approveError = false;
            $scope.syncError = false;
            $scope.excludedDataElements = {};
            $scope.associatedProgramId = undefined;
            $scope.rowTotal = {};
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.showForm = function() {
            if($rootScope.hasRoles(['Observer'])) {
                return $scope.isSubmitted;
            } else if($rootScope.hasRoles(['Project Level Approver'])) {
                return $scope.isSubmitted && !$scope.moduleDataBlock.awaitingActionAtDataEntryLevel;
            } else if($rootScope.hasRoles(['Coordination Level Approver'])) {
                return $scope.isSubmitted && !($scope.moduleDataBlock.awaitingActionAtDataEntryLevel || $scope.moduleDataBlock.awaitingActionAtProjectLevelApprover);
            }
        };

        $scope.getDatasetState = function(id, isFirst) {
            if (isFirst && !(id in $scope.isDatasetOpen)) {
                $scope.isDatasetOpen[id] = true;
            }
            return $scope.isDatasetOpen;
        };

        $scope.maxcolumns = function(headers) {
            return _.last(headers).length;
        };

        $scope.getValue = function(dataValues, dataElementId, option, orgUnits) {
            if (dataValues === undefined)
                return;

            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];

            var result = 0;

            var orgUnitIds = _.pluck(orgUnits, "id");
            _.forEach(orgUnitIds, function(orgUnitId) {
                dataValues[orgUnitId] = dataValues[orgUnitId] || {};
                dataValues[orgUnitId][dataElementId] = dataValues[orgUnitId][dataElementId] || {};
                dataValues[orgUnitId][dataElementId][option] = dataValues[orgUnitId][dataElementId][option] || {};

                if (!_.isEmpty(dataValues[orgUnitId][dataElementId][option].value))
                    result += parseInt(dataValues[orgUnitId][dataElementId][option].value);
            });

            return result;
        };

        $scope.sum = function(dataValues, orgUnits, dataElementId, catOptComboIdsForTotalling) {
            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];

            var allValues = [];
            _.forEach(orgUnits, function(orgUnit) {
                dataValues[orgUnit.id] = dataValues[orgUnit.id] || {};
                dataValues[orgUnit.id][dataElementId] = dataValues[orgUnit.id][dataElementId] || {};

                _.forEach(catOptComboIdsForTotalling, function(option) {
                    dataValues[orgUnit.id][dataElementId][option] = dataValues[orgUnit.id][dataElementId][option] || {};
                    allValues.push(dataValues[orgUnit.id][dataElementId][option].value);
                });
            });
            var sum = _.sum(allValues);
            $scope.rowTotal[dataElementId] = sum;
            return sum;
        };

        var getReferralDataElementIds = function(dataElements) {
            var dataElementsForReferral = _.filter(dataElements, function(de) {
                return $scope.referralLocations[de.formName] !== undefined;
            });

            return _.pluck(dataElementsForReferral, "id");
        };

        $scope.columnSum = function(dataValues, orgUnits, sectionDataElements, optionId, isReferralDataset) {
            var filteredDataElements = _.filter(sectionDataElements, {"isIncluded": true});
            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];
            var dataElementIds = isReferralDataset ? getReferralDataElementIds(filteredDataElements) : _.pluck(filteredDataElements, "id");

            var allValues = [];
            _.forEach(orgUnits, function(orgUnit) {
                dataValues[orgUnit.id] = dataValues[orgUnit.id] || {};
                _.forEach(dataValues[orgUnit.id], function(value, key) {
                    if (_.includes(dataElementIds, key)) {
                        allValues.push(parseInt(value[optionId].value));
                    }
                });
            });
            return _.sum(allValues);
        };

        $scope.totalSum = function(dataValues, sectionDataElements) {
            var dataElementsIds = _.pluck(sectionDataElements, "id");

            return _.reduce($scope.rowTotal, function(sum, value, key) {
                if (_.includes(dataElementsIds, key)) {
                    return sum + value;
                } else {
                    return sum;
                }
            }, 0);

        };

        $scope.originSum = function(dataValues, dataSet, section) {
            var sum = 0;
            _.forEach(dataSet.organisationUnits, function(orgUnit) {
                values = dataValues[orgUnit.id];
                if (values && values[section.dataElements[0].id] && values[section.dataElements[0].id][section.categoryOptionComboIds[0]]) {
                    var value = values[section.dataElements[0].id][section.categoryOptionComboIds[0]].value || "0";
                    sum += parseInt(value);
                }
            });
            return sum;
        };

        $scope.firstLevelApproval = function() {
            var completedBy = $scope.currentUser.userCredentials.username;

            var publishToDhis = function() {
                if ($scope.isLineListModule) {
                    return $hustle.publish({
                        "data": [currentPeriodAndOrgUnit],
                        "type": "uploadCompletionData",
                        "locale": $scope.locale,
                        "desc": $scope.resourceBundle.uploadCompletionDataDesc + currentPeriodAndOrgUnit.period + ", " + $scope.selectedModule.name
                    }, "dataValues");
                }
                else {
                    return $hustle.publish({
                        "data": {
                            period: currentPeriod,
                            moduleId: $scope.selectedModule.id
                        },
                        "type": "syncModuleDataBlock",
                        "locale": $scope.locale,
                        "desc": $scope.resourceBundle.syncModuleDataBlockDesc + currentPeriod + ", " + $scope.selectedModule.name
                    }, "dataValues");
                }
            };

            var onSuccess = function() {
                $scope.firstLevelApproveSuccess = true;
                $scope.approveError = false;
                initializeForm();
            };

            var onError = function() {
                $scope.firstLevelApproveSuccess = false;
                $scope.approveError = true;
            };

            approvalDataRepository.markAsComplete(currentPeriodAndOrgUnit, completedBy)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
        };

        $scope.secondLevelApproval = function() {
            var onSuccess = function() {
                $scope.secondLevelApproveSuccess = true;
                $scope.approveError = false;
                initializeForm();
            };

            var onError = function() {
                $scope.secondLevelApproveSuccess = false;
                $scope.approveError = true;
            };


            var publishToDhis = function() {
                if($scope.isLineListModule) {
                    // Can be removed once approval logic for line list modules is integrated into ModuleDataBlockMerger
                    return $hustle.publish({
                        "data": [currentPeriodAndOrgUnit],
                        "type": "uploadApprovalData",
                        "locale": $scope.locale,
                        "desc": $scope.resourceBundle.uploadApprovalDataDesc + currentPeriodAndOrgUnit.period + ", " + $scope.selectedModule.name
                    }, "dataValues");
                }
                else {
                    return $hustle.publish({
                        "data": {
                        moduleId: $scope.selectedModule.id,
                            period: currentPeriod
                        },
                        "type": "syncModuleDataBlock",
                        "locale": $scope.locale,
                        "desc": $scope.resourceBundle.syncModuleDataBlockDesc + currentPeriod + ", " + $scope.selectedModule.name
                    }, "dataValues");

                }
            };

            var approvedBy = $scope.currentUser.userCredentials.username;

            approvalDataRepository.markAsApproved(currentPeriodAndOrgUnit, approvedBy)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
        };

        $scope.showTotalLabelForOriginDatasetSection = function (dataSet) {
            var count = 0;
            _.each(dataSet.organisationUnits, function (orgUnit) {
                if ($scope.moduleAndOriginOrgUnitIds.indexOf(orgUnit.id) >= 0)
                    count++;
            });
            return count > 1;
        };

        var initializeForm = function() {
            currentPeriod = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
            currentPeriodAndOrgUnit = {
                "period": currentPeriod,
                "orgUnit": $scope.selectedModule.id
            };
            $scope.loading = true;
            $scope.isOfflineApproval = false;

            var loadAssociatedOrgUnitsAndPrograms = function() {
                return orgUnitRepository.findAllByParent([$scope.selectedModule.id]).then(function(originOrgUnits) {
                    $scope.moduleAndOriginOrgUnitIds = _.pluck(_.flattenDeep([$scope.selectedModule, originOrgUnits]), "id");
                    return programRepository.getProgramForOrgUnit(originOrgUnits[0].id).then(function(program) {
                        if (program) {
                            $scope.associatedProgramId = program.id;
                            $scope.isLineListModule = true;
                        } else {
                            $scope.isLineListModule = false;
                        }
                    });
                });
            };

            var loadExcludedDataElements = function() {
                return excludedDataElementsRepository.get($scope.selectedModule.id).then(function(excludedDataElements) {
                    $scope.excludedDataElements = excludedDataElements ? _.pluck(excludedDataElements.dataElements, "id") : undefined;
                });
            };

            var loadRefferalLocations = function() {
                return referralLocationsRepository.get($scope.selectedModule.parent.id).then(function(data) {
                    if (!_.isUndefined(data)) {
                        data = _.omit(data, function(o) {
                            return o.isDisabled !== false;
                        });
                        removeReferral = _.keys(data).length === 0 ? true : false;
                        $scope.referralLocations = data;
                        return;
                    }
                    removeReferral = true;
                });
            };

            var findallOrgUnits = function(orgUnits) {
                var orgUnitIds = _.pluck(orgUnits, "id");
                return orgUnitRepository.findAll(orgUnitIds);
            };

            if (_.isEmpty($scope.selectedModule))
                return;
            return $q.all([loadAssociatedOrgUnitsAndPrograms(), loadExcludedDataElements(), loadRefferalLocations()]).then(function() {

                var loadDataSetsPromise = datasetRepository.findAllForOrgUnits($scope.moduleAndOriginOrgUnitIds)
                    .then(_.curryRight(datasetRepository.includeDataElements)($scope.excludedDataElements))
                    .then(datasetRepository.includeCategoryOptionCombinations)
                    .then(function(datasets) {
                        var dataSetPromises = _.map(datasets, function (dataset) {
                            return findallOrgUnits(dataset.organisationUnits).then(function (orgunits) {
                                dataset.organisationUnits = orgunits;
                                return dataset;
                            });
                        });

                        var translateDataSets = function (datasets) {
                            var partitionDatasets = _.partition(datasets, {
                                "isReferralDataset": false
                            });

                            var translatedOtherDatasets = translationsService.translate(partitionDatasets[0]);
                            var translatedReferralDatasets = translationsService.translateReferralLocations(partitionDatasets[1]);
                            return translatedOtherDatasets.concat(translatedReferralDatasets);
                        };

                        var setDatasets = function (translatedDatasets) {
                            if (removeReferral)
                                $scope.dataSets = _.filter(translatedDatasets, {
                                    "isReferralDataset": false
                                });
                            else
                                $scope.dataSets = translatedDatasets;
                            return $scope.dataSets;
                        };

                        var setTotalsDisplayPreferencesforDataSetSections = function (dataSets) {
                            _.each(dataSets, function (dataSet) {
                                _.each(dataSet.sections, function (dataSetSection) {
                                    dataSetSection.shouldDisplayRowTotals = dataSetSection.categoryOptionComboIds.length > 1;
                                    dataSetSection.shouldDisplayColumnTotals = (_.filter(dataSetSection.dataElements, {isIncluded: true}).length > 1 && !(dataSetSection.shouldHideTotals));
                                });
                            });
                        };

                        return $q.all(dataSetPromises)
                            .then(translateDataSets)
                            .then(setDatasets)
                            .then(setTotalsDisplayPreferencesforDataSetSections);
                    });

                var loadModuleDataBlock = moduleDataBlockFactory.create($scope.selectedModule.id, currentPeriod).then(function(moduleDataBlock) {
                    $scope.moduleDataBlock = moduleDataBlock;
                    $scope.isApproved = moduleDataBlock.approvedAtCoordinationLevel;
                    $scope.isCompleted = moduleDataBlock.approvedAtProjectLevel;
                    $scope.syncError = moduleDataBlock.failedToSync;
                    $scope.dataValues = dataValuesMapper.mapToView(moduleDataBlock.dataValues);
                    $scope.isSubmitted = moduleDataBlock.submitted;
                });

                if ($scope.dataentryForm !== undefined)
                    $scope.dataentryForm.$setPristine();

                return $q.all([loadDataSetsPromise, loadModuleDataBlock]);

            }).finally(function() {
                $scope.loading = false;
            });
        };

        var init = function() {
            $scope.dataType = "all";
        };

        var deregisterErrorInfoListener = $scope.$on('errorInfo', function(event, errorMessage) {
            $scope.approveError = true;
        });

        var deregisterModuleWeekInfoListener = $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            $scope.approveError = false;
            resetForm();
            initializeForm();
        });

        $scope.$on('$destroy', function() {
            deregisterErrorInfoListener();
            deregisterModuleWeekInfoListener();
        });

        resetForm();
        init();
    };
});
