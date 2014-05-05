define(["lodash", "orgUnitMapper", "moment", "md5"], function(_, orgUnitMapper, moment, md5) {
    return function($scope, orgUnitService, db, $location, $q) {
        var init = function() {
            var leftPanedatasets = [];
            $scope.isopen = {};
            $scope.isCollapsed = true;
            $scope.selectedDataElements = {};
            $scope.selectedSections = {};

            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");

            var populateElements = function(data) {
                $scope.allDatasets = data[0];
                var sections = data[1];
                var allDataElements = data[2];

                var groupedSections = _.groupBy(sections, function(section) {
                    return section.dataSet.id;
                });

                var enrichDataElement = function(dataElement) {
                    var detailedDataElement = _.find(allDataElements, function(d) {
                        return d.id === dataElement.id;
                    });
                    dataElement.formName = detailedDataElement.formName;
                    return dataElement;
                };

                _.each(sections, function(section) {
                    $scope.selectedSections[section.id] = false;
                    section.dataElements = _.map(section.dataElements, function(dataElement) {
                        $scope.selectedDataElements[dataElement.id] = false;
                        return enrichDataElement(dataElement);
                    });
                });

                _.each($scope.allDatasets, function(dataset) {
                    dataset.dataElements = [];
                    dataset.sections = groupedSections[dataset.id];
                });
                $scope.modules = [];
                $scope.addModules();
            };

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise]);
            getAllData.then(populateElements);
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        $scope.addModules = function() {
            $scope.modules.push({
                'openingDate': moment().format("YYYY-MM-DD"),
                'datasets': [],
                'allDatasets': _.cloneDeep($scope.allDatasets, true),
                'excludedDataElementIds': []
            });
        };

        $scope.save = function(modules) {
            var parent = $scope.orgUnit;

            var createModules = function() {
                var moduleDatasets = orgUnitMapper.mapToModules(modules, parent);
                return orgUnitService.create(moduleDatasets);
            };

            var saveSystemSettings = function() {
                var systemSettings = orgUnitMapper.constructSystemSettings(modules, parent);
                orgUnitService.setSystemSettings(parent.id, systemSettings);
            };

            var associateDatasets = function() {
                var datasets = orgUnitMapper.mapToDataSets(modules, parent);
                return orgUnitService.associateDataSetsToOrgUnit(datasets);
            };

            var onSuccess = function(data) {
                if ($scope.$parent.closeEditForm)
                    $scope.$parent.closeEditForm($scope.orgUnit.id, "savedModule");
            };

            var onError = function(data) {
                $scope.saveFailure = true;
            };

            createModules().then(associateDatasets).then(saveSystemSettings).then(onSuccess, onError);
        };

        $scope.delete = function(index) {
            $scope.modules.splice(index, 1);
        };

        $scope.areDatasetsNotSelected = function(modules) {
            return _.any(modules, function(module) {
                return _.isEmpty(module.datasets);
            });
        };

        $scope.changeSectionSelection = function(section) {
            _.each(section.dataElements, function(dataElement) {
                $scope.selectedDataElements[dataElement.id] = $scope.selectedSections[section.id];
            });
        }

        $scope.changeDataElementSelection = function(section) {
            var selected = false;
            _.each(section.dataElements, function(dataElement) {
                selected = selected || $scope.selectedDataElements[dataElement.id];
            });
            $scope.selectedSections[section.id] = selected;
        };

        $scope.displayGroupedDataElements = function(element) {
            $scope.selectedDataset = element;
            _.each($scope.selectedDataset.sections, function(section) {
                $scope.selectedSections[section.id] = true;
                _.each(section.dataElements, function(dataElement) {
                    $scope.selectedDataElements[dataElement.id] = true;
                });
            });
        };

        init();
    };
});