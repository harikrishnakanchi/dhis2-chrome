define(["lodash"], function(_) {
    return function($scope, $q, db) {
        var dataSets;
        $scope.sectionValues = {};
        $scope.isopen = {};

        $scope.sum = function(iterable) {
            return _.reduce(iterable, function(sum, currentValue) {
                exp = currentValue || "0";
                return sum + evaluateNumber(exp);
            }, 0);
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

        $scope.getDataEntryCells = function(category) {
            return new Array(category.repeat * category.span * category.options.length);
        };

        $scope.getRepeated = function(list, num) {
            return _.flatten(_.times(num, function() {
                return list;
            }));
        };

        var getCategories = function(lists) {
            var totalNumberOfRows = _.reduce(lists, function(numberOfRows, list) {
                return numberOfRows * list.length;
            }, 1);

            var prevLength = 1;
            return _.map(lists, function(list) {
                var cat = {
                    span: totalNumberOfRows / (prevLength * list.length),
                    repeat: prevLength,
                    options: list
                };
                prevLength = prevLength * list.length;
                return cat;
            });
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
                    var detailedCategories = _.map(detailedCategoryCombo.categories, getDetailedCategory);
                    dataElement.categories = getCategories(_.pluck(detailedCategories, "categoryOptions"));
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