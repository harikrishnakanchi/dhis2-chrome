define(["lodash", "orgUnitMapper", "moment", "md5", "systemSettingsTransformer", "datasetTransformer"], function(_, orgUnitMapper, moment, md5, systemSettingsTransformer, datasetTransformer) {
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
            var sections = [];

            var setUpData = function(data) {
                originalDatasets = data[0];
                sections = data[1];
                $scope.allDatasets = datasetTransformer.enrichDatasets(data);
            };

            var setUpForm = function() {

                var setUpEditMode = function() {
                    _.each(sections, function(section) {
                        selectedSections[section.id] = true;
                        _.each(section.dataElements, function(dataElement) {
                            selectedDataElements[dataElement.id] = true;
                        });
                    });
                    orgUnitService.getAll("organisationUnits").then(function(allOrgUnits) {
                        $scope.allModules = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                    });
                    $scope.addModules();
                };

                var setUpViewMode = function() {
                    var associatedDatasets = orgUnitService.getAssociatedDatasets($scope.orgUnit, $scope.allDatasets);
                    var systemSettingsPromise = orgUnitService.getSystemSettings($scope.orgUnit.parent.id);
                    systemSettingsPromise.then(function(systemSettings) {
                        $scope.modules.push({
                            'name': $scope.orgUnit.name,
                            'datasets': datasetTransformer.getFilteredDatasets(associatedDatasets, systemSettings, $scope.orgUnit.id)
                        });
                    });
                };

                if ($scope.isEditMode) {
                    setUpEditMode();
                } else {
                    setUpViewMode();
                }
            };

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise]);
            getAllData.then(setUpData).then(setUpForm);
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
                $scope.saveFailure = false;
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

        $scope.selectDataSet = function(module, element) {
            module.selectedDataset = element;
        };

        init();
    };
});