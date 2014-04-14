define(["lodash", "extractHeaders", "dataValuesMapper"], function(_, extractHeaders, dataValuesMapper) {
    return function($scope, $q, db, dataService, $anchorScroll, $location) {
        var dataSets, dataElements;

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var evaluateNumber = function(expression) {
            expression = expression.split("+").filter(function(e) {
                return e;
            });
            var sum = 0;
            _.each(expression, function(exp) {
                sum = sum + parseInt(exp);
            });
            return sum;
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

        $scope.resetForm = function() {
            $scope.dataValues = {};
            $scope.isopen = {};
            $scope.success = false;
            $scope.error = false;
        };

        $scope.sum = function(iterable) {
            return _.reduce(iterable, function(sum, currentValue) {
                exp = currentValue || "0";
                return sum + evaluateNumber(exp);
            }, 0);
        };

        $scope.maxcolumns = function(headers) {
            return _.last(headers).length;
        };

        var getPeriod = function() {
            return $scope.year + "W" + $scope.week.weekNumber;
        };

        $scope.save = function() {
            var period = getPeriod();
            var payload = dataValuesMapper.mapToDomain($scope.dataValues, period);
            var successPromise = function() {
                $scope.success = true;
            };

            var errorPromise = function() {
                $scope.error = true;
            };

            var insertToDhis = function() {
                return dataService.save(payload);
            };

            var saveToDb = function() {
                var dataValuesStore = db.objectStore("dataValues");
                return dataValuesStore.upsert(payload);
            };

            saveToDb().then(insertToDhis).then(successPromise, errorPromise);
            scrollToTop();
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var init = function() {
            $scope.resetForm();
            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");
            var comboPromise = getAll("categoryCombos");
            var categoriesPromise = getAll("categories");
            var categoryOptionCombosPromise = getAll("categoryOptionCombos");

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, comboPromise, categoriesPromise, categoryOptionCombosPromise]);

            var transformDataSet = function(data) {
                dataSets = data[0];
                dataElements = data[2];
                var sections = data[1];
                var categoryCombos = data[3];
                var categories = data[4];
                var categoryOptionCombos = data[5];

                var groupedSections = _.groupBy(sections, function(section) {
                    return section.dataSet.id;
                });

                var getDetailedCategory = function(category) {
                    return _.find(categories, function(c) {
                        return c.id === category.id;
                    });
                };

                var enrichDataElement = function(dataElement) {
                    var detailedDataElement = _.find(dataElements, function(d) {
                        return d.id === dataElement.id;
                    });
                    var detailedCategoryCombo = _.find(categoryCombos, function(c) {
                        return c.id === detailedDataElement.categoryCombo.id;
                    });

                    var detailedCategories = _.map(detailedCategoryCombo.categories, getDetailedCategory);
                    dataElement.categories = detailedCategories;
                    return dataElement;
                };

                $scope.groupedSections = _.mapValues(groupedSections, function(sections) {
                    return _.map(sections, function(section) {
                        section.dataElements = _.map(section.dataElements, enrichDataElement);
                        var result = extractHeaders(section.dataElements[0].categories, categoryOptionCombos);
                        section.headers = result.headers;
                        section.categoryOptionComboIds = result.categoryOptionComboIds;
                        return section;
                    });
                });
            };

            getAllData.then(transformDataSet);
        };

        init();
    };
});