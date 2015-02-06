define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "datasetTransformer", "programTransformer", "md5"], function(_, orgUnitMapper, moment, systemSettingsTransformer, datasetTransformer, programTransformer, md5) {
    return function($scope, $hustle, orgUnitService, orgUnitRepository, datasetRepository, systemSettingRepository, db, $location, $q, $modal, programRepository, orgUnitGroupRepository, orgUnitGroupHelper) {
        $scope.originalDatasets = [];
        $scope.isExpanded = {};
        $scope.isDisabled = false;
        $scope.thisDate = (moment().add(1, 'day')).toDate();
        $scope.module = {};
        $scope.allModules = [];

        $scope.allDatasets = [];
        $scope.associatedDatasets = [];
        $scope.selectedDataset = {};
        $scope.excludedDataElements = [];

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
                return systemSettingRepository.getAllWithProjectId($scope.module.parent.id).then(function(systemSettings) {
                    if (!_.isEmpty(systemSettings) && !_.isEmpty(systemSettings.value) && !_.isEmpty(systemSettings.value.excludedDataElements))
                        $scope.excludedDataElements = systemSettings.value.excludedDataElements[$scope.module.id];
                });
            };


            var setUpModule = function(data) {
                var isDisabled = _.find($scope.module.attributeValues, {
                    "attribute": {
                        "code": "isDisabled"
                    }
                });
                $scope.isDisabled = isDisabled && isDisabled.value;
                $scope.updateDisabled = $scope.isDisabled;
            };

            var dataSetPromise = function(){
                return datasetRepository.getAll().then(function(ds) {
                    return datasetRepository.getEnrichedDatasets(ds);
                });
            };

            var getAllDataSets = function(associatedDatasets) {
                var allDatasetsExceptAssociatedDataSets = _.reject($scope.originalDatasets, function(dataset) {
                    return _.any(associatedDatasets, {
                        "id": dataset.id
                    });
                });
                return allDatasetsExceptAssociatedDataSets;
            };

            var setUpData = function(data) {
                $scope.originalDatasets = data[0];
                $scope.excludedDataElements = data[2] && data[2].value && data[2].value.excludedDataElements ? data[2].value.excludedDataElements : {};
                $scope.associatedDatasets = data[1];
                $scope.allDatasets = getAllDataSets($scope.associatedDatasets);
                $scope.selectedDataset = $scope.associatedDatasets ? $scope.associatedDatasets[0] : [];
            };
            var getAllAssociatedDataSets = function() {
                if (!$scope.module.id) return [];
                return datasetRepository.getAllForOrgUnit($scope.module.id).then(function(ds) {
                    return datasetRepository.getEnrichedDatasets(ds);
                });
            };

            var getAllData = function() {
                return $q.all([dataSetPromise(),
                    getAllAssociatedDataSets(),
                    systemSettingRepository.getAllWithProjectId($scope.module.parent.id)
                ]);
            };

            initModule().then(getAllData).then(setUpData).then(getAllModules).then(getExcludedDataElements).then(setUpModule);
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

        $scope.createModules = function(module) {
            var parent = $scope.module.parent;
            var enrichedModule = orgUnitMapper.mapToModule(module);
            parent.children = parent.children.concat(enrichedModule);
            return $q.all([orgUnitRepository.upsert(parent), orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit")])
                .then(function() {
                    return enrichedModule;
                });
        };

        var disableModule = function(module) {
            var enrichedModules = orgUnitMapper.mapToModule(module, module.id, 6);
            var payload = orgUnitMapper.disable([enrichedModules]);
            $scope.isDisabled = true;
            $q.all([orgUnitRepository.upsert(payload[0]), publishMessage(payload[0], "upsertOrgUnit")]).then(function() {
                if ($scope.$parent.closeNewForm) $scope.$parent.closeNewForm(module, "disabledModule");
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

        $scope.disable = function() {
            showModal(function() {
                disableModule($scope.module);
            }, $scope.resourceBundle.disableOrgUnitConfirmationMessage);
        };

        $scope.onError = function(data) {
            $scope.saveFailure = true;
        };

        var saveSystemSettingsForExcludedDataElements = function(parent, enrichedModule) {
            var saveSystemSettings = function(excludedDataElements, projectId) {
                return systemSettingRepository.getAllWithProjectId(projectId).then(function(data) {
                    var existingSystemSettings = (_.isEmpty(data) || _.isEmpty(data.value) || _.isEmpty(data.value.excludedDataElements)) ? {} : data.value.excludedDataElements;
                    var systemSettingsPayload = _.cloneDeep(existingSystemSettings);
                    systemSettingsPayload[enrichedModule.id] = excludedDataElements;
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
            var excludedDataElements = systemSettingsTransformer.excludedDataElementsForAggregateModule($scope.associatedDatasets);
            return saveSystemSettings(excludedDataElements, parent.id);
        };

        $scope.save = function(module) {
            var onSuccess = function(enrichedModule) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.module, "savedModule");
                return enrichedModule;
            };

            var associateDatasets = function(enrichedModule) {
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

                return $q.all(addOrgUnits()).then(updateDataSets).then(function() {
                    return enrichedModule;
                });
            };

            var saveAggregateModules = function() {
                return $scope.createModules($scope.module)
                    .then(associateDatasets);
            };

            var createOrgUnitGroups = function() {
                var enrichedmodule = orgUnitMapper.mapToModule($scope.module);
                return orgUnitGroupHelper.createOrgUnitGroups([enrichedmodule], false);
            };

            saveAggregateModules()
                .then(_.curry(saveSystemSettingsForExcludedDataElements)($scope.module.parent))
                .then(createOrgUnitGroups)
                .then(onSuccess, $scope.onError);
        };

        $scope.update = function() {
            var onSuccess = function(data) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(enrichedModule, "savedModule");
            };

            var enrichedModule = orgUnitMapper.mapToModule($scope.module, $scope.module.id, 6);

            return $q.all([saveSystemSettingsForExcludedDataElements($scope.module.parent, enrichedModule),
                    orgUnitRepository.upsert(enrichedModule),
                    publishMessage(enrichedModule, "upsertOrgUnit")
                ])
                .then(onSuccess, $scope.onError);
        };

        $scope.areDatasetsNotSelected = function() {
            return _.isEmpty($scope.associatedDatasets);
        };

        $scope.areNoSectionsSelected = function() {
            return _.isEmpty($scope.selectedDataset);
        };

        $scope.shouldDisableSaveOrUpdateButton = function() {
            return $scope.areDatasetsNotSelected() || $scope.areNoDataElementsSelectedForSection();
        };

        $scope.areNoDataElementsSelectedForSection = function() {
            return !_.isEmpty($scope.selectedDataset) && _.all($scope.selectedDataset.sections, function(section) {
                return _.all(section.dataElements, {
                    "isIncluded": false
                });
            });
        };

        $scope.changeDataElementSelection = function(section) {
            _.each(section.dataElements, function(dataElement) {
                dataElement.isIncluded = section.isIncluded;
            });
        };

        $scope.changeSectionSelection = function(section) {
            section.isIncluded = _.any(section.dataElements, {
                "isIncluded": true
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

        $scope.isAfterMaxDate = function(module) {
            if (module.openingDate === undefined)
                return true;
            return false;
        };

        init();
    };
});