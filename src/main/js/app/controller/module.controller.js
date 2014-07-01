define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "datasetTransformer"], function(_, orgUnitMapper, moment, systemSettingsTransformer, datasetTransformer) {
    return function($scope, $hustle, orgUnitService, orgUnitRepository, dataSetRepository, systemSettingRepository, db, $location, $q) {
        var selectedDataElements = {};
        var selectedSections = {};
        var allSections = [];

        $scope.isopen = {};
        $scope.modules = [];
        $scope.originalDatasets = [];
        $scope.isExpanded = [];

        var init = function() {
            var leftPanedatasets = [];

            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");

            var setUpData = function(data) {
                $scope.originalDatasets = data[0];
                allSections = data[1];
                $scope.allDatasets = datasetTransformer.enrichDatasets(data);
            };

            var setUpForm = function() {
                var setUpEditMode = function() {
                    _.each(allSections, function(section) {
                        selectedSections[section.id] = true;
                        _.each(section.dataElements, function(dataElement) {
                            selectedDataElements[dataElement.id] = true;
                        });
                    });
                    orgUnitRepository.getAll().then(function(allOrgUnits) {
                        $scope.allModules = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                    });
                    $scope.addModules();
                };

                var setUpViewMode = function() {
                    var associatedDatasets = orgUnitService.getAssociatedDatasets($scope.orgUnit, $scope.allDatasets);
                    var systemSettingsPromise = systemSettingRepository.getAllWithProjectId($scope.orgUnit.parent.id);
                    systemSettingsPromise.then(function(systemSetting) {
                        var datasets = datasetTransformer.getFilteredDatasets(associatedDatasets, systemSetting, $scope.orgUnit.id);
                        $scope.modules.push({
                            'name': $scope.orgUnit.name,
                            'datasets': datasets,
                            'selectedDataset': datasets[0]
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

        var initDataElementSelection = function(module, sections) {
            _.each(sections, function(section) {
                module.selectedSections[section.id] = true;
                _.each(section.dataElements, function(dataElement) {
                    module.selectedDataElements[dataElement.id] = true;
                });
            });
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        $scope.addModules = function() {
            var isNewDataModel = function(ds) {
                var attr = _.find(ds.attributeValues, {
                    "attribute": {
                        "code": 'isNewDataModel'
                    }
                });
                return attr.value === 'true';
            };
            var newDataModels = _.filter($scope.allDatasets, isNewDataModel);

            $scope.modules.push({
                'openingDate': moment().format("YYYY-MM-DD"),
                'datasets': [],
                'allDatasets': _.cloneDeep(newDataModels, true),
                'selectedDataset': {},
                'selectedSections': _.cloneDeep(selectedSections),
                'selectedDataElements': _.cloneDeep(selectedDataElements)
            });
        };

        var publishMessage = function(data, action) {
            return $hustle.publish({
                "data": data,
                "type": action
            }, "dataValues");
        };

        $scope.createModules = function(modules) {
            var parent = $scope.orgUnit;
            var enrichedModules = orgUnitMapper.mapToModules(modules, parent);
            return $q.all(orgUnitRepository.upsert(enrichedModules), publishMessage(enrichedModules, "createOrgUnit")).then(function() {
                return enrichedModules;
            });
        };

        $scope.excludeDataElements = function(enrichedModules) {
            var parent = $scope.orgUnit;
            var systemSettings = systemSettingsTransformer.constructSystemSettings(enrichedModules, parent);
            var payload = {
                projectId: parent.id,
                settings: systemSettings
            };
            return $q.all(systemSettingRepository.upsert(payload), publishMessage(payload, "excludeDataElements")).then(function() {
                return enrichedModules;
            });
        };

        $scope.associateDatasets = function(enrichedModules) {
            var parent = $scope.orgUnit;
            var datasets = orgUnitMapper.mapToDataSets(enrichedModules, parent, $scope.originalDatasets);
            return $q.all(dataSetRepository.upsert(datasets), publishMessage(datasets, "associateDataset")).then(function() {
                return enrichedModules;
            });
        };

        $scope.onSuccess = function(data) {
            $scope.saveFailure = false;
            if ($scope.$parent.closeEditForm)
                $scope.$parent.closeEditForm($scope.orgUnit.id, "savedModule");
        };

        $scope.onError = function(data) {
            $scope.saveFailure = true;
        };


        $scope.save = function(modules) {
            var enrichedModules = {};
            $scope.createModules(modules).then($scope.associateDatasets).then($scope.excludeDataElements).then($scope.onSuccess, $scope.onError);
        };

        $scope.delete = function(index) {
            $scope.modules.splice(index, 1);
        };

        $scope.areDatasetsNotSelected = function(modules) {
            return _.any(modules, function(module) {
                return _.isEmpty(module.datasets);
            });
        };

        $scope.areNoSectionsSelected = function(modules) {
            return _.any(modules, function(module) {
                return _.any(module.datasets, function(set) {
                    return _.all(set.sections, function(section) {
                        return !module.selectedSections[section.id];
                    });
                });
            });
        };

        $scope.areNoSectionsSelectedForDataset = function(module, dataset) {
            return _.all(dataset.sections, function(section) {
                return module.selectedSections && !module.selectedSections[section.id];
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

        $scope.selectDataSet = function(module, item) {
            module.selectedDataset = item;
            _.each(module.selectedDataset.sections, function(section) {
                $scope.isExpanded[section.id] = false;
            });
            $scope.isExpanded[module.selectedDataset.sections[0].id] = true;
        };

        $scope.discardDataSet = function(module, items) {
            _.each(items, function(dataset) {
                initDataElementSelection(module, dataset.sections);
            });
            module.selectedDataset = undefined;
        };

        $scope.shouldCollapse = function(current, allSections) {
            if ($scope.isExpanded[current.id] === undefined && allSections[0].id === current.id) {
                $scope.isExpanded[current.id] = true;
            }
            return !$scope.isExpanded[current.id];
        };

        init();
    };
});