define(["lodash", "dataValuesMapper", "orgUnitMapper", "moment", "datasetTransformer", "properties"], function(_, dataValuesMapper, orgUnitMapper, moment, datasetTransformer, properties) {
    return function($scope, $routeParams, $q, $hustle, dataRepository, systemSettingRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository,
        $timeout, orgUnitRepository, datasetRepository, programRepository) {

        var currentPeriod, currentPeriodAndOrgUnit;
        $scope.rowTotal = {};

        var resetForm = function() {
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isSubmitted = false;
            $scope.firstLevelApproveSuccess = false;
            $scope.secondLevelApproveSuccess = false;
            $scope.approveError = false;
            $scope.excludedDataElements = {};
            $scope.associatedProgramId = undefined;
            $scope.rowTotal = {};
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.showForm = function() {
            if (_.isEmpty($scope.dataValues))
                return false;

            return ($scope.isSubmitted && $rootScope.hasRoles(['Project Level Approver', 'Observer'])) || ($scope.isCompleted && $rootScope.hasRoles(['Coordination Level Approver', 'Observer']));
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

        $scope.sum = function(dataValues, orgUnits, dataElementId) {
            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];

            var allValues = [];
            _.forEach(orgUnits, function(orgUnit) {
                dataValues[orgUnit.id] = dataValues[orgUnit.id] || {};
                dataValues[orgUnit.id][dataElementId] = dataValues[orgUnit.id][dataElementId] || {};

                var allOptions = _.keys(dataValues[orgUnit.id][dataElementId]);
                _.forEach(allOptions, function(option) {
                    dataValues[orgUnit.id][dataElementId][option] = dataValues[orgUnit.id][dataElementId][option] || {};
                    allValues.push(dataValues[orgUnit.id][dataElementId][option].value);
                });
            });
            var sum = _.sum(allValues);
            $scope.rowTotal[dataElementId] = sum;
            return sum;
        };

        $scope.columnSum = function(dataValues, orgUnits, sectionDataElements, optionId) {
            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];
            var dataElementIds = _.pluck(sectionDataElements, "id");
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

        $scope.firstLevelApproval = function() {

            var completedBy = $scope.currentUser.userCredentials.username;

            var publishToDhis = function() {
                return $hustle.publish({
                    "data": [currentPeriodAndOrgUnit],
                    "type": "uploadCompletionData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadCompletionDataDesc + currentPeriodAndOrgUnit.period + ", " + $scope.selectedModule.name
                }, "dataValues");
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
                return $hustle.publish({
                    "data": [currentPeriodAndOrgUnit],
                    "type": "uploadApprovalData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadApprovalDataDesc + currentPeriodAndOrgUnit.period + ", " + $scope.selectedModule.name
                }, "dataValues");
            };

            var approvedBy = $scope.currentUser.userCredentials.username;

            approvalDataRepository.markAsApproved(currentPeriodAndOrgUnit, approvedBy)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
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
                return systemSettingRepository.get($scope.selectedModule.id).then(function(systemSettings) {
                    $scope.excludedDataElements = systemSettings && systemSettings.value ? systemSettings.value.dataElements : undefined;
                });
            };

            var findallOrgUnits = function(orgUnits) {
                var orgUnitIds = _.pluck(orgUnits, "id");
                return orgUnitRepository.findAll(orgUnitIds);
            };

            var setTabHeadings = function() {
                if ($scope.isLineListModule) {
                    $scope.tabHeadings = [$scope.resourceBundle.dhisSummary, $scope.resourceBundle.fieldAppSummary];
                } else {
                    $scope.tabHeadings = $rootScope.hasRoles(['Observer']) ? [$scope.resourceBundle.dataForObserver] : [$scope.resourceBundle.dataForApproval];
                }
            };

            if (_.isEmpty($scope.selectedModule))
                return;
            return $q.all([loadAssociatedOrgUnitsAndPrograms(), loadExcludedDataElements()]).then(function() {

                var loadDataSetsPromise = datasetRepository.findAllForOrgUnits($scope.moduleAndOriginOrgUnitIds)
                    .then(_.curryRight(datasetRepository.includeDataElements)($scope.excludedDataElements))
                    .then(datasetRepository.includeCategoryOptionCombinations)
                    .then(function(data) {
                        var datasets = data.enrichedDataSets;
                        var dataSetPromises = _.map(datasets, function(dataset) {
                            return findallOrgUnits(dataset.organisationUnits).then(function(orgunits) {
                                dataset.organisationUnits = orgunits;
                                return dataset;
                            });
                        });
                        return $q.all(dataSetPromises).then(function(datasets) {
                            $scope.dataSets = datasets;
                        });
                    });

                var loadDataValuesPromise = dataRepository.getDataValues(currentPeriod, $scope.moduleAndOriginOrgUnitIds).then(function(dataValues) {
                    dataValues = dataValues || [];
                    var isDraft = !_.some(dataValues, {
                        "isDraft": true
                    });
                    $scope.dataValues = dataValuesMapper.mapToView(dataValues);
                    $scope.isSubmitted = (!_.isEmpty(dataValues) && isDraft);
                });

                var loadApprovalDataPromise = approvalDataRepository.getApprovalData(currentPeriodAndOrgUnit).then(function(data) {
                    $scope.isCompleted = !_.isEmpty(data) && data.isComplete;
                    $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                });

                if ($scope.dataentryForm !== undefined)
                    $scope.dataentryForm.$setPristine();

                setTabHeadings();
                return $q.all([loadDataSetsPromise, loadDataValuesPromise, loadApprovalDataPromise]);

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
