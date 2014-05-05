define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper"], function(_, dataValuesMapper, groupSections, orgUnitMapper) {
    return function($scope, $q, db, dataService, $anchorScroll, $location, $modal) {
        $scope.organisationUnit = {
            id: "proj_104"
        };

        $scope.evaluateExpression = function(elementId, option) {
            var cellValue = $scope.dataValues[elementId][option];
            $scope.dataValues[elementId][option] = calculateSum(cellValue);
            return $scope.dataValues[elementId][option];
        };

        $scope.getDataSetName = function(id) {
            return _.find(dataSets, function(dataSet) {
                return id === dataSet.id;
            }).name;
        };

        $scope.safeGet = function(dataValues, id) {
            dataValues[id] = dataValues[id] || {};
            return dataValues[id];
        };

        $scope.$watch('week', function() {
            if ($scope.week) {
                var store = db.objectStore('dataValues');
                store.find(getPeriod()).then(function(data) {
                    data = data || {};
                    $scope.dataValues = dataValuesMapper.mapToView(data);
                });
            }
        });

        $scope.resetForm = function() {
            $scope.dataValues = {};
            $scope.isopen = {};
            $scope.success = false;
            $scope.error = false;
        };

        $scope.sum = function(iterable) {
            return _.reduce(iterable, function(sum, currentValue) {
                exp = currentValue || "0";
                return sum + calculateSum(exp);
            }, 0);
        };

        $scope.maxcolumns = function(headers) {
            return _.last(headers).length;
        };

        $scope.save = function() {
            var period = getPeriod();
            var payload = dataValuesMapper.mapToDomain($scope.dataValues, period, $scope.organisationUnit.id);
            var successPromise = function() {
                $scope.success = true;
            };

            var errorPromise = function() {
                $scope.error = true;
            };

            var pushToDhis = function() {
                return dataService.save(payload);
            };

            var saveToDb = function() {
                var dataValuesStore = db.objectStore("dataValues");
                return dataValuesStore.upsert(payload);
            };

            saveToDb().then(pushToDhis).then(successPromise, errorPromise);
            scrollToTop();
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var calculateSum = function(cellValue) {
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

        var setDataSets = function(data) {
            dataSets = data[0];
            return data;
        };

        var transformDataSet = function(data) {
            $scope.groupedSections = groupSections(data).groupedSections;
            return data;
        };

        var filterModules = function(modules) {
            $scope.modules = orgUnitMapper.filterModules(modules);
            return $scope.modules;
        };

        var init = function() {
            $scope.resetForm();
            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");
            var comboPromise = getAll("categoryCombos");
            var categoriesPromise = getAll("categories");
            var categoryOptionCombosPromise = getAll("categoryOptionCombos");
            var systemSettingsPromise = getAll('systemSettings');
            var getOrgUnits = getAll('organisationUnits');
            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, comboPromise, categoriesPromise, categoryOptionCombosPromise, systemSettingsPromise]);
            getAllData.then(setDataSets).then(transformDataSet);
            getOrgUnits.then(filterModules);
        };

        init();
    };
});