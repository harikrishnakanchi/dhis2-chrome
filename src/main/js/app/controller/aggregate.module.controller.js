define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer"],
    function(_, orgUnitMapper, moment, systemSettingsTransformer) {
        return function($scope, $hustle, orgUnitRepository, datasetRepository, systemSettingRepository, db, $location, $q, $modal,
            orgUnitGroupHelper, originOrgunitCreator) {

            $scope.originalDatasets = [];
            $scope.isExpanded = {};
            $scope.isDisabled = false;
            $scope.module = {};
            $scope.allModules = [];

            $scope.nonAssociatedDataSets = [];
            $scope.associatedDatasets = [];
            $scope.selectedDataset = {};
            $scope.enrichedDatasets = {};
            var excludedDataElements = [];

            var init = function() {
                var initModule = function() {
                    if ($scope.isNewMode) {
                        $scope.module = {
                            'openingDate': moment().toDate(),
                            'timestamp': new Date().getTime(),
                            "serviceType": "",
                            "parent": $scope.orgUnit
                        };
                    } else {
                        $scope.module = {
                            'id': $scope.orgUnit.id,
                            'name': $scope.orgUnit.name,
                            'openingDate': moment($scope.orgUnit.openingDate).toDate(),
                            'serviceType': "Aggregate",
                            'parent': $scope.orgUnit.parent,
                            "attributeValues": $scope.orgUnit.attributeValues
                        };
                    }
                    return $q.when([]);
                };

                var getAllModules = function() {
                    return orgUnitRepository.getAllModulesInOrgUnits([$scope.module.parent.id]).then(function(modules) {
                        $scope.allModules = _.pluck(modules, "name");
                    });
                };

                var getExcludedDataElements = function() {
                    return systemSettingRepository.get($scope.module.id).then(function(systemSettings) {
                        if (!_.isEmpty(systemSettings) && !_.isEmpty(systemSettings.value))
                            excludedDataElements = systemSettings.value.dataElements;
                    });
                };

                var setDisabled = function() {
                    var isDisabled = _.find($scope.module.attributeValues, {
                        "attribute": {
                            "code": "isDisabled"
                        }
                    });
                    $scope.isDisabled = isDisabled && isDisabled.value === "true" ? true : false;
                };

                var getAllAggregateDatasets = function() {
                    return datasetRepository.getAll().then(function(datasets) {
                        return _.filter(datasets, "isAggregateService");
                    });
                };

                var getEnrichedDataSets = function(datasets) {
                    return datasetRepository.includeDataElements(datasets, excludedDataElements);
                };

                var getDatasets = function() {
                    return getAllAggregateDatasets().then(getEnrichedDataSets).then(function(datasets) {
                        $scope.originalDatasets = datasets;

                        var partitionedDatasets = _.partition(datasets, function(ds) {
                            if ($scope.module.id)
                                return _.any(ds.organisationUnits, "id", $scope.module.id);
                            return false;
                        });

                        $scope.associatedDatasets = partitionedDatasets[0];
                        $scope.nonAssociatedDataSets = partitionedDatasets[1];
                        $scope.selectedDataset = $scope.associatedDatasets ? $scope.associatedDatasets[0] : [];
                    });
                };

                var getOriginDatasets = function() {
                    return datasetRepository.getAll().then(function(datasets) {
                        $scope.originDatasets = _.filter(datasets, "isOriginDataset");
                    });
                };

                return initModule().then(getExcludedDataElements).then(getDatasets).then(getAllModules).then(setDisabled).then(getOriginDatasets);
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

            $scope.closeForm = function() {
                $scope.$parent.closeNewForm($scope.orgUnit);
            };

            var publishMessage = function(data, action, desc) {
                return $hustle.publish({
                    "data": data,
                    "type": action,
                    "locale": $scope.currentUser.locale,
                    "desc": desc
                }, "dataValues");
            };

            var showModal = function(okCallback, message) {
                $scope.modalMessages = message;
                var modalInstance = $modal.open({
                    templateUrl: 'templates/confirm-dialog.html',
                    controller: 'confirmDialogController',
                    scope: $scope
                });

                modalInstance.result.then(okCallback);
            };

            var disableModule = function(module) {
                var enrichedModules = orgUnitMapper.mapToModule(module, module.id, 6);
                var payload = orgUnitMapper.disable(enrichedModules);
                $scope.isDisabled = true;
                $q.all([orgUnitRepository.upsert(payload), publishMessage(payload, "upsertOrgUnit", $scope.resourceBundle.disableOrgUnitDesc + payload.name)])
                    .then(function() {
                        if ($scope.$parent.closeNewForm) $scope.$parent.closeNewForm(module, "disabledModule");
                    });
            };

            $scope.disable = function(module) {
                var modalMessages = {
                    "confirmationMessage": $scope.resourceBundle.disableOrgUnitConfirmationMessage
                };
                showModal(_.bind(disableModule, {}, module), modalMessages);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var onSuccess = function(enrichedModule) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(enrichedModule.parent, "savedModule");
                return enrichedModule;
            };

            var saveExcludedDataElements = function(enrichedModule) {
                var excludedDataElements = systemSettingsTransformer.excludedDataElementsForAggregateModule($scope.associatedDatasets);
                var systemSetting = {
                    key: enrichedModule.id,
                    value: {
                        clientLastUpdated: moment().toISOString(),
                        dataElements: excludedDataElements
                    }
                };
                return systemSettingRepository.upsert(systemSetting).
                then(_.partial(publishMessage, systemSetting, "uploadSystemSetting",
                    $scope.resourceBundle.uploadSystemSettingDesc + enrichedModule.name));
            };

            $scope.save = function() {
                var enrichedModule = {};

                var associateToDatasets = function(datasets, orgUnits) {
                    var datasetIds = _.pluck(datasets, "id");
                    return datasetRepository.associateOrgUnits(datasetIds, orgUnits).then(function() {
                        return publishMessage(datasetIds, "associateOrgUnitToDataset",
                            $scope.resourceBundle.associateOrgUnitToDatasetDesc + $scope.orgUnit.name);
                    });
                };

                var getEnrichedModule = function(module) {
                    enrichedModule = orgUnitMapper.mapToModule(module);
                    return $q.when(enrichedModule);
                };

                var createModules = function() {
                    return $q.all([orgUnitRepository.upsert(enrichedModule),
                        publishMessage(enrichedModule, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + enrichedModule.name)
                    ]);
                };

                var createOrgUnitGroups = function() {
                    return orgUnitGroupHelper.createOrgUnitGroups([enrichedModule], false);
                };

                var createOriginOrgUnits = function() {
                    return originOrgunitCreator.create(enrichedModule).then(function(originOrgUnits) {
                        return publishMessage(originOrgUnits, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + _.pluck(originOrgUnits, "name"))
                            .then(_.partial(associateToDatasets, $scope.originDatasets, originOrgUnits));
                    });
                };

                $scope.loading = true;
                return getEnrichedModule($scope.module)
                    .then(createModules)
                    .then(_.partial(associateToDatasets, $scope.associatedDatasets, [enrichedModule]))
                    .then(_.partial(saveExcludedDataElements, enrichedModule))
                    .then(createOrgUnitGroups)
                    .then(createOriginOrgUnits)
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally(function() {
                        $scope.loading = false;
                    });
            };

            $scope.update = function() {
                var enrichedModule = orgUnitMapper.mapToModule($scope.module, $scope.module.id, 6);
                $scope.loading = true;
                return $q.all([saveExcludedDataElements(enrichedModule), orgUnitRepository.upsert(enrichedModule),
                        publishMessage(enrichedModule, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + enrichedModule.name)
                    ])
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally(function() {
                        $scope.loading = false;
                    });
            };

            $scope.areDatasetsSelected = function() {
                return !_.isEmpty($scope.associatedDatasets);
            };

            $scope.shouldDisableSaveOrUpdateButton = function() {
                return !$scope.areDatasetsSelected() || !$scope.areDataElementsSelectedForSection();
            };

            $scope.areDataElementsSelectedForSection = function() {
                return !_.isEmpty($scope.selectedDataset) && _.some($scope.selectedDataset.sections, function(section) {
                    return _.some(section.dataElements, "isIncluded");
                });
            };

            $scope.changeDataElementSelection = function(section) {
                _.each(section.dataElements, function(dataElement) {
                    dataElement.isIncluded = section.isIncluded;
                });
            };

            $scope.changeSectionSelection = function(section) {
                section.isIncluded = !_.any(section.dataElements, {
                    "isIncluded": false
                });
            };

            $scope.selectDataSet = function(item) {
                if (_.isEmpty(item))
                    return;
                if ($scope.enrichedDatasets[item.id]) {
                    $scope.selectedDataset = $scope.enrichedDatasets[item.id];
                    return;
                }
                return datasetRepository.includeDataElements([item], excludedDataElements).then(function(datasets) {
                    $scope.selectedDataset = datasets[0];
                    $scope.enrichedDatasets[$scope.selectedDataset.id] = $scope.selectedDataset;
                    _.each($scope.selectedDataset.sections, function(section) {
                        $scope.isExpanded[section.id] = false;
                        $scope.changeSectionSelection(section);
                    });
                    $scope.isExpanded[$scope.selectedDataset.sections[0].id] = true;
                });
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
                $scope.selectedDataset = undefined;
            };

            init();
        };
    });
