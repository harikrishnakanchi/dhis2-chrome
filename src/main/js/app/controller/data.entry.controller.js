define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment"], function(_, dataValuesMapper, groupSections, orgUnitMapper, moment) {
    return function($scope, $q, $hustle, db, dataRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository, $timeout, orgUnitRepository) {
        var dataSets, systemSettings;
        $scope.validDataValuePattern = /^[0-9+]*$/;

        $scope.evaluateExpression = function(elementId, option) {
            if (!$scope.validDataValuePattern.test($scope.dataValues[elementId][option].value))
                return;
            var cellValue = $scope.dataValues[elementId][option].value;
            $scope.dataValues[elementId][option].formula = cellValue;
            $scope.dataValues[elementId][option].value = calculateSum(cellValue);
        };

        $scope.restoreExpression = function(elementId, option) {
            if (!$scope.validDataValuePattern.test($scope.dataValues[elementId][option].value))
                return;
            $scope.dataValues[elementId][option].value = $scope.dataValues[elementId][option].formula;
        };

        $scope.getDataSetName = function(id) {
            return _.find(dataSets, function(dataSet) {
                return id === dataSet.id;
            }).name;
        };

        $scope.safeGet = function(dataValues, id, option) {
            dataValues[id] = dataValues[id] || {};

            dataValues[id][option] = dataValues[id][option] || {
                'formula': '',
                'value': ''
            };
            return dataValues[id][option];
        };

        $scope.printWindow = function() {
            $scope.printingTallySheet = true;
            $timeout(function() {
                $window.print();
            }, 0);
        };

        var initDataEntryForm = function() {
            var projectId = $scope.currentModule.parent.id;
            $scope.projectIsAutoApproved = false;
            orgUnitRepository.getOrgUnit(projectId).then(function(orgUnit){
                var project = orgUnitMapper.mapToProject(orgUnit);
                $scope.projectIsAutoApproved = (project.autoApprove === "true");
            });

            approvalDataRepository.getLevelOneApprovalData(getPeriod(), $scope.currentModule.id, true).then(function(data) {
                $scope.isCompleted = !_.isEmpty(data);
            });

            approvalDataRepository.getLevelTwoApprovalData(getPeriod(), $scope.currentModule.id, true).then(function(data) {
                $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                $scope.isAccepted = !_.isEmpty(data) && data.isAccepted;
            });

            dataRepository.getDataValues(getPeriod(), $scope.currentModule.id).then(function(data) {
                data = data || {};
                $scope.dataValues = dataValuesMapper.mapToView(data);
                $scope.isSubmitted = (!_.isEmpty(data) && !data.isDraft);
                $scope.isDataFormInitialized = true;
            });

            var datasetsAssociatedWithModule = _.pluck(_.filter(dataSets, {
                'organisationUnits': [{
                    'id': $scope.currentModule.id
                }]
            }), 'id');

            $scope.currentGroupedSections = _.pick($scope.groupedSections, datasetsAssociatedWithModule);
            var selectedDatasets = _.keys($scope.currentGroupedSections);
            _.each(selectedDatasets, function(selectedDataset) {
                $scope.currentGroupedSections[selectedDataset] = groupSections.filterDataElements($scope.currentGroupedSections[selectedDataset], $scope.currentModule.id, systemSettings, $scope.currentModule.parent.id);
            });

            if ($scope.dataentryForm !== undefined)
                $scope.dataentryForm.$setPristine();
        };

        $scope.$watchCollection('[week, currentModule]', function() {
            if ($scope.week && $scope.currentModule) {
                initDataEntryForm();
            }
        });

        $scope.getDatasetState = function(id, isFirst) {
            if (isFirst && !(id in $scope.isDatasetOpen)) {
                $scope.isDatasetOpen[id] = true;
            }
            return $scope.isDatasetOpen;
        };

        $scope.resetForm = function() {
            $scope.dataValues = {};
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isDataFormInitialized = false;
            $scope.saveSuccess = false;
            $scope.saveError = false;
            $scope.submitSuccess = false;
            $scope.submitAndApprovalSuccess = false;
            $scope.submitError = false;
            $scope.approveSuccess = false;
            $scope.approveError = false;
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

        $scope.saveAsDraft = function() {
            var successPromise = function() {
                $scope.saveSuccess = true;
                $scope.submitSuccess = false;
                initDataEntryForm();
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
                initDataEntryForm();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            if ($scope.isCompleted || $scope.isApproved) {
                showModal(function() {
                    save(false).then(successPromise, errorPromise);
                }, $scope.resourceBundle.reapprovalConfirmationMessage);
            } else {
                save(false).then(successPromise, errorPromise);
            }
        };

        $scope.submitAndApprove = function() {
            var successPromise = function() {
                $scope.saveSuccess = false;
                $scope.submitAndApprovalSuccess = true;
                initDataEntryForm();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            if ($scope.isCompleted || $scope.isApproved) {
                showModal(function() {
                    save(false).then(markDataAsComplete).then(markDataAsApproved).then(successPromise, errorPromise);
                }, $scope.resourceBundle.reapprovalConfirmationMessage);
            } else {
                save(false).then(markDataAsComplete).then(markDataAsApproved).then(successPromise, errorPromise);
            }
        };

        $scope.firstLevelApproval = function() {
            var onSuccess = function() {
                $scope.approveSuccess = true;
                $scope.approveError = false;
                initDataEntryForm();
            };

            var onError = function() {
                $scope.approveSuccess = false;
                $scope.approveError = true;
            };

            showModal(function() {
                markDataAsComplete().then(onSuccess, onError);
            }, $scope.resourceBundle.dataApprovalConfirmationMessage);
        };

        $scope.secondLevelApproval = function() {
            var onSuccess = function() {
                $scope.approveSuccess = true;
                $scope.approveError = false;
                initDataEntryForm();
            };

            var onError = function() {
                $scope.approveSuccess = false;
                $scope.approveError = true;
            };

            showModal(function() {
                markDataAsApproved().then(onSuccess, onError);
            }, $scope.resourceBundle.dataApprovalConfirmationMessage);
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        var approveData = function(approvalData, approvalFn, approvalType) {
            var saveToDhis = function() {
                return $hustle.publish({
                    "data": approvalData,
                    "type": approvalType
                }, "dataValues");
            };

            return approvalFn(approvalData).then(saveToDhis).
            finally(scrollToTop);
        };

        var markDataAsComplete = function() {
            var dataForApproval = {
                "dataSets": _.keys($scope.currentGroupedSections),
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id,
                "storedBy": $scope.currentUser.userCredentials.username,
                "date": moment().toISOString(),
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelOneApproval, "uploadCompletionData");
        };

        var markDataAsApproved = function() {
            var dataForApproval = {
                "dataSets": _.keys($scope.currentGroupedSections),
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id,
                "createdByUsername": $scope.currentUser.userCredentials.username,
                "createdDate": moment().toISOString(),
                "isApproved": true,
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelTwoApproval, "uploadApprovalData");
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

        var save = function(asDraft) {
            var period = getPeriod();

            var saveToDhis = function(data) {
                return $hustle.publish({
                    "data": data,
                    "type": "uploadDataValues"
                }, "dataValues");
            };

            var unapproveData = function(payload) {
                var saveCompletionToDhis = function(approvalData) {
                    if (!approvalData) return;
                    return $hustle.publish({
                        "data": approvalData,
                        "type": "uploadCompletionData"
                    }, "dataValues");
                };

                var saveApprovalToDhis = function(approvalData) {
                    if (!approvalData) return;
                    return $hustle.publish({
                        "data": approvalData,
                        "type": "uploadApprovalData"
                    }, "dataValues");
                };

                var unapproveLevelOne = function() {
                    return approvalDataRepository.unapproveLevelOneData(period, $scope.currentModule.id).then(saveCompletionToDhis);
                };

                var unapproveLevelTwo = function() {
                    return approvalDataRepository.unapproveLevelTwoData(period, $scope.currentModule.id).then(saveApprovalToDhis);
                };

                return unapproveLevelTwo().then(unapproveLevelOne).then(function() {
                    return payload;
                });
            };

            var payload = dataValuesMapper.mapToDomain($scope.dataValues, period, $scope.currentModule.id, $scope.currentUser.userCredentials.username);
            if (asDraft) {
                return dataRepository.saveAsDraft(payload);
            } else {
                return dataRepository.save(payload).then(unapproveData).then(saveToDhis);
            }
        };

        var confirmAndMove = function(okCallback) {
            var modalInstance = $modal.open({
                templateUrl: 'templates/save.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        var deregisterSelf = $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
            var okCallback = function() {
                deregisterSelf();
                $location.url(newUrl);
            };
            if ($scope.preventNavigation) {
                confirmAndMove(okCallback);
                event.preventDefault();
            }
        });

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

        var getPeriod = function() {
            return $scope.year + "W" + $scope.week.weekNumber;
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var setData = function(data) {
            dataSets = data[0];
            systemSettings = data[6];
            return data;
        };

        var transformDataSet = function(data) {
            $scope.groupedSections = groupSections.enrichGroupedSections(data);
            return data;
        };

        var setAvailableModules = function() {
            orgUnitRepository.getAllModulesInProjects(_.pluck($rootScope.currentUser.organisationUnits, "id")).then(function(modules) {
                $scope.modules = _.reject(modules, function(module) {
                    var isDisabledAttribute = _.find(module.attributeValues, {
                        'attribute': {
                            'code': 'isDisabled'
                        }
                    });
                    return isDisabledAttribute && isDisabledAttribute.value;
                });
            });
        };

        var init = function() {
            $scope.resetForm();
            $location.hash('top');
            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");
            var comboPromise = getAll("categoryCombos");
            var categoriesPromise = getAll("categories");
            var categoryOptionCombosPromise = getAll("categoryOptionCombos");
            var systemSettingsPromise = getAll('systemSettings');
            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, comboPromise, categoriesPromise, categoryOptionCombosPromise, systemSettingsPromise]);
            getAllData.then(setData).then(transformDataSet);
            setAvailableModules();
        };

        init();
    };
});