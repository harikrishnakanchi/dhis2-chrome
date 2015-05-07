define(["lodash", "dataValuesMapper", "orgUnitMapper", "moment", "datasetTransformer", "properties"], function(_, dataValuesMapper, orgUnitMapper, moment, datasetTransformer, properties) {
    return function($scope, $routeParams, $q, $hustle, dataRepository, systemSettingRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository,
        $timeout, orgUnitRepository, datasetRepository, programRepository) {

        var currentPeriod = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
        $scope.dataSets = [];

        var currentPeriodAndOrgUnit = {
            "period": currentPeriod,
            "orgUnit": $scope.currentModule.id
        };

        var resetForm = function() {
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isSubmitted = false;
            $scope.firstLevelApproveSuccess = false;
            $scope.secondLevelApproveSuccess = false;
            $scope.approveError = false;
            $scope.excludedDataElements = {};
            $scope.associatedProgramId = undefined;
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
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
            return _.sum(allValues);
        };

        $scope.firstLevelApproval = function() {

            var completedBy = $scope.currentUser.userCredentials.username;

            var publishToDhis = function() {
                return $hustle.publish({
                    "data": [currentPeriodAndOrgUnit],
                    "type": "uploadCompletionData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadCompletionDataDesc + currentPeriodAndOrgUnit.period + ", Module: " + $scope.currentModule.name
                }, "dataValues");
            };

            var onSuccess = function() {
                $scope.firstLevelApproveSuccess = true;
                $scope.approveError = false;
                init();
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
                init();
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
                    "desc": $scope.resourceBundle.uploadApprovalDataDesc + currentPeriodAndOrgUnit.period + ", Module: " + $scope.currentModule.name
                }, "dataValues");
            };

            var approvedBy = $scope.currentUser.userCredentials.username;

            approvalDataRepository.markAsApproved(currentPeriodAndOrgUnit, approvedBy)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
        };

        $scope.goOffline = function() {
            $scope.isOfflineApproval = true;
        };

        $rootScope.$watch("currentUser.selectedProject", function() {
            resetForm();
            init();
        });

        var init = function() {
            $scope.loading = true;
            $scope.isOfflineApproval = false;

            var loadAssociatedOrgUnitsAndPrograms = function() {
                return orgUnitRepository.findAllByParent([$scope.currentModule.id]).then(function(originOrgUnits) {
                    $scope.moduleAndOriginOrgUnitIds = _.pluck(_.flattenDeep([$scope.currentModule, originOrgUnits]), "id");
                    return programRepository.getProgramForOrgUnit(originOrgUnits[0].id).then(function(program) {
                        if (program) {
                            $scope.associatedProgramId = program.id;
                            $scope.isLineListModule = true;
                        }
                    });
                });
            };

            var loadExcludedDataElements = function() {
                return systemSettingRepository.get($scope.currentModule.id).then(function(systemSettings) {
                    $scope.excludedDataElements = systemSettings && systemSettings.value ? systemSettings.value.dataElements : undefined;
                });
            };

            var findallOrgUnits = function(orgUnits) {
                var orgUnitIds = _.pluck(orgUnits, "id");
                return orgUnitRepository.findAll(orgUnitIds);
            };

            if (_.isEmpty($scope.currentModule))
                return;
            return $q.all([loadAssociatedOrgUnitsAndPrograms(), loadExcludedDataElements()]).then(function() {

                var loadDataSetsPromise = datasetRepository.findAllForOrgUnits($scope.moduleAndOriginOrgUnitIds)
                    .then(_.curryRight(datasetRepository.includeDataElements)($scope.excludedDataElements))
                    .then(datasetRepository.includeCategoryOptionCombinations)
                    .then(function(datasets) {
                        $scope.dataSets = [];
                        return _.forEach(datasets, function(dataset) {
                            return findallOrgUnits(dataset.organisationUnits).then(function(orgunits) {
                                dataset.organisationUnits = orgunits;
                                $scope.dataSets.push(dataset);
                            });
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

                return $q.all([loadDataSetsPromise, loadDataValuesPromise, loadApprovalDataPromise]);
            }).finally(function() {
                $scope.loading = false;
            });
        };

        resetForm();
        init();
    };
});
