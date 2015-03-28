define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "datasetTransformer", "programTransformer", "md5"], function(_, orgUnitMapper, moment, systemSettingsTransformer, datasetTransformer, programTransformer, md5) {
    return function($scope, $hustle, orgUnitRepository, datasetRepository, systemSettingRepository, db, $location, $q, $modal, programRepository, orgUnitGroupRepository, orgUnitGroupHelper, patientOriginRepository) {
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
                $scope.isDisabled = isDisabled && isDisabled.value === "true" ? true : false;
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

        $scope.closeForm = function() {
            $scope.$parent.closeNewForm($scope.orgUnit);
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

            var getAssociatedDatasets = function() {
                var datasetIds = _.pluck($scope.associatedDatasets, "id");
                return datasetRepository.findAll(datasetIds);
            };

            var associateDatasets = function(getDatasetsToAssociate, orgUnits) {
                var addOrgUnits = function(orgUnits, datasets) {
                    var ouPayloadToAssociate = _.map(orgUnits, function(orgUnit) {
                        return {
                            "id": orgUnit.id,
                            "name": orgUnit.name
                        };
                    });

                    return _.map(datasets, function(ds) {
                        ds.organisationUnits = ds.organisationUnits || [];
                        ds.organisationUnits = ds.organisationUnits.concat(ouPayloadToAssociate);
                        return ds;
                    });
                };

                var updateDatasets = function(datasets) {
                    return $q.all([datasetRepository.upsert(datasets), publishMessage(_.pluck(datasets, "id"), "associateOrgUnitToDataset")]);
                };

                return getDatasetsToAssociate()
                    .then(_.partial(addOrgUnits, orgUnits))
                    .then(updateDatasets);
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

            var createOriginOrgUnits = function() {
                var getOriginDatasets = function() {
                    return datasetRepository.getOriginDatasets();
                };

                var getPatientOriginOUPayload = function() {
                    return orgUnitRepository.getParentProject(enrichedModule.parent.id).then(function(parentProject) {
                        return patientOriginRepository.get(parentProject.id).then(function(patientOrigins) {
                            if (!_.isEmpty(patientOrigins))
                                return orgUnitMapper.createPatientOriginPayload(patientOrigins.origins, enrichedModule);
                        });
                    });
                };

                return getPatientOriginOUPayload().then(function(patientOriginOUPayload) {
                    if (!_.isEmpty(patientOriginOUPayload)) {
                        return orgUnitRepository.upsert(patientOriginOUPayload)
                            .then(_.partial(publishMessage, patientOriginOUPayload, "upsertOrgUnit"))
                            .then(_.partial(associateDatasets, getOriginDatasets, patientOriginOUPayload));
                    }
                });
            };

            return getEnrichedModule($scope.module)
                .then(createModules)
                .then(_.partial(associateDatasets, getAssociatedDatasets, [enrichedModule]))
                .then(_.partial(saveExcludedDataElements, enrichedModule))
                .then(createOrgUnitGroups)
                .then(createOriginOrgUnits)
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
            if (_.isEmpty(item))
                return;
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
            $scope.selectedDataset = undefined;
        };

        $scope.isAfterMaxDate = function() {
            return moment($scope.module.openingDate).isAfter(moment($scope.thisDate));
        };

        init();
    };
});
