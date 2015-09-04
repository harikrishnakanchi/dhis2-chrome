define(["lodash", "dataValuesMapper", "orgUnitMapper", "moment", "properties"], function(_, dataValuesMapper, orgUnitMapper, moment, properties) {
    return function($scope, $routeParams, $q, $hustle, $anchorScroll, $location, $modal, $rootScope, $window, $timeout,
        dataRepository, excludedDataElementsRepository, approvalDataRepository, orgUnitRepository, datasetRepository, programRepository, referralLocationsRepository) {

        var currentPeriod, currentPeriodAndOrgUnit, catOptComboIdsToBeTotalled;
        var removeReferral = false;
        $scope.rowTotal = {};

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
            $scope.rowTotal = {};
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
                    $scope.cancelSubmit = false;
                    return okCallback();
                }, function() {
                    $scope.cancelSubmit = true;
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

        $scope.sum = function(iterable, dataElementId) {
            var sum = _.reduce(iterable, function(sum, currentOption, catOptComboId) {
                if (_.contains(catOptComboIdsToBeTotalled, catOptComboId)) {
                    exp = currentOption.value || "0";
                    return sum + calculateSum(exp);
                } else {
                    return sum;
                }
            }, 0);
            $scope.rowTotal[dataElementId] = sum;
            return sum;
        };

        var getReferralDataElementIds = function(dataElements) {
            var dataElementsForReferral = _.filter(dataElements, function(de) {
                return $scope.referralLocations[de.formName] !== undefined;
            });

            return _.pluck(dataElementsForReferral, "id");
        };

        $scope.columnSum = function(iterable, section, option, isReferralDataset) {
            var dataElementsIds = isReferralDataset ? getReferralDataElementIds(section.dataElements) : _.pluck(section.dataElements, "id");
            return _.reduce(iterable, function(sum, value, key) {
                if (_.includes(dataElementsIds, key)) {
                    exp = value[option].value || "0";
                    return sum + calculateSum(exp);
                } else {
                    return sum;
                }
            }, 0);
        };

        $scope.totalSum = function(section) {
            var dataElementsIds = _.pluck(section.dataElements, "id");
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
                if (values) {
                    var value = values[section.dataElements[0].id][section.categoryOptionComboIds[0]].value || "0";
                    sum += parseInt(value);
                }
            });
            return sum;
        };

        $scope.maxcolumns = function(headers) {
            return _.last(headers).length;
        };

        var save = function(asDraft) {
            var updateDataValuesWithPopulationData = function() {
                var currentModuleId = $scope.selectedModule.id;
                var populationDataset = _.find($scope.dataSets, {
                    "isPopulationDataset": true
                });
                if (populationDataset) {
                    var categoryOptionComboId = populationDataset.sections[0].categoryOptionComboIds[0];
                    _.forEach(populationDataset.sections[0].dataElements, function(dataElement) {
                        $scope.dataValues[currentModuleId][dataElement.id] = !$scope.dataValues[currentModuleId][dataElement.id] ? {} : $scope.dataValues[currentModuleId][dataElement.id];
                        var code = dataElement.code.split("_")[1];
                        var value = _.isEmpty($scope.projectPopulationDetails[code]) ? "0" : $scope.projectPopulationDetails[code];
                        $scope.dataValues[currentModuleId][dataElement.id][categoryOptionComboId] = {
                            "formula": value,
                            "value": value
                        };
                    });
                }

            };

            updateDataValuesWithPopulationData();
            var payload = dataValuesMapper.mapToDomain($scope.dataValues, currentPeriod, $scope.currentUser.userCredentials.username);

            var publishToDhis = function() {

                var deleteApprovals = function() {
                    return $hustle.publish({
                        "data": currentPeriodAndOrgUnit,
                        "type": "deleteApprovals",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.deleteApprovalsDesc + currentPeriod + ", " + $scope.selectedModule.name
                    }, "dataValues");
                };

                var uploadDataValues = function() {
                    return $hustle.publish({
                        "data": payload,
                        "type": "uploadDataValues",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadDataValuesDesc + currentPeriod + ", " + $scope.selectedModule.name
                    }, "dataValues");
                };

                return deleteApprovals()
                    .then(uploadDataValues);
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
                if (!$scope.cancelSubmit)
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
                if (!$scope.cancelSubmit)
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
                var uploadCompletion = function() {
                    return $hustle.publish({
                        "data": [currentPeriodAndOrgUnit],
                        "type": "uploadCompletionData",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadCompletionDataDesc + currentPeriod + ", " + $scope.selectedModule.name
                    }, "dataValues");
                };

                var uploadApproval = function() {
                    return $hustle.publish({
                        "data": [currentPeriodAndOrgUnit],
                        "type": "uploadApprovalData",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadApprovalDataDesc + currentPeriod + ", " + $scope.selectedModule.name
                    }, "dataValues");
                };

                return uploadCompletion()
                    .then(uploadApproval);
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

        var deregisterDirtyFormWatcher = $scope.$watch('dataentryForm.$dirty', function(dirty) {
            if (dirty) {
                $scope.preventNavigation = true;
            } else {
                $scope.preventNavigation = false;
            }
        });

        var deregisterErrorInfoListener = $scope.$on('errorInfo', function(event, errorMessage) {
            $scope.errorMessage = errorMessage;
        });

        var initializeForm = function() {
            $scope.loading = true;
            currentPeriod = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
            $scope.isDataEntryAllowed = moment($scope.week.startOfWeek).isAfter(moment().subtract(properties.projectDataSync.numWeeksToSync, 'week'));
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

            var extractPopulationDetails = function(orgUnitAttrs) {
                var populationDataCodes = ["population", "proportionOfChildrenLessThan1YearOld", "proportionOfChildrenLessThan5YearsOld", "proportionOfWomenOfChildBearingAge"];
                var populationDetails = {};
                _.forEach(orgUnitAttrs, function(attr) {
                    if (_.includes(populationDataCodes, attr.attribute.code)) {
                        populationDetails[attr.attribute.code] = attr.value;
                    }
                });
                return populationDetails;
            };

            return $q.all([loadAssociatedOrgUnitsAndPrograms(), loadExcludedDataElements(), loadRefferalLocations()]).then(function() {
                var loadDataSetsPromise = datasetRepository.findAllForOrgUnits($scope.moduleAndOriginOrgUnitIds)
                    .then(_.curryRight(datasetRepository.includeDataElements)($scope.excludedDataElements))
                    .then(datasetRepository.includeCategoryOptionCombinations)
                    .then(function(data) {
                        var datasets = data.enrichedDataSets;
                        catOptComboIdsToBeTotalled = data.catOptComboIdsToBeTotalled;
                        var dataSetPromises = _.map(datasets, function(dataset) {
                            return findallOrgUnits(dataset.organisationUnits).then(function(orgunits) {
                                dataset.organisationUnits = orgunits;
                                return dataset;
                            });
                        });
                        return $q.all(dataSetPromises).then(function(datasets) {
                            if (removeReferral)
                                $scope.dataSets = _.filter(datasets, {
                                    "isReferralDataset": false
                                });
                            else
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

                var loadProjectPromise = orgUnitRepository.getParentProject($scope.selectedModule.id).then(function(orgUnit) {
                    $scope.projectIsAutoApproved = _.any(orgUnit.attributeValues, {
                        'attribute': {
                            'code': "autoApprove"
                        },
                        "value": "true"
                    });
                    $scope.projectPopulationDetails = extractPopulationDetails(orgUnit.attributeValues);
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

        var deregisterModuleWeekInfoListener = $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            $scope.errorMessage = undefined;
            resetForm();
            initializeForm();
        });

        $scope.$on('$destroy', function() {
            deregisterErrorInfoListener();
            deregisterModuleWeekInfoListener();
            deregisterDirtyFormWatcher();
        });

        var init = function() {
            $scope.dataType = "aggregate";
        };

        resetForm();
        init();
    };
});
