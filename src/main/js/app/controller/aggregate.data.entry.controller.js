define(["lodash", "dataValuesMapper", "orgUnitMapper", "moment", "properties"], function(_, dataValuesMapper, orgUnitMapper, moment, properties) {
    return function($scope, $routeParams, $q, $hustle, $anchorScroll, $location, $modal, $rootScope, $window, $timeout,
        dataRepository, systemSettingRepository, approvalDataRepository, orgUnitRepository, datasetRepository, programRepository) {

        var currentPeriod, currentPeriodAndOrgUnit;

        var resetForm = function() {
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isSubmitted = false;
            $scope.saveSuccess = false;
            $scope.submitSuccess = false;
            $scope.submitAndApprovalSuccess = false;
            $scope.saveError = false;
            $scope.submitError = false;
            $scope.projectIsAutoApproved = false;
            $scope.excludedDataElements = {};
            $scope.associatedProgramId = undefined;
        };

        $scope.printWindow = function() {
            $scope.printingTallySheet = true;
            $timeout(function() {
                $window.print();
            }, 0);
        };

        var confirmAndProceed = function(okCallback, message, doNotConfirm) {
            if (doNotConfirm)
                return $q.when(okCallback());

            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            return modalInstance.result
                .then(function() {
                    return okCallback();
                }, function() {
                    //burp on cancel
                });
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var calculateSum = function(cellValue) {
            if (!cellValue)
                return 0;

            cellValue = cellValue.toString().split("+").filter(function(e) {
                return e;
            });
            return _.reduce(cellValue, function(sum, exp) {
                return sum + parseInt(exp);
            }, 0);
        };

        $scope.safeGet = function(dataValues, id, option, orgUnitId) {
            if (dataValues === undefined)
                return;

            dataValues[orgUnitId] = dataValues[orgUnitId] || {};
            dataValues[orgUnitId][id] = dataValues[orgUnitId][id] || {};

            dataValues[orgUnitId][id][option] = dataValues[orgUnitId][id][option] || {
                'formula': '',
                'value': ''
            };
            return dataValues[orgUnitId][id][option];
        };

        $scope.validDataValuePattern = /^[0-9+]*$/;

        $scope.evaluateExpression = function(orgUnit, elementId, option) {
            if (!$scope.validDataValuePattern.test($scope.dataValues[orgUnit][elementId][option].value))
                return;
            var cellValue = $scope.dataValues[orgUnit][elementId][option].value;
            $scope.dataValues[orgUnit][elementId][option].formula = cellValue;
            $scope.dataValues[orgUnit][elementId][option].value = calculateSum(cellValue).toString();
        };

        $scope.restoreExpression = function(orgUnit, elementId, option) {
            if (!$scope.validDataValuePattern.test($scope.dataValues[orgUnit][elementId][option].value))
                return;
            $scope.dataValues[orgUnit][elementId][option].value = $scope.dataValues[orgUnit][elementId][option].formula;
        };

        $scope.getDatasetState = function(id, isFirst) {
            if (isFirst && !(id in $scope.isDatasetOpen)) {
                $scope.isDatasetOpen[id] = true;
            }
            return $scope.isDatasetOpen;
        };

        $scope.sum = function(iterable) {
            return _.reduce(iterable, function(sum, currentOption) {
                exp = currentOption.value || "0";
                return sum + calculateSum(exp);
            }, 0);
        };

        $scope.maxcolumns = function(headers) {
            return _.last(headers).length;
        };

        var save = function(asDraft) {

            var payload = dataValuesMapper.mapToDomain($scope.dataValues, currentPeriod, $scope.currentUser.userCredentials.username);

            var publishToDhis = function() {
                var uploadDataValuesPromise = $hustle.publish({
                    "data": payload,
                    "type": "uploadDataValues",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadDataValuesDesc + currentPeriod + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                var deleteApprovalsPromise = $hustle.publish({
                    "data": currentPeriodAndOrgUnit,
                    "type": "deleteApprovals",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.deleteApprovalsDesc + currentPeriod + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                return $q.all([uploadDataValuesPromise, deleteApprovalsPromise]);
            };

            if (asDraft) {
                return dataRepository.saveAsDraft(payload);
            } else {
                return dataRepository.save(payload)
                    .then(_.partial(approvalDataRepository.clearApprovals, currentPeriodAndOrgUnit))
                    .then(publishToDhis);
            }
        };


        $scope.saveAsDraft = function() {
            var successPromise = function() {
                $scope.saveSuccess = true;
                $scope.submitSuccess = false;
                init();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = true;
                $scope.submitError = false;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            save(true).then(successPromise, errorPromise);
        };

        $scope.submit = function() {
            var successPromise = function() {
                $scope.saveSuccess = false;
                $scope.submitSuccess = true;
                initializeForm();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.reapprovalConfirmationMessage
            };

            confirmAndProceed(_.partial(save, false), modalMessages, !($scope.isCompleted || $scope.isApproved))
                .then(successPromise, errorPromise);
        };

        $scope.submitAndApprove = function() {

            var completedAndApprovedBy = $scope.currentUser.userCredentials.username;

            var successPromise = function() {
                $scope.saveSuccess = false;
                $scope.submitAndApprovalSuccess = true;
                initializeForm();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            var publishToDhis = function() {
                var uploadCompletionPromise = $hustle.publish({
                    "data": [currentPeriodAndOrgUnit],
                    "type": "uploadCompletionData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadCompletionDataDesc + currentPeriod + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                var uploadApprovalPromise = $hustle.publish({
                    "data": [currentPeriodAndOrgUnit],
                    "type": "uploadApprovalData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadApprovalDataDesc + currentPeriod + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                return $q.all([uploadCompletionPromise, uploadApprovalPromise]);
            };

            var upsertAndPushToDhis = function() {
                save(false)
                    .then(_.partial(approvalDataRepository.markAsApproved, currentPeriodAndOrgUnit, completedAndApprovedBy))
                    .then(publishToDhis);
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.reapprovalConfirmationMessage
            };

            confirmAndProceed(upsertAndPushToDhis, modalMessages, !($scope.isCompleted || $scope.isApproved))
                .then(successPromise, errorPromise);
        };

        $scope.isCurrentWeekSelected = function(week) {
            var today = moment().format("YYYY-MM-DD");
            if (week && today >= week.startOfWeek && today <= week.endOfWeek)
                return true;
            return false;
        };

        $scope.$watch('dataentryForm.$dirty', function(dirty) {
            if (dirty) {
                $scope.preventNavigation = true;
            } else {
                $scope.preventNavigation = false;
            }
        });

        $scope.isDataEntryAllowed = function() {
            return moment($scope.week.startOfWeek).isAfter(moment().subtract(properties.projectDataSync.numWeeksToSync, 'week'));
        };

        $scope.$on('errorInfo', function(event, errorMessage) {
            $scope.errorMessage = errorMessage;
        });

        var initializeForm = function() {
            $scope.loading = true;
            currentPeriod = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
            currentPeriodAndOrgUnit = {
                "period": currentPeriod,
                "orgUnit": $scope.selectedModule.id
            };

            var loadAssociatedOrgUnitsAndPrograms = function() {
                return orgUnitRepository.findAllByParent([$scope.selectedModule.id]).then(function(originOrgUnits) {
                    $scope.moduleAndOriginOrgUnitIds = _.pluck(_.flattenDeep([$scope.selectedModule, originOrgUnits]), "id");
                    return programRepository.getProgramForOrgUnit(originOrgUnits[0].id).then(function(program) {
                        if (program)
                            $scope.associatedProgramId = program.id;
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

                var loadProjectPromise = orgUnitRepository.getParentProject($scope.selectedModule.id).then(function(orgUnit) {
                    $scope.projectIsAutoApproved = _.any(orgUnit.attributeValues, {
                        'attribute': {
                            'code': "autoApprove"
                        },
                        "value": "true"
                    });
                });

                var loadApprovalDataPromise = approvalDataRepository.getApprovalData(currentPeriodAndOrgUnit).then(function(data) {
                    $scope.isCompleted = !_.isEmpty(data) && data.isComplete;
                    $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                });

                if ($scope.dataentryForm !== undefined)
                    $scope.dataentryForm.$setPristine();

                return $q.all([loadDataSetsPromise, loadDataValuesPromise, loadProjectPromise, loadApprovalDataPromise]);

            }).finally(function() {
                $scope.loading = false;
            });
        };

        $scope.$on('moduleWeekInfo', function(event, data) {

            $scope.selectedModule = data[0];
            $scope.week = data[1];
            $scope.errorMessage = undefined;
            resetForm();
            initializeForm();
        });

        var init = function() {
            $scope.isAggregateData = true;
        };

        resetForm();
        init();
    };
});
