define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "datasetTransformer"], function(_, orgUnitMapper, moment, systemSettingsTransformer, datasetTransformer) {
    return function($scope, $hustle, orgUnitService, orgUnitRepository, dataSetRepository, systemSettingRepository, db, $location, $q) {

        $scope.isopen = {};
        $scope.modules = [];
        $scope.originalDatasets = [];
        $scope.isExpanded = [];

        var isNewDataModel = function(ds) {
            var attr = _.find(ds.attributeValues, {
                "attribute": {
                    "code": 'isNewDataModel'
                }
            });
            return attr.value === 'true';
        };

        var init = function() {
            var setUpData = function(data) {
                $scope.originalDatasets = data[0];
                var excludedDataElements = data[3] && data[3].value && data[3].value.excludedDataElements ? data[3].value.excludedDataElements : {};
                $scope.allDatasets = datasetTransformer.enrichDatasets(data[0], data[1], data[2], $scope.orgUnit.id, excludedDataElements);

            };

            var setUpForm = function() {
                var setUpNewMode = function() {
                    orgUnitRepository.getAll().then(function(allOrgUnits) {
                        $scope.allModules = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                    });

                    $scope.addModules();
                };

                var setUpEditMode = function() {
                    var associatedDatasets = datasetTransformer.getAssociatedDatasets($scope.orgUnit, $scope.allDatasets);
                    var nonAssociatedDatasets = _.reject($scope.allDatasets, function(d) {
                        return !isNewDataModel(d) || _.any(associatedDatasets, {
                            "id": d.id
                        });
                    });

                    $scope.modules.push({
                        'id': $scope.orgUnit.id,
                        'name': $scope.orgUnit.name,
                        'allDatasets': nonAssociatedDatasets,
                        'datasets': associatedDatasets,
                        'selectedDataset': associatedDatasets[0]
                    });

                    $scope.updateDisabled = !_.all(associatedDatasets, isNewDataModel);
                };

                if ($scope.isNewMode) {
                    setUpNewMode();
                } else {
                    setUpEditMode();
                }
            };

            var getAll = function(storeName) {
                var store = db.objectStore(storeName);
                return store.getAll();
            };

            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");
            var systemSettingsPromise = systemSettingRepository.getAllWithProjectId($scope.orgUnit.parent.id);

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, systemSettingsPromise]);
            getAllData.then(setUpData).then(setUpForm);
        };

        $scope.getSection = function(selectedDataSet, sectionId) {
            return _.find(selectedDataSet.sections, {
                "id": sectionId
            });
        };

        $scope.getDataElement = function(section, dataElementId) {
            return _.find(section.dataElements, {
                "id": dataElementId
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
            return $q.all(orgUnitRepository.upsert(enrichedModules), publishMessage(enrichedModules, "upsertOrgUnit")).then(function() {
                return enrichedModules;
            });
        };

        $scope.disable = function(modules) {
            var payload = orgUnitMapper.disable(modules);
            orgUnitRepository.upsert(payload);
            return publishMessage(modules, "upsertOrgUnit");
        };

        $scope.excludeDataElements = function(projectId, enrichedModules) {
            var systemSettings = systemSettingsTransformer.constructSystemSettings(enrichedModules);
            var payload = {
                "projectId": projectId,
                "settings": systemSettings
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
            if ($scope.$parent.closeNewForm)
                $scope.$parent.closeNewForm($scope.orgUnit, "savedModule");
        };

        $scope.onError = function(data) {
            $scope.saveFailure = true;
        };

        $scope.save = function(modules) {
            $scope.createModules(modules).then($scope.associateDatasets).then(_.curry($scope.excludeDataElements)($scope.orgUnit.id)).then($scope.onSuccess, $scope.onError);
        };

        $scope.update = function(modules) {
            $scope.excludeDataElements($scope.orgUnit.parent.id, modules).then($scope.onSuccess, $scope.onError);
        };

        $scope.addModules = function() {
            $scope.modules.push({
                'openingDate': moment().format("YYYY-MM-DD"),
                'datasets': [],
                'allDatasets': _.filter($scope.allDatasets, isNewDataModel),
                'selectedDataset': {}
            });
        };

        $scope.deleteModule = function(index) {
            $scope.modules.splice(index, 1);
        };

        $scope.areDatasetsNotSelected = function(modules) {
            return _.any(modules, function(module) {
                return _.isEmpty(module.datasets);
            });
        };

        $scope.areNoSectionsSelected = function(modules) {
            return _.any(modules, function(module) {
                return _.any(module.datasets, function(dataSet) {
                    return $scope.areNoSectionsSelectedForDataset(dataSet);
                });
            });
        };

        $scope.areNoSectionsSelectedForDataset = function(dataset) {
            return _.all(dataset.sections, function(section) {
                return _.all(section.dataElements, {
                    "isIncluded": false
                });
            });
        };

        $scope.changeSectionSelection = function(section) {
            _.each(section.dataElements, function(dataElement) {
                dataElement.isIncluded = section.isIncluded;
            });
        };

        $scope.changeDataElementSelection = function(section) {
            section.isIncluded = _.any(section.dataElements, {
                "isIncluded": true
            });
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
                _.each(dataset.sections, function(section) {
                    section.isIncluded = true;
                    _.each(section.dataElements, function(dataElement) {
                        dataElement.isIncluded = true;
                    });
                });
            });
            module.selectedDataset = undefined;
        };

        init();
    };
});