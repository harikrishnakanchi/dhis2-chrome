define(["lodash", "orgUnitMapper", "moment", "md5", "systemSettingsTransformer"], function(_, orgUnitMapper, moment, md5, systemSettingsTransformer) {
    return function($scope, orgUnitService, db, $location, $q) {
        var selectedDataElements = {};
        var selectedSections = {};
        var originalDatasets;

        $scope.isopen = {};
        $scope.isCollapsed = true;
        $scope.modules = [];

        var init = function() {
            var leftPanedatasets = [];

            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");

            var populateElements = function(data) {
                originalDatasets = data[0];
                $scope.allDatasets = _.cloneDeep(data[0]);
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
                    selectedSections[section.id] = true;
                    section.dataElements = _.map(section.dataElements, function(dataElement) {
                        selectedDataElements[dataElement.id] = true;
                        return enrichDataElement(dataElement);
                    });
                });

                _.each($scope.allDatasets, function(dataset) {
                    dataset.dataElements = [];
                    dataset.sections = groupedSections[dataset.id];
                });
            };

            var setUpView = function() {
                var associatedDatasets = orgUnitService.getDatasetsAssociatedWithOrgUnit($scope.orgUnit, $scope.allDatasets).then(function(associatedDatasets) {
                    $scope.modules.push({
                        'name': $scope.orgUnit.name,
                        'datasets': associatedDatasets
                    });
                });
            };

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise]);
            getAllData.then(populateElements).then(function() {
                if ($scope.isEditMode) {
                    $scope.addModules();
                } else {
                    setUpView();
                }
            });
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
                'selectedDataset': {},
                'selectedSections': _.cloneDeep(selectedSections),
                'selectedDataElements': _.cloneDeep(selectedDataElements)
            });

        };

        $scope.save = function(modules) {
            var parent = $scope.orgUnit;
            var enrichedModules = {};
            var createModules = function() {
                enrichedModules = orgUnitMapper.mapToModules(modules, parent);
                return orgUnitService.create(enrichedModules);
            };

            var saveSystemSettings = function() {
                var systemSettings = systemSettingsTransformer.constructSystemSettings(enrichedModules, parent);
                return orgUnitService.setSystemSettings(parent.id, systemSettings);
            };

            var associateDatasets = function() {
                var datasets = orgUnitMapper.mapToDataSets(modules, parent, originalDatasets);
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

        $scope.changeSectionSelection = function(module, section) {
            _.each(section.dataElements, function(dataElement) {
                module.selectedDataElements[dataElement.id] = module.selectedSections[section.id];
            });
        };

        $scope.changeDataElementSelection = function(module, section) {
            var selected = false;
            _.each(section.dataElements, function(dataElement) {
                selected = selected || module.selectedDataElements[dataElement.id];
            });
            module.selectedSections[section.id] = selected;
        };

        $scope.displayGroupedDataElements = function(module, element) {
            module.selectedDataset = element;
        };

        init();
    };
});