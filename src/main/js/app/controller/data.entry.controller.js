define(["lodash"], function(_) {
    return function($scope, $q, db) {
        var dataSets;
        $scope.sectionValues = {};

        $scope.sum = function(iterable) {
            return _.reduce(iterable, function(sum, currentValue) {
                return sum + currentValue;
            }, 0);
        };

        $scope.getDataSetName = function(id) {
            return _.find(dataSets, function(dataSet) {
                return id === dataSet.id;
            }).name;
        };

        var getCategoryCombinations = function(categories) {
            var totalNumberOfRows = _.reduce(categories, function(numberOfRows, category) {
                return numberOfRows * category.categoryOptions.length;
            }, 1);

            var newCategories = _.map(categories, function() {
                return [];
            });

            _.times(totalNumberOfRows, function(i) {
                var j = 1;
                _.each(categories, function(category, index) {
                    var len = category.categoryOptions.length;
                    newCategories[index].push(category.categoryOptions[Math.floor(i / j) % len]);
                    j = j * len;
                });
            });

            return newCategories;
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var init = function() {
            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");
            var comboPromise = getAll("categoryCombos");
            var categoriesPromise = getAll("categories");
            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, comboPromise, categoriesPromise]);
            var transformDataSet = function(data) {
                dataSets = data[0];
                var sections = data[1];
                var dataElements = data[2];
                var categoryCombos = data[3];
                var categories = data[4];

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

                    dataElement.categories = getCategoryCombinations(_.map(detailedCategoryCombo.categories, getDetailedCategory));
                    return dataElement;
                };

                $scope.groupedSections = _.mapValues(groupedSections, function(sections) {
                    return _.map(sections, function(section) {
                        section.dataElements = _.map(section.dataElements, enrichDataElement);
                        return section;
                    });
                });

                $scope.sectionValues = _.reduce(sections, function(reducedObject, section) {
                    reducedObject[section.id] = _.reduce(section.dataElements, function(reducedDataElements, dataElement) {
                        reducedDataElements[dataElement.id] = {};
                        return reducedDataElements;
                    }, {});
                    return reducedObject;
                }, {});
            };

            getAllData.then(transformDataSet);
        };

        init();
    };
});