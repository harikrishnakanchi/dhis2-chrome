define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment"], function(_, dataValuesMapper, groupSections, orgUnitMapper, moment) {
    return function($scope, $q, db, dataService, $anchorScroll, $location, $modal) {
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

        $scope.$watchCollection('[week, currentModule]', function() {
            if ($scope.week && $scope.currentModule) {
                var datasetsAssociatedWithModule = _.pluck(_.filter(dataSets, {
                    'organisationUnits': [{
                        'id': $scope.currentModule.id
                    }]
                }), 'id');
                $scope.currentGroupedSections = _.pick($scope.groupedSections, datasetsAssociatedWithModule);
                var store = db.objectStore('dataValues');
                store.find([getPeriod(), $scope.currentModule.id]).then(function(data) {
                    data = data || {};
                    $scope.dataValues = dataValuesMapper.mapToView(data);
                });
                var selectedDatasets = _.keys($scope.currentGroupedSections);
                _.each(selectedDatasets, function(selectedDataset) {
                    $scope.currentGroupedSections[selectedDataset] = groupSections.filterDataElements($scope.currentGroupedSections[selectedDataset], $scope.currentModule.id, systemSettings, $scope.currentModule.parent.id);
                });

                $scope.dataentryForm.$setPristine();
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
            $scope.saveSuccess = false;
            $scope.saveError = false;
            $scope.submitSuccess = false;
            $scope.submitError = false;
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

        var save = function(asDraft) {
            var period = getPeriod();
            var payload = dataValuesMapper.mapToDomain($scope.dataValues, period, $scope.currentModule.id);
            var successPromise = function() {
                $scope.saveSuccess = asDraft ? true : false;
                $scope.submitSuccess = !asDraft ? true : false;
                $scope.dataentryForm.$setPristine();
            };

            var errorPromise = function() {
                $scope.saveError = asDraft ? true : false;
                $scope.submitError = !asDraft ? true : false;
            };

            var pushToDhis = function() {
                if (!asDraft) {
                    return dataService.save(payload);
                }
            };

            var saveToDb = function() {
                var dataValuesStore = db.objectStore("dataValues");
                return dataValuesStore.upsert(payload);
            };

            saveToDb().then(pushToDhis).then(successPromise, errorPromise);
            scrollToTop();
        };

        $scope.isCurrentWeekSelected = function(week) {
            var today = moment().format("YYYY-MM-DD");
            if (week && today >= week.startOfWeek && today <= week.endOfWeek)
                return true;
            return false;
        };

        var confirmAndMove = function(okCallback) {
            var modalInstance = $modal.open({
                templateUrl: 'templates/save.dialog.html',
                controller: 'saveDialogController',
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

        $scope.$watch('dataentryForm.$dirty', function(dirty) {
            if (dirty) {
                $scope.preventNavigation = true;
            } else {
                $scope.preventNavigation = false;
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

        var filterModules = function(modules) {
            $scope.modules = orgUnitMapper.filterModules(modules);
            return $scope.modules;
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
            getOrgUnits.then(filterModules);
        };

        init();
    };
});