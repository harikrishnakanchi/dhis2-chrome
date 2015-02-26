define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "datasetTransformer", "programTransformer", "md5"], function(_, orgUnitMapper, moment, systemSettingsTransformer, datasetTransformer, programTransformer, md5) {
    return function($scope, $hustle, orgUnitRepository, datasetRepository, systemSettingRepository, db, $location, $q, $modal, programRepository, orgUnitGroupRepository, orgUnitGroupHelper) {
        $scope.originalDatasets = [];
        $scope.isExpanded = {};
        $scope.isDisabled = false;
        $scope.thisDate = (moment().add(1, 'day')).toDate();
        $scope.module = {};
        $scope.allModules = [];

        $scope.nonAssociatedDataSets = [];
        $scope.associatedDatasets = [];
        $scope.selectedDataset = {};
        $scope.excludedDataElements = [];
        $scope.thisDate = moment().toDate();

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
                        $scope.excludedDataElements = systemSettings.value.dataElements;
                });
            };

            var setDisabled = function() {
                var isDisabled = _.find($scope.module.attributeValues, {
                    "attribute": {
                        "code": "isDisabled"
                    }
                });
                $scope.isDisabled = isDisabled && isDisabled.value;
            };

            var getAllAggregateDatasets = function() {
                return datasetRepository.getAllAggregateDatasets().then(function(ds) {
                    return datasetRepository.getEnriched(ds, $scope.excludedDataElements);
                });
            };

            var getDatasets = function() {
                return getAllAggregateDatasets().then(function(datasets) {
                    $scope.originalDatasets = datasets;

                    var partitionedDatasets = _.partition(datasets, function(ds) {
                        return _.contains(ds.orgUnitIds, $scope.module.id);
                    });

                    $scope.associatedDatasets = partitionedDatasets[0];
                    $scope.nonAssociatedDataSets = partitionedDatasets[1];
                    $scope.selectedDataset = $scope.associatedDatasets ? $scope.associatedDatasets[0] : [];
                });
            };

            initModule().then(getExcludedDataElements).then(getDatasets).then(getAllModules).then(setDisabled);
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


        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        var disableModule = function(module) {
            var enrichedModules = orgUnitMapper.mapToModule(module, module.id, 6);
            var payload = orgUnitMapper.disable(enrichedModules);
            $scope.isDisabled = true;
            $q.all([orgUnitRepository.upsert(payload), publishMessage(payload, "upsertOrgUnit")]).then(function() {
                if ($scope.$parent.closeNewForm) $scope.$parent.closeNewForm(module, "disabledModule");
            });
        };

        $scope.disable = function(module) {
            showModal(_.bind(disableModule, {}, module), $scope.resourceBundle.disableOrgUnitConfirmationMessage);
        };

        var onError = function() {
            $scope.saveFailure = true;
        };

        var onSuccess = function(enrichedModule) {
            $scope.saveFailure = false;
            if ($scope.$parent.closeNewForm)
                $scope.$parent.closeNewForm(enrichedModule, "savedModule");
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
            then(_.partial(publishMessage, systemSetting, "uploadSystemSetting"));
        };

        $scope.save = function(module) {
            var enrichedModule = {};

            var associateDatasets = function() {
                var addOrgUnits = function() {
                    return _.map($scope.associatedDatasets, function(ds) {
                        return datasetRepository.get(ds.id).then(function(d) {
                            d.organisationUnits = d.organisationUnits || [];
                            d.organisationUnits = d.organisationUnits.concat({
                                id: enrichedModule.id,
                                name: enrichedModule.name
                            });
                            return d;
                        });
                    });
                };
                var updateDataSets = function(datasets) {
                    return $q.all([datasetRepository.upsert(datasets), publishMessage(_.pluck(datasets, "id"), "associateOrgUnitToDataset")]);
                };
                return $q.all(addOrgUnits()).then(updateDataSets);
            };
            var getEnrichedModule = function(module) {
                enrichedModule = orgUnitMapper.mapToModule(module);
                return $q.when(enrichedModule);
            };
            var createModules = function() {
                return $q.all([orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit")]);
            };

            var createOrgUnitGroups = function() {
                return orgUnitGroupHelper.createOrgUnitGroups([enrichedModule], false);
            };

            return getEnrichedModule($scope.module)
                .then(createModules)
                .then(associateDatasets)
                .then(_.partial(saveExcludedDataElements, enrichedModule))
                .then(createOrgUnitGroups)
                .then(_.partial(onSuccess, enrichedModule), onError);
        };

        $scope.update = function() {
            var enrichedModule = orgUnitMapper.mapToModule($scope.module, $scope.module.id, 6);
            return $q.all([saveExcludedDataElements(enrichedModule), orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit")])
                .then(_.partial(onSuccess, enrichedModule), onError);
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
            $scope.selectedDataset = item;
            _.each($scope.selectedDataset.sections, function(section) {
                $scope.isExpanded[section.id] = false;
            });
            $scope.isExpanded[$scope.selectedDataset.sections[0].id] = true;
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

        $scope.isAfterMaxDate = function() {
            return moment($scope.module.openingDate).isAfter(moment($scope.thisDate));
        };

        init();
    };
});
