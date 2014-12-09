define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "datasetTransformer", "programTransformer"], function(_, orgUnitMapper, moment, systemSettingsTransformer, datasetTransformer, programTransformer) {
    return function($scope, $hustle, orgUnitService, orgUnitRepository, dataSetRepository, systemSettingRepository, db, $location, $q, $modal, programRepository, orgUnitGroupRepository, orgUnitGroupHelper) {

        $scope.isopen = {};
        $scope.modules = [];
        $scope.originalDatasets = [];
        $scope.isExpanded = {};
        $scope.isDisabled = false;

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
                $scope.allPrograms = data[4];
            };

            var setUpForm = function() {
                var findAssociatedModule = function() {
                    return _.find($scope.allPrograms, function(program) {
                        return _.contains(program.orgUnitIds, $scope.orgUnit.id);
                    });
                };

                var isLinelistService = function() {
                    var linelistAttribute = _.find($scope.orgUnit.attributeValues, {
                        "attribute": {
                            "code": "isLineListService"
                        }
                    });

                    return linelistAttribute ? linelistAttribute.value : false;

                };

                var setUpNewMode = function() {
                    orgUnitRepository.getAll().then(function(allOrgUnits) {
                        $scope.allModules = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                    });

                    $scope.addModules();
                };

                var setUpEditMode = function() {
                    var associatedDatasets = datasetTransformer.getAssociatedDatasets($scope.orgUnit.id, $scope.allDatasets);
                    var nonAssociatedDatasets = _.reject($scope.allDatasets, function(d) {
                        return _.any(associatedDatasets, {
                            "id": d.id
                        });
                    });

                    $scope.modules.push({
                        'id': $scope.orgUnit.id,
                        'name': $scope.orgUnit.name,
                        'allDatasets': nonAssociatedDatasets,
                        'datasets': associatedDatasets,
                        'selectedDataset': associatedDatasets ? associatedDatasets[0] : [],
                        'serviceType': isLinelistService() ? "Linelist" : "Aggregate",
                        'program': findAssociatedModule(),
                        "dataModelType": associatedDatasets[0] && isNewDataModel(associatedDatasets[0]) ? "New" : "Current"
                    });

                    var isDisabled = _.find($scope.orgUnit.attributeValues, {
                        "attribute": {
                            "code": "isDisabled"
                        }
                    });
                    $scope.isDisabled = isDisabled && isDisabled.value;
                    $scope.updateDisabled = !_.all(associatedDatasets, isNewDataModel) || $scope.isDisabled;
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
            var programsPromise = getAll("programs");

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, systemSettingsPromise, programsPromise]);
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

            parent.children = parent.children.concat(enrichedModules);

            return $q.all(orgUnitRepository.upsert(parent), orgUnitRepository.upsert(enrichedModules), publishMessage(enrichedModules, "upsertOrgUnit"))
                .then(function() {
                    return enrichedModules;
                });
        };

        var disableModule = function(orgUnit) {
            var payload = orgUnitMapper.disable(orgUnit);
            $scope.isDisabled = true;
            $q.all([orgUnitRepository.upsert(payload), publishMessage(orgUnit, "upsertOrgUnit")]).then(function() {
                if ($scope.$parent.closeNewForm) $scope.$parent.closeNewForm(orgUnit, "disabledModule");
            });
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        $scope.disable = function(orgUnit) {
            showModal(function() {
                disableModule(orgUnit);
            }, $scope.resourceBundle.disableOrgUnitConfirmationMessage);
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

        var associatePrograms = function(programWiseModules, enrichedModules) {
            var programs = programTransformer.addModules($scope.allPrograms, programWiseModules, enrichedModules);
            return programRepository.upsert(programs).then(function() {
                return publishMessage(programs, "uploadProgram");
            });
        };

        $scope.save = function(modules) {
            var getModulesOfServiceType = function(serviceType) {
                return _.filter(modules, function(m) {
                    return m.serviceType === serviceType;
                });
            };

            var saveAggregateModules = function() {
                if (aggregateModules.length === 0) return $q.when([]);
                return $scope.createModules(aggregateModules)
                    .then($scope.associateDatasets)
                    .then(_.curry($scope.excludeDataElements)($scope.orgUnit.id))
                    .then($scope.onSuccess, $scope.onError);
            };

            var saveLinelistModules = function() {
                if (linelistModules.length === 0) return $q.when([]);

                var programWiseModules = _.groupBy(linelistModules, function(m) {
                    return m.program.id;
                });

                return $scope.createModules(linelistModules)
                    .then(_.curry(associatePrograms)(programWiseModules))
                    .then($scope.onSuccess, $scope.onError);
            };

            var createOrgUnitGroups = function() {
                var modulesToAdd = [];
                var parent = $scope.orgUnit;
                if (aggregateModules.length !== 0) {
                    var enrichedAggregateModules = orgUnitMapper.mapToModules(aggregateModules, parent);
                    modulesToAdd = modulesToAdd.concat(enrichedAggregateModules);
                }
                if (linelistModules.length !== 0) {
                    var enrichedLineListModules = orgUnitMapper.mapToModules(linelistModules, parent);
                    modulesToAdd = modulesToAdd.concat(enrichedLineListModules);
                }
                return orgUnitGroupHelper.createOrgUnitGroups(modulesToAdd, false);
            };

            var aggregateModules = getModulesOfServiceType("Aggregate");
            var linelistModules = getModulesOfServiceType("Linelist");

            saveAggregateModules().then(saveLinelistModules).then(createOrgUnitGroups);
        };

        $scope.update = function(modules) {
            var enrichedModules = orgUnitMapper.mapToModules(modules, $scope.orgUnit.parent, $scope.orgUnit.id, 6);

            return $q.all($scope.excludeDataElements($scope.orgUnit.parent.id, modules), orgUnitRepository.upsert(enrichedModules), publishMessage(enrichedModules, "upsertOrgUnit"))
                .then($scope.onSuccess, $scope.onError);
        };


        $scope.getIsExpanded =
            function(module) {
                module.timestamp = module.timestamp || new Date().getTime();
                $scope.isExpanded[module.timestamp] = $scope.isExpanded[module.timestamp] || {};
                return $scope.isExpanded[module.timestamp];
            };

        $scope.changeDataModel = function(module, dataModel) {
            if (dataModel === "New") {
                module.allDatasets = _.filter(_.cloneDeep($scope.allDatasets), isNewDataModel);
            } else {
                module.allDatasets = _.filter(_.cloneDeep($scope.allDatasets), function(ds) {
                    return !isNewDataModel(ds);
                });
            }
            module.dataModelType = dataModel;
            module.datasets = [];
            module.selectedDataset = {};
        };

        $scope.addModules = function() {
            $scope.modules.push({
                'openingDate': moment().format("YYYY-MM-DD"),
                'datasets': [],
                'allDatasets': _.filter(_.cloneDeep($scope.allDatasets), isNewDataModel),
                'selectedDataset': {},
                'timestamp': new Date().getTime(),
                "serviceType": "",
                "program": {
                    "name": ""
                },
                "dataModelType": "New"
            });
        };

        $scope.deleteModule = function(index) {
            $scope.modules.splice(index, 1);
        };

        $scope.areDatasetsNotSelected = function(modules) {
            return _.any(modules, function(module) {
                return module.serviceType === "Aggregate" && _.isEmpty(module.datasets);
            });
        };

        $scope.areNoSectionsSelected = function(modules) {
            return _.any(modules, function(module) {
                return _.any(module.datasets, function(dataSet) {
                    return module.serviceType === "Aggregate" && $scope.areNoSectionsSelectedForDataset(dataSet);
                });
            });
        };

        $scope.areNoProgramsSelected = function(modules) {
            return _.any(modules, function(module) {
                return module.serviceType === "Linelist" && _.isEmpty(module.program.name);
            });
        };

        $scope.isNewModule = function(modules){
            return _.any(modules, function(module){
                return module.dataModelType === "New";
            });
        };

        $scope.shouldDisableSaveOrUpdateButton = function(modules) {
            return $scope.isNewModule(modules) && ($scope.areDatasetsNotSelected(modules) || $scope.areNoSectionsSelected(modules) || $scope.areNoProgramsSelected(modules));
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
                $scope.getIsExpanded(module)[section.id] = false;
            });
            $scope.getIsExpanded(module)[module.selectedDataset.sections[0].id] = true;
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
