define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment"], function(_, dataValuesMapper, groupSections, orgUnitMapper, moment) {
    return function($scope, $q, $hustle, db, dataRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalService) {
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
            $window.print();
        };

        var initDataEntryForm = function() {
            dataRepository.getCompleteDataValues(getPeriod(), $scope.currentModule.id).then(function(data) {
                if (_.isEmpty(data)) {
                    $scope.isApproved = false || $scope.approveSuccess;
                } else {
                    $scope.isApproved = true;
                }
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

        $scope.submit = function() {
            save(false);
        };

        $scope.saveAsDraft = function() {
            save(true);
        };

        $scope.firstLevelApproval = function() {
            var modalInstance = $modal.open({
                templateUrl: 'templates/approve.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            var okCallback = function() {
                markDataAsComplete();
            };

            modalInstance.result.then(okCallback);
        };

        var markDataAsComplete = function() {
            var dataForApproval = {
                "dataSets": _.keys($scope.currentGroupedSections),
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id,
                "storedBy": $scope.currentUser.userCredentials.username,
                "date": moment().toISOString()
            };
            var onSuccess = function() {
                $scope.approveSuccess = true;
                $scope.approveError = false;
                initDataEntryForm();
            };

            var onError = function() {
                $scope.approveSuccess = false;
                $scope.approveError = true;
            };

            var markAllDataAsComplete = function() {
                return approvalService.saveCompletionToDB(dataForApproval);
            };

            var saveToDhis = function() {
                return $hustle.publish({
                    "data": dataForApproval,
                    "type": "uploadApprovalData"
                }, "dataValues");
            };

            markAllDataAsComplete().then(saveToDhis).then(onSuccess, onError).
            finally(scrollToTop);
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

        var saveToDhis = function(data) {
            return $hustle.publish({
                "data": data,
                "type": "uploadDataValues"
            }, "dataValues");
        };

        var save = function(asDraft) {
            var successPromise = function() {
                $scope.saveSuccess = asDraft ? true : false;
                $scope.submitSuccess = !asDraft ? true : false;
                initDataEntryForm();
            };

            var errorPromise = function() {
                $scope.saveError = asDraft ? true : false;
                $scope.submitError = !asDraft ? true : false;
                $scope.isSubmitted = false;
            };
            var period = getPeriod();
            var payload = dataValuesMapper.mapToDomain($scope.dataValues, period, $scope.currentModule.id, $scope.currentUser.userCredentials.username);
            if (asDraft) {
                dataRepository.saveAsDraft(payload).then(successPromise, errorPromise);
            } else {
                dataRepository.save(payload).then(saveToDhis).then(successPromise, errorPromise);
            }
            scrollToTop();
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

        var setAvailableModules = function(orgUnits) {
            var getUserModules = function(modules) {
                return _.filter(modules, function(module) {
                    return _.any($rootScope.currentUser.organisationUnits, {
                        'id': module.parent.id
                    });
                });
            };

            var getModulesUnderOpUnits = function(allModules) {
                var filteredModules = [];
                _.forEach(allModules, function(module) {
                    var moduleParents = _.filter(orgUnits, {
                        'id': module.parent.id,
                        'attributeValues': [{
                            'attribute': {
                                id: "a1fa2777924"
                            },
                            value: "Operation Unit"
                        }]
                    });
                    var modules = getUserModules(moduleParents);
                    if (!_.isEmpty(modules))
                        filteredModules.push(module);
                });
                return filteredModules;
            };

            var allModules = orgUnitMapper.filterModules(orgUnits);
            $scope.modules = getUserModules(allModules);

            $scope.modules = $scope.modules.concat(getModulesUnderOpUnits(allModules));
            return orgUnits;
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
            var getOrgUnits = getAll('organisationUnits');
            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, comboPromise, categoriesPromise, categoryOptionCombosPromise, systemSettingsPromise]);
            getAllData.then(setData).then(transformDataSet);
            getOrgUnits.then(setAvailableModules);
        };

        init();
    };
});