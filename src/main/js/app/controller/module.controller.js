define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "datasetTransformer", "programTransformer", "md5"], function(_, orgUnitMapper, moment, systemSettingsTransformer, datasetTransformer, programTransformer, md5) {
    return function($scope, $hustle, orgUnitService, orgUnitRepository, datasetRepository, systemSettingRepository, db, $location, $q, $modal, programRepository, orgUnitGroupRepository, orgUnitGroupHelper) {

        $scope.isopen = {};
        $scope.modules = [];
        $scope.originalDatasets = [];
        $scope.isExpanded = {};
        $scope.isDisabled = false;
        $scope.thisDate = (moment().add(1, 'day')).toDate();

        var allModules = [];

        var isNewDataModel = function(ds) {
            var attr = _.find(ds.attributeValues, {
                "attribute": {
                    "code": 'isNewDataModel'
                }
            });
            return attr.value === 'true';
        };

        var filterAllDataSetsBasedOnDataModelType = function(allDatasets, dataModelType) {
            if (dataModelType === "New") {
                return _.filter(_.cloneDeep(allDatasets), isNewDataModel);
            } else {
                return _.filter(_.cloneDeep(allDatasets), function(ds) {
                    return !isNewDataModel(ds);
                });
            }
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

                    return linelistAttribute ? linelistAttribute.value === "true" : false;
                };

                var setUpNewMode = function() {
                    orgUnitRepository.getAll().then(function(allOrgUnits) {
                        allModules = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                    });

                    $scope.addModules();
                };

                var setUpEditMode = function() {
                    var associatedDatasets = datasetTransformer.getAssociatedDatasets($scope.orgUnit.id, $scope.allDatasets);
                    var dataModelType = associatedDatasets[0] && isNewDataModel(associatedDatasets[0]) ? "New" : "Current";

                    var getNonAssociatedDatasets = function() {
                        var allDatasetsExceptAssociatedDataSets = _.reject($scope.allDatasets, function(d) {
                            return _.any(associatedDatasets, {
                                "id": d.id
                            });
                        });
                        return filterAllDataSetsBasedOnDataModelType(allDatasetsExceptAssociatedDataSets, dataModelType);
                    };

                    var setUpModuleInformation = function() {
                        var setCollapsedPropertyForSection = function() {
                            $scope.collapseSection = {};
                            _.forEach($scope.orgUnit.enrichedProgram.programStages, function(programStage) {
                                _.forEach(programStage.programStageSections, function(programStageSection) {
                                    $scope.collapseSection[programStageSection.id] = true;
                                });
                                $scope.collapseSection[programStage.programStageSections[0].id] = false;
                            });
                        };

                        var getEnrichedProgram = function(systemSettings) {
                            return programRepository.get(findAssociatedModule().id).then(function(program) {
                                _.forEach(program.programStages, function(programStage) {
                                    _.forEach(programStage.programStageSections, function(programStageSection) {
                                        _.forEach(programStageSection.programStageDataElements, function(de) {
                                            if (_.contains(systemSettings.value.excludedDataElements[$scope.orgUnit.id], de.dataElement.id)) {
                                                de.dataElement.isIncluded = false;
                                            } else {
                                                de.dataElement.isIncluded = true;
                                            }
                                        });
                                    });
                                });
                                return program;
                            });
                        };

                        var getSystemSettings = function() {
                            return systemSettingRepository.getAllWithProjectId($scope.orgUnit.parent.id).then(function(data) {
                                return data;
                            });
                        };

                        var setUpModule = function(data) {
                            if (data)
                                $scope.orgUnit.enrichedProgram = data;

                            if (!_.isEmpty($scope.orgUnit.enrichedProgram))
                                setCollapsedPropertyForSection();
                            $scope.modules.push({
                                'id': $scope.orgUnit.id,
                                'name': $scope.orgUnit.name,
                                'openingDate': moment($scope.orgUnit.openingDate).toDate(),
                                'enrichedProgram': $scope.orgUnit.enrichedProgram,
                                'allDatasets': getNonAssociatedDatasets(),
                                'associatedDatasets': associatedDatasets,
                                'selectedDataset': associatedDatasets ? associatedDatasets[0] : [],
                                'serviceType': isLinelistService() ? "Linelist" : "Aggregate",
                                'program': findAssociatedModule(),
                                "dataModelType": dataModelType
                            });

                            var isDisabled = _.find($scope.orgUnit.attributeValues, {
                                "attribute": {
                                    "code": "isDisabled"
                                }
                            });
                            $scope.isDisabled = isDisabled && isDisabled.value;
                            $scope.updateDisabled = !_.all(associatedDatasets, isNewDataModel) || $scope.isDisabled;
                        };

                        if (isLinelistService()) {
                            getSystemSettings().then(getEnrichedProgram).then(setUpModule);
                        } else {
                            setUpModule();
                        }

                    };

                    var getAllModules = function() {
                        return orgUnitRepository.getAll().then(function(allOrgUnits) {
                            allModules = _.difference(orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.parent.id), [$scope.orgUnit.name]);
                            return allOrgUnits;
                        });
                    };

                    getAllModules().then(setUpModuleInformation);

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

        $scope.getDetailedProgram = function(module) {
            $scope.collapseSection = {};
            if (_.isEmpty(module.program)) {
                module.program = {
                    'name': ''
                };
                return module;
            }

            return programRepository.get(module.program.id).then(function(enrichedProgram) {
                _.forEach(enrichedProgram.programStages, function(programStage) {
                    _.forEach(programStage.programStageSections, function(programStageSection) {
                        $scope.collapseSection[programStageSection.id] = true;
                        _.forEach(programStageSection.programStageDataElements, function(de) {
                            de.dataElement.isIncluded = true;
                        });
                    });
                    $scope.collapseSection[programStage.programStageSections[0].id] = false;
                });
                module.enrichedProgram = enrichedProgram;
                return module;
            });
        };

        $scope.changeCollapsed = function(sectionId) {
            $scope.collapseSection[sectionId] = !$scope.collapseSection[sectionId];
        };

        $scope.getCollapsed = function(sectionId) {
            return $scope.collapseSection[sectionId];
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
            return $q.all([orgUnitRepository.upsert(parent), orgUnitRepository.upsert(enrichedModules), publishMessage(enrichedModules, "upsertOrgUnit")])
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

        $scope.onError = function(data) {
            $scope.saveFailure = true;
        };

        var associatePrograms = function(programWiseModules, enrichedModules) {
            var programs = programTransformer.addModules($scope.allPrograms, programWiseModules, enrichedModules);
            return programRepository.upsert(programs).then(function(upsertedPrograms) {
                publishMessage(upsertedPrograms, "uploadProgram");
                return enrichedModules;
            });
        };

        var saveSystemSettingsForExcludedDataElements = function(parentId, aggModules, linelistModules) {
            var saveSystemSettings = function(newSystemSettings, projectId) {
                return systemSettingRepository.getAllWithProjectId(projectId).then(function(data) {
                    var existingSystemSettings = (_.isEmpty(data)) ? {} : data.value.excludedDataElements;
                    var systemSettingsPayload = _.cloneDeep(existingSystemSettings);
                    _.forEach(_.keys(newSystemSettings), function(key) {
                        systemSettingsPayload[key] = newSystemSettings[key];
                    });
                    var systemSettings = {
                        'excludedDataElements': systemSettingsPayload
                    };
                    var payload = {
                        "projectId": projectId,
                        "settings": systemSettings
                    };

                    var oldIndexedDbSystemSettings = (_.isEmpty(data)) ? {
                        'excludedDataElements': {}
                    } : data.value;
                    return systemSettingRepository.upsert(payload).then(function() {
                        var hustlePayload = _.cloneDeep(payload);
                        hustlePayload.indexedDbOldSystemSettings = oldIndexedDbSystemSettings;
                        return publishMessage(hustlePayload, "excludeDataElements").then(function() {
                            return;
                        });
                    });
                });
            };

            var systemSettingsForAggregateModules = systemSettingsTransformer.constructSystemSettings(aggModules);
            var systemSettingsForLineListModules = systemSettingsTransformer.constructSystemSettings(linelistModules, true);
            var newSystemSettings = _.merge(systemSettingsForAggregateModules, systemSettingsForLineListModules);

            return saveSystemSettings(newSystemSettings, parentId);
        };

        var getModulesOfServiceType = function(serviceType, modules) {
            return _.filter(modules, function(m) {
                return m.serviceType === serviceType;
            });
        };

        $scope.save = function(modules) {
            var onSuccess = function(enrichedModules) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.orgUnit, "savedModule");
                return enrichedModules;
            };

            var associateDatasets = function(enrichedModules) {
                var parent = $scope.orgUnit;
                var datasets = orgUnitMapper.mapToDataSets(enrichedModules, parent, $scope.originalDatasets);
                return $q.all([datasetRepository.upsert(datasets), publishMessage(_.pluck(datasets, "id"), "associateOrgUnitToDataset")]).then(function() {
                    return enrichedModules;
                });
            };

            var saveAggregateModules = function() {
                if (aggregateModules.length === 0) return $q.when([]);
                return $scope.createModules(aggregateModules)
                    .then(associateDatasets)
                    .then(onSuccess, $scope.onError);
            };

            var saveLinelistModules = function() {
                if (linelistModules.length === 0) return $q.when([]);

                var programWiseModules = _.groupBy(linelistModules, function(m) {
                    return m.program.id;
                });

                return $scope.createModules(linelistModules)
                    .then(_.curry(associatePrograms)(programWiseModules));

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

            var aggregateModules = getModulesOfServiceType("Aggregate", modules);
            var linelistModules = getModulesOfServiceType("Linelist", modules);
            var savedAggregateModule, savedLinelistModules;
            saveAggregateModules()
                .then(function(agg) {
                    savedAggregateModule = agg;
                })
                .then(saveLinelistModules)
                .then(function(ll) {
                    savedLinelistModules = ll;
                })
                .then(function() {
                    saveSystemSettingsForExcludedDataElements($scope.orgUnit.id, savedAggregateModule, savedLinelistModules);
                })
                .then(createOrgUnitGroups)
                .then(onSuccess, $scope.onError);
        };

        $scope.update = function(modules) {
            var onSuccess = function(data) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(enrichedModules[0], "savedModule");
            };

            var aggregateModules = getModulesOfServiceType("Aggregate", modules);
            var linelistModules = getModulesOfServiceType("Linelist", modules);
            var enrichedModules = orgUnitMapper.mapToModules(modules, $scope.orgUnit.parent, $scope.orgUnit.id, 6);

            return $q.all([saveSystemSettingsForExcludedDataElements($scope.orgUnit.parent.id, aggregateModules, linelistModules),
                    orgUnitRepository.upsert(enrichedModules),
                    publishMessage(enrichedModules, "upsertOrgUnit")
                ])
                .then(onSuccess, $scope.onError);
        };

        $scope.getIsExpanded = function(module) {
            module.timestamp = module.timestamp || new Date().getTime();
            $scope.isExpanded[module.timestamp] = $scope.isExpanded[module.timestamp] || {};
            return $scope.isExpanded[module.timestamp];
        };

        $scope.changeDataModel = function(module, dataModel) {
            module.allDatasets = filterAllDataSetsBasedOnDataModelType($scope.allDatasets, dataModel);
            module.dataModelType = dataModel;
            module.associatedDatasets = [];
            module.selectedDataset = {};
        };

        $scope.addModules = function() {
            $scope.modules.push({
                'openingDate': moment().toDate(),
                'associatedDatasets': [],
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
                return module.serviceType === "Aggregate" && _.isEmpty(module.associatedDatasets);
            });
        };

        $scope.areNoSectionsSelected = function(modules) {
            return _.any(modules, function(module) {
                return _.any(module.associatedDatasets, function(dataSet) {
                    return module.serviceType === "Aggregate" && $scope.areNoSectionsSelectedForDataset(dataSet);
                });
            });
        };

        $scope.areNoProgramsSelected = function(modules) {
            return _.any(modules, function(module) {
                return module.serviceType === "Linelist" && _.isEmpty(module.program.name);
            });
        };

        $scope.isNewModule = function(modules) {
            return _.any(modules, function(module) {
                return module.dataModelType === "New";
            });
        };

        $scope.shouldDisableSaveOrUpdateButton = function(modules) {
            return $scope.isNewModule(modules) && ($scope.areDatasetsNotSelected(modules) || $scope.areNoSectionsSelected(modules) || $scope.areNoProgramsSelected(modules));
        };

        $scope.areNoSectionsSelectedForDataset = function(dataset) {
            if (_.isEmpty(dataset))
                return false;
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

        $scope.getAllModulesNames = function() {
            $scope.allModuleNames = _.reject(allModules.concat(_.pluck($scope.modules, "name")), function(m) {
                return m === undefined;
            });
        };

        $scope.isAfterMaxDate = function(module) {
            if (module.openingDate === undefined)
                return true;
            return false;
        };

        init();
    };
});
